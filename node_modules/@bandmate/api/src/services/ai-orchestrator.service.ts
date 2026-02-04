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

  // List of models to try in order of preference (including new 2.5 versions)
  private readonly MODEL_PRIORITY = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
  ];

  private initModel() {
    if (this.genAI) return;
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      console.warn("[AI-Orchestrator] No GOOGLE_GENAI_API_KEY found.");
    }
  }

  /**
   * Generates an arrangement, trying multiple models if quota fails.
   */
  async generateForWork(mbid: string): Promise<GeneratedArrangement> {
    this.initModel();

    const work = await musicBrainzService.getRecordingDetails(mbid);
    if (!work) throw new Error("Recording not found in MusicBrainz");

    if (!this.genAI) {
      console.warn("[AI-Orchestrator] No API Key, using mock fallback.");
      return this.callMock(work.title, work.artist);
    }

    // Attempt generation with fallback
    let lastError = null;
    for (const modelName of this.MODEL_PRIORITY) {
      try {
        console.log(
          `[AI-Orchestrator] Attempting generation with ${modelName}...`,
        );
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await this.realCallLLM(model, work.title, work.artist);
        this.currentModelName = modelName;
        return result;
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[AI-Orchestrator] Model ${modelName} failed:`,
          err.message || err,
        );

        if (err.message?.includes("404") || err.message?.includes("429")) {
          // Wait 2 seconds before trying the next model to avoid cascading rate limits
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        throw err;
      }
    }

    throw new Error(
      `AI Generation failed after trying all models. Last error: ${lastError?.message}`,
    );
  }

  private async realCallLLM(
    model: any,
    title: string,
    artist: string,
  ): Promise<GeneratedArrangement> {
    const prompt = `
      Act as a professional music transcriber and arranger.
      Song: "${title}" by "${artist}"
      
      Task:
      1. Provide the OFFICIAL and ACCURATE lyrics for the WHOLE song. Do not skip any verses or chorus.
      2. Identify the correct Song Key and Tempo (BPM).
      3. Structure the song into logical sections (Intro, Verse, Chorus, Bridge, Outro).
      4. Place high-quality, musically accurate chords inside square brackets [like this] where they naturally occur in the lyrics.
         Avoid generic chords; use 7ths, add9s, or specific voicings if used in the original recording.
      
      EXAMPLE OUTPUT (for "Wonderwall" by "Oasis"):
      {
        "key": "G Major",
        "bpm": 88,
        "sections": [
          { "type": "intro", "name": "Intro", "lines": [ { "id": "1", "source": "[F#m7] [A] [Esus4] [B7sus4]" } ] },
          { "type": "verse", "name": "Verse 1", "lines": [ { "id": "2", "source": "[F#m7]Today is [A]gonna be the [Esus4]day that they're [B7sus4]gonna throw it back to you" } ] }
        ]
      }

      CRITICAL: Lyrics must match the original recording 100%. If you don't know the exact lyrics, do your best to retrieve them from your knowledge base of professional arrangements.
      
      Output ONLY a valid JSON. No conversational text or markdown blocks.
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        topP: 0.1,
        topK: 1,
        responseMimeType: "application/json",
      },
    });
    const response = await result.response;
    let text = response.text().trim();

    if (text.includes("{") && text.includes("}")) {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}") + 1;
      text = text.substring(start, end);
    }

    return JSON.parse(text);
  }

  private callMock(
    title: string,
    artist: string,
  ): Promise<GeneratedArrangement> {
    // Return Wonderwall mock for testing if everything else fails
    return Promise.resolve({
      key: "G Major",
      bpm: 88,
      sections: [
        {
          id: "s1",
          type: "intro",
          name: "Intro (Mock)",
          lines: [{ id: "l1", source: "[F#m7] [A] [Esus4] [B7sus4]" }],
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
