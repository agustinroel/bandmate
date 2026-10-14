import {
  AI_TASK_TIERS,
  AiArrangementSchema,
  AiCategorizationSchema,
  AiHarmonicAnalysisSchema,
  AiReharmonizationSchema,
  AiSetlistSuggestionSchema,
  type AiArrangement,
  type AiCategorization,
  type AiDeepJobRequest,
  type ArrangementStreamRequest,
  type CategorizeRequest,
} from "@bandmate/shared";
import { generateStructured, streamStructured } from "./structured-output.js";

const MUSICOLOGIST =
  "You are a professional musicologist and transcriber working for Bandmate, " +
  "an app for gigging musicians. Be precise, never invent facts, and respect copyright.";

const ARRANGEMENT_RULES = `
Rules:
1. Self-assess fidelity: "confidence" 0.0–1.0 and "source" (where the knowledge comes from).
2. Lyrics: if you hit a copyright filter or are not certain, use "[LYRICS_RESTRICTED]" as the line source.
3. Musical data: key, bpm, timeSignature (e.g. "4/4").
4. Chords inline in brackets at the exact syllable: "[Dm7]Hello [Gsus4/B]world".
5. Instrumental passages: use "[Instrumental]" lines with the chord changes.
6. Accuracy over completeness — DO NOT invent lyrics.`;

function songLine(title: string, artist: string) {
  return `Song: "${title}" by "${artist}"`;
}

export function arrangementPrompt(req: ArrangementStreamRequest): string {
  return `${songLine(req.title, req.artist)}\nProduce a high-fidelity chord/lyrics arrangement.\n${ARRANGEMENT_RULES}`;
}

/**
 * Domain-level AI service. Each method declares its tier via AI_TASK_TIERS so
 * the flash/pro split lives in one place (@bandmate/shared).
 */
export const aiService = {
  /** fast — synchronous quick categorization. */
  categorize(req: CategorizeRequest, signal?: AbortSignal): Promise<AiCategorization> {
    const excerpt = req.lyricsExcerpt ? `\nLyrics excerpt:\n${req.lyricsExcerpt}` : "";
    return generateStructured({
      tier: AI_TASK_TIERS.categorize,
      schema: AiCategorizationSchema,
      systemInstruction: MUSICOLOGIST,
      prompt: `${songLine(req.title, req.artist)}${excerpt}\nCategorize this song for a band's repertoire.`,
      temperature: 0.1,
      signal,
    });
  },

  /** fast — one-shot arrangement (used by ingestion workers). */
  generateArrangement(req: ArrangementStreamRequest, signal?: AbortSignal): Promise<AiArrangement> {
    return generateStructured({
      tier: AI_TASK_TIERS.arrangement,
      schema: AiArrangementSchema,
      systemInstruction: MUSICOLOGIST,
      prompt: arrangementPrompt(req),
      temperature: 0.05,
      signal,
    });
  },

  /** fast — streamed arrangement for real-time UI. */
  streamArrangement(req: ArrangementStreamRequest, signal?: AbortSignal) {
    return streamStructured({
      tier: AI_TASK_TIERS.arrangement,
      schema: AiArrangementSchema,
      systemInstruction: MUSICOLOGIST,
      prompt: arrangementPrompt(req),
      temperature: 0.05,
      signal,
    });
  },

  /** deep — dispatched from the BullMQ worker (or inline fallback). */
  runDeepTask(job: AiDeepJobRequest, signal?: AbortSignal): Promise<unknown> {
    switch (job.task) {
      case "harmonic-analysis": {
        const { title, artist, key, chordSheet } = job.input;
        return generateStructured({
          tier: AI_TASK_TIERS["harmonic-analysis"],
          schema: AiHarmonicAnalysisSchema,
          systemInstruction: MUSICOLOGIST,
          prompt:
            `Perform a functional harmonic analysis of "${title}"${artist ? ` by ${artist}` : ""}.` +
            `${key ? ` Declared key: ${key}.` : ""}\n` +
            `Use roman numerals relative to the detected key, identify cadences per section and any modulations.\n` +
            `Chord sheet (inline [chords]):\n${chordSheet}`,
          signal,
        });
      }
      case "reharmonize": {
        const { title, key, chordSheet, style } = job.input;
        return generateStructured({
          tier: AI_TASK_TIERS.reharmonize,
          schema: AiReharmonizationSchema,
          systemInstruction: MUSICOLOGIST,
          prompt:
            `Propose up to 5 reharmonizations of the main progression of "${title}"` +
            `${key ? ` (key ${key})` : ""}${style ? ` in a ${style} style` : ""}.\n` +
            `Each must keep the melody singable, name the technique and explain voice-leading briefly.\n` +
            `Chord sheet:\n${chordSheet}`,
          signal,
        });
      }
      case "setlist-suggestion": {
        const { goal, targetDurationMin, songs } = job.input;
        const knownIds = new Set(songs.map((s) => s.id));
        return generateStructured({
          tier: AI_TASK_TIERS["setlist-suggestion"],
          schema: AiSetlistSuggestionSchema,
          systemInstruction: MUSICOLOGIST,
          prompt:
            `Build a setlist. Goal: ${goal}.` +
            `${targetDurationMin ? ` Target duration: ~${targetDurationMin} minutes.` : ""}\n` +
            `Only use songIds from this repertoire; optimise key/tempo/energy flow between songs.\n` +
            `Repertoire (JSON):\n${JSON.stringify(songs)}`,
          signal,
        }).then((res) => ({
          ...res,
          // Never trust the model with foreign keys: drop hallucinated songIds.
          items: res.items
            .filter((i) => knownIds.has(i.songId))
            .map((i, idx) => ({ ...i, position: idx + 1 })),
        }));
      }
    }
  },
};

export type AiService = typeof aiService;
