import { musicBrainzService } from "./musicbrainz.service.js";
import { aiService } from "../ai/ai.service.js";

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
 * Adapter ensuring backward compatibility with ingestion-queue and legacy scripts,
 * now delegating to the unified aiService backed by @google/genai (gemini-2.5-flash).
 */
export class AIOrchestratorService {
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

  async generateForWork(
    mbid: string,
    metadata?: { title: string; artist: string },
  ): Promise<GeneratedArrangement> {
    let work: { title: string; artist: string } | undefined = metadata;
    if (!work) {
      const details = await musicBrainzService.getRecordingDetails(mbid);
      if (details) work = details;
    }

    if (!work) throw new Error(`Recording metadata not found for ${mbid}`);

    this.log(`Generating structured arrangement with gemini-2.5-flash for "${work.title}" by "${work.artist}"...`);

    const result = await aiService.generateArrangement({
      title: work.title,
      artist: work.artist,
    });

    // Map to GeneratedArrangement format
    return {
      confidence: result.confidence,
      source: result.source,
      key: result.key,
      bpm: result.bpm,
      timeSignature: result.timeSignature,
      sections: result.sections.map((s, sIdx) => ({
        id: `s${sIdx}`,
        type: s.type,
        name: s.name,
        lines: s.lines.map((l, lIdx) => ({
          id: `l${sIdx}-${lIdx}`,
          source: l.source,
        })),
      })),
    };
  }
}

export const aiOrchestrator = new AIOrchestratorService();
