import { GoogleGenerativeAI } from "@google/generative-ai";
import { musicBrainzService } from "./musicbrainz.service.js";

export interface GeneratedArrangement {
  key: string;
  bpm: number;
  sections: any[];
}

/**
 * Service to orchestrate AI-driven content generation.
 */
export class AIOrchestratorService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private currentModelName: string = "gemini-2.0-flash"; // Default
  private logger: ((msg: string) => void) | null = null;

  public setLogger(logger: (msg: string) => void) {
    this.logger = logger;
  }

  private log(msg: string) {
    if (this.logger) {
      this.logger(msg);
    } else {
      console.log(`[AI] ${msg}`);
    }
  }

  private logError(msg: string, err?: any) {
    const errorMsg = err ? `${msg} ${err.message || err}` : msg;
    if (this.logger) {
      this.logger(`ERROR: ${errorMsg}`);
    } else {
      console.error(`[AI] ERROR: ${errorMsg}`);
    }
  }

  // List of models to try in order of preference
  // These were verified using scripts/list-models.ts
  private readonly MODEL_PRIORITY = [
    "gemini-flash-latest", // Alias for 1.5 Flash - Currently has quota!
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-pro-latest", // Alias for 1.5 Pro
    "gemini-2.0-flash-001",
  ];

  private initModel() {
    if (this.genAI) return;
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logError("No GOOGLE_GENAI_API_KEY found.");
    }
  }

  /**
   * Generates an arrangement, trying multiple models if quota fails.
   */
  async generateForWork(
    mbid: string,
    metadata?: { title: string; artist: string },
  ): Promise<GeneratedArrangement> {
    this.initModel();

    let work: { title: string; artist: string } | undefined = metadata;
    if (!work) {
      const details = await musicBrainzService.getRecordingDetails(mbid);
      if (details) work = details;
    }

    if (!work) throw new Error(`Recording metadata not found for ${mbid}`);

    if (!this.genAI) {
      const apiKey = process.env.GOOGLE_GENAI_API_KEY;
      if (apiKey) {
        this.log("Late-initializing GenAI with found API Key.");
        this.genAI = new GoogleGenerativeAI(apiKey);
      } else {
        this.logError(
          "CRITICAL: No API Key found in process.env during generation.",
        );
        return this.callMock(work.title, work.artist);
      }
    }

    // Attempt generation with priority models
    let lastError: any = null;
    for (const modelName of this.MODEL_PRIORITY) {
      try {
        this.log(
          `Attempting generation with ${modelName} for "${work.title}"...`,
        );
        this.currentModelName = modelName;
        const model = this.genAI.getGenerativeModel({ model: modelName });

        // Retry logic for 429 (Too Many Requests)
        let attempt = 0;
        const maxAttempts = 2;
        while (attempt < maxAttempts) {
          try {
            const result = await this.realCallLLM(
              model,
              work.title,
              work.artist,
            );
            return result;
          } catch (err: any) {
            const status = err?.status || err?.response?.status;
            if (status === 429) {
              attempt++;
              if (attempt < maxAttempts) {
                this.log(
                  `Rate limit hit for ${modelName} (Attempt ${attempt}/${maxAttempts}). Waiting 65s before retry...`,
                );
                await new Promise((r) => setTimeout(r, 65000));
                continue;
              }
              // If we exhausted attempts for this model, we'll wait and then try next model
              this.logError(`Exceeded retries for ${modelName} due to 429.`);
              throw err;
            }
            throw err;
          }
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.response?.status;

        let errorHint = err.message || String(err);
        if (
          errorHint.includes("Unexpected token '<'") ||
          errorHint.includes("<!DOCTYPE")
        ) {
          errorHint =
            "API returned HTML instead of JSON (likely a 5xx error or proxy intercept)";
        }

        this.logError(
          `Model ${modelName} failed for "${work.title}": ${errorHint}`,
        );

        if (status === 429) {
          // If we hit 429, we should wait before trying a different model too!
          this.log("Waiting 60s before trying next model after 429...");
          await new Promise((r) => setTimeout(r, 60000));
          continue;
        }

        if (
          status === 404 ||
          status === 403 ||
          err.message?.includes("not found")
        ) {
          // Continue to next model immediately
          continue;
        }

        // For other errors, continue to next model
        continue;
      }
    }

    throw new Error(
      `AI Generation failed after trying all models. Last error: ${lastError?.message || lastError}`,
    );
  }

  private async realCallLLM(
    model: any,
    title: string,
    artist: string,
  ): Promise<GeneratedArrangement> {
    if (!title || !artist) {
      this.logError("Missing title or artist. Returning minimal arrangement.");
      return this.callMock(title || "Unknown", artist || "Unknown");
    }

    const prompt = `
      Act as a professional musicologist and transcriber.
      Song: "${title}" by "${artist}"
      
      Objective:
      Provide a HIGH-FIDELITY arrangement based on the EXACT studio recording.
      
      Requirements:
      1. Lyrics: Provide the 100% accurate lyrics for the ENTIRE song. Do not truncate.
      2. Musical Data: Key (e.g., "G Major"), Tempo (BPM), and Time Signature (e.g., "4/4").
      3. Structure: Formal sections (Intro, Verse 1, Chorus, etc.).
      4. Chords: Professional, jazz-accurate notation [Dm7], [Gsus4], [Cmaj9]. 
         Place them at the EXACT syllable they change.
      
      STRICT FIDELITY RULES:
      - If you do not have the exact chords/lyrics for this SPECIFIC version (especially for demos or live tracks), 
        set key to "Unknown", bpm to 0, and provide a minimal placeholder structure rather than hallucinating.
      - Never use generic placeholder chords like [C] [G] [Am] [F] for every song.
      - Ensure the output is valid, minified JSON.
      
      JSON Schema:
      {
        "key": "string",
        "bpm": number,
        "timeSignature": "string",
        "sections": [
          { 
            "type": "intro|verse|chorus|bridge|solo|outro", 
            "name": "string", 
            "lines": [ { "source": "Lyric text with [Chords]" } ] 
          }
        ]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.05, // Near-zero for maximum determinism
        topP: 0.1,
        topK: 1,
        responseMimeType: "application/json",
      },
    });
    const response = await result.response;
    let text = response.text().trim();

    // Clean markdown if present
    if (text.startsWith("```json")) {
      text = text
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();
    } else if (text.startsWith("```")) {
      text = text.replace(/^```/, "").replace(/```$/, "").trim();
    }

    // Extraction fallback
    if (text.includes("{") && text.includes("}")) {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}") + 1;
      text = text.substring(start, end);
    }

    try {
      const data = JSON.parse(text);

      // Final sanity check: if the LLM returned our former "Wonderwall" catch
      if (
        title.toLowerCase() !== "wonderwall" &&
        text.includes("B7sus4") &&
        text.includes("Esus4") &&
        data.bpm === 88
      ) {
        throw new Error("AI returned generic placeholder data.");
      }

      // Add IDs to sections/lines if missing
      data.sections = data.sections?.map((s: any, idx: number) => ({
        ...s,
        id: s.id || `s${idx}`,
        lines: s.lines?.map((l: any, lidx: number) => ({
          ...l,
          id: l.id || `l${idx}-${lidx}`,
        })),
      }));

      return data;
    } catch (parseErr: any) {
      this.logError(
        `JSON Parse failed for "${title}". Raw length: ${text.length}`,
      );
      throw new Error(`Invalid JSON format from AI: ${parseErr.message}`);
    }
  }

  private callMock(
    title: string,
    artist: string,
  ): Promise<GeneratedArrangement> {
    // No more "Wonderwall" lies. Return a placeholder structure.
    return Promise.resolve({
      key: "Unknown",
      bpm: 0,
      sections: [
        {
          id: "s1",
          type: "intro",
          name: "Pending AI Processing",
          lines: [
            {
              id: "l1",
              source: "[...] No API Key provided for real generation.",
            },
          ],
        },
      ],
    });
  }

  private async mockFetchLyrics(
    title: string,
    artist: string,
  ): Promise<string> {
    return "Sample lyrics...";
  }

  private async callLLM(
    title: string,
    artist: string,
    lyrics: string,
  ): Promise<GeneratedArrangement> {
    return this.callMock(title, artist);
  }
}

export const aiOrchestrator = new AIOrchestratorService();
