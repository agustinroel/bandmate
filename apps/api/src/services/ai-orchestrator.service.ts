import { GoogleGenerativeAI } from "@google/generative-ai";
import { musicBrainzService } from "./musicbrainz.service.js";

export interface GeneratedSection {
  id: string;
  type: string;
  name: string;
  lines: { id: string; source: string; chords?: string }[];
}

export interface GeneratedArrangement {
  confidence?: number;
  source?: string;
  key: string;
  bpm: number;
  timeSignature: string;
  sections: GeneratedSection[];
}

/**
 * Service to orchestrate AI-driven content generation.
 */
export class AIOrchestratorService {
  private genAI: GoogleGenerativeAI | null = null;
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

  private readonly MODEL_PRIORITY = [
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-pro-latest",
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
        this.logError("CRITICAL: No API Key found in process.env.");
        return this.callMock(work.title, work.artist);
      }
    }

    let lastError: any = null;
    for (const modelName of this.MODEL_PRIORITY) {
      try {
        this.log(
          `Attempting generation with ${modelName} for "${work.title}"...`,
        );
        this.currentModelName = modelName;
        const model = this.genAI.getGenerativeModel({ model: modelName });

        let attempt = 0;
        const maxAttempts = 2;
        while (attempt < maxAttempts) {
          try {
            return await this.realCallLLM(model, work.title, work.artist);
          } catch (err: any) {
            const status = err?.status || err?.response?.status;
            if (status === 429) {
              attempt++;
              if (attempt < maxAttempts) {
                this.log(
                  `Rate limit hit for ${modelName} (${attempt}/${maxAttempts}). Waiting 65s...`,
                );
                await new Promise((r) => setTimeout(r, 65000));
                continue;
              }
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
          errorHint = "API returned HTML instead of JSON (likely 5xx or proxy)";
        }

        this.logError(
          `Model ${modelName} failed for "${work.title}": ${errorHint}`,
        );

        if (status === 429) {
          this.log("Waiting 60s before trying next model after 429...");
          await new Promise((r) => setTimeout(r, 60000));
          continue;
        }
        if (
          status === 404 ||
          status === 403 ||
          err.message?.includes("not found")
        ) {
          continue;
        }
        continue;
      }
    }

    throw new Error(
      `AI Generation failed. Last error: ${lastError?.message || lastError}`,
    );
  }

  private async realCallLLM(
    model: any,
    title: string,
    artist: string,
  ): Promise<GeneratedArrangement> {
    if (!title || !artist) {
      return this.callMock(title || "Unknown", artist || "Unknown");
    }

    const prompt = `
      Act as a professional musicologist, transcriber, and copyright-aware data scientist.
      Song: "${title}" by "${artist}"
      
      Objective:
      Provide a HIGH-FIDELITY arrangement based on VERIFIED musical knowledge.
      
      Requirements:
      1. FIDELITY SELF-ASSESSMENT: You MUST provide a confidence score (0.0 to 1.0) and specify your data source.
      2. LYRICS: Provide the accurate lyrics. 
         IMPORTANT: If you encounter a copyright filter, or if you are NOT 100% sure, return "[LYRICS_RESTRICTED]" for line text.
      3. MUSICAL DATA: Key, Tempo (BPM), and Time Signature.
      4. CHORDS: Use [Dm7], [Gsus4/B]. Place them at the exact syllable.
      
      STRICT FIDELITY RULES:
      - If INSTRUMENTAL, mark sections accordingly and use "[Instrumental]".
      - DO NOT invent lyrics. Accuracy is more important than completeness.
      
      JSON Schema:
      {
        "confidence": number,
        "source": "string",
        "key": "string",
        "bpm": number,
        "timeSignature": "string",
        "sections": [
          { "type": "intro|verse|chorus|bridge|solo|outro", "name": "string", "lines": [ { "source": "string" } ] }
        ]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.05,
        topP: 0.1,
        topK: 1,
        responseMimeType: "application/json",
      },
    });

    const response = await result.response;
    let text = response.text().trim();

    if (text.startsWith("```json")) {
      text = text
        .replace(/^```json/, "")
        .replace(/```$/, "")
        .trim();
    } else if (text.startsWith("```")) {
      text = text.replace(/^```/, "").replace(/```$/, "").trim();
    }

    if (text.includes("{") && text.includes("}")) {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}") + 1;
      text = text.substring(start, end);
    }

    try {
      const data = JSON.parse(text);

      // Trope Detection
      const commonHallucinations = [
        "edge of time",
        "reason and a rhyme",
        "lonely road",
        "before the setting of the sun",
      ];
      const lowerText = text.toLowerCase();
      const detectedTrope = commonHallucinations.find((t) =>
        lowerText.includes(t),
      );

      if (
        detectedTrope &&
        !title.toLowerCase().includes("cage") &&
        !title.toLowerCase().includes("time")
      ) {
        data.confidence = Math.min(data.confidence || 0.5, 0.3);
      }

      if (data.confidence < 0.6) {
        data.sections = data.sections.map((s: any) => ({
          ...s,
          lines: s.lines.map((l: any) => ({
            ...l,
            source: "[LYRICS_RESTRICTED due to low confidence]",
          })),
        }));
      }

      // Add IDs
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
      throw new Error(`Invalid JSON format from AI: ${parseErr.message}`);
    }
  }

  private callMock(
    title: string,
    artist: string,
  ): Promise<GeneratedArrangement> {
    return Promise.resolve({
      key: "Unknown",
      bpm: 0,
      timeSignature: "4/4",
      sections: [
        {
          id: "s1",
          type: "intro",
          name: "Pending AI Processing",
          lines: [{ id: "l1", source: "[...] No API Key provided." }],
        },
      ],
    });
  }
}

export const aiOrchestrator = new AIOrchestratorService();
