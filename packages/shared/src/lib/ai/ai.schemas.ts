import { z } from "zod";

/**
 * =========================================================================
 * AI contracts (single source of truth for API <-> Web <-> Gemini).
 *
 * Every Gemini response MUST be produced with Structured Outputs using the
 * JSON Schema derived from these Zod schemas, and MUST be validated with
 * `schema.parse()` before leaving the API. The web app re-validates on read.
 *
 * Gemini's JSON-Schema subset is narrower than Zod's: keep schemas to
 * objects / arrays / enums / primitives with simple min/max constraints.
 * =========================================================================
 */

// -------------------------------------------------------------------------
// Execution tiers
// -------------------------------------------------------------------------

/** `fast` → gemini-2.5-flash (real-time). `deep` → gemini-2.5-pro (queued). */
export const AiTierSchema = z.enum(["fast", "deep"]);
export type AiTier = z.infer<typeof AiTierSchema>;

export const AiTaskSchema = z.enum([
  "arrangement",
  "categorize",
  "harmonic-analysis",
  "reharmonize",
  "setlist-suggestion",
]);
export type AiTask = z.infer<typeof AiTaskSchema>;

/** Which model tier each task runs on. Deep tasks are always queued. */
export const AI_TASK_TIERS: Record<AiTask, AiTier> = {
  arrangement: "fast",
  categorize: "fast",
  "harmonic-analysis": "deep",
  reharmonize: "deep",
  "setlist-suggestion": "deep",
};

export const AI_DEEP_TASKS = AiTaskSchema.options.filter(
  (t) => AI_TASK_TIERS[t] === "deep",
) as Array<"harmonic-analysis" | "reharmonize" | "setlist-suggestion">;

// -------------------------------------------------------------------------
// Shared music primitives
// -------------------------------------------------------------------------

/** Mirrors `SongSectionType` from song.model.ts. */
export const AiSectionTypeSchema = z.enum([
  "intro",
  "verse",
  "prechorus",
  "chorus",
  "bridge",
  "solo",
  "outro",
  "other",
]);

/** Chord symbol such as `Am`, `Dm7`, `Gsus4/B`, `F#m7b5`. */
export const ChordSymbolSchema = z
  .string()
  .min(1)
  .max(16)
  .describe("Chord symbol, e.g. Am, Dm7, Gsus4/B, F#m7b5");

export const TimeSignatureSchema = z
  .string()
  .regex(/^\d{1,2}\/\d{1,2}$/)
  .describe("Time signature such as 4/4, 3/4, 6/8");

// -------------------------------------------------------------------------
// fast: Arrangement (lyrics + inline chords) — streamed
// -------------------------------------------------------------------------

export const AiArrangementLineSchema = z.object({
  source: z
    .string()
    .describe(
      'Lyric line with inline chords in brackets at the exact syllable, e.g. "[Am]Hello [G]world". Use "[LYRICS_RESTRICTED]" when unsure.',
    ),
});

export const AiArrangementSectionSchema = z.object({
  type: AiSectionTypeSchema,
  name: z.string().describe('Human label, e.g. "Verse 1"'),
  lines: z.array(AiArrangementLineSchema),
});

export const AiArrangementSchema = z.object({
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Self-assessed fidelity 0.0–1.0"),
  source: z.string().describe("Where the musical knowledge comes from"),
  key: z.string().describe("Song key, e.g. C, Am, F#m"),
  bpm: z.number().min(0).max(400),
  timeSignature: TimeSignatureSchema,
  sections: z.array(AiArrangementSectionSchema),
});
export type AiArrangement = z.infer<typeof AiArrangementSchema>;

// -------------------------------------------------------------------------
// fast: Quick categorization
// -------------------------------------------------------------------------

export const AiCategorizationSchema = z.object({
  genre: z.string(),
  subgenres: z.array(z.string()).max(5),
  mood: z.enum([
    "happy",
    "sad",
    "energetic",
    "calm",
    "dark",
    "romantic",
    "epic",
    "melancholic",
  ]),
  energy: z.number().int().min(1).max(10),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  tags: z.array(z.string()).max(8),
});
export type AiCategorization = z.infer<typeof AiCategorizationSchema>;

// -------------------------------------------------------------------------
// deep: Harmonic analysis
// -------------------------------------------------------------------------

export const AiHarmonicAnalysisSchema = z.object({
  key: z.string(),
  mode: z.enum([
    "ionian",
    "dorian",
    "phrygian",
    "lydian",
    "mixolydian",
    "aeolian",
    "locrian",
    "harmonic-minor",
    "melodic-minor",
    "other",
  ]),
  progression: z
    .array(
      z.object({
        chord: ChordSymbolSchema,
        romanNumeral: z.string().describe("e.g. I, vi, V7/V, bVII"),
        function: z.enum([
          "tonic",
          "subdominant",
          "dominant",
          "secondary-dominant",
          "borrowed",
          "chromatic",
          "passing",
        ]),
      }),
    )
    .describe("Distinct chords in order of first appearance"),
  cadences: z.array(
    z.object({
      type: z.enum(["authentic", "plagal", "half", "deceptive", "other"]),
      chords: z.array(ChordSymbolSchema),
      section: z.string(),
    }),
  ),
  modulations: z.array(
    z.object({ fromKey: z.string(), toKey: z.string(), section: z.string() }),
  ),
  summary: z.string().describe("2–4 sentences, plain language for musicians"),
});
export type AiHarmonicAnalysis = z.infer<typeof AiHarmonicAnalysisSchema>;

// -------------------------------------------------------------------------
// deep: Reharmonization
// -------------------------------------------------------------------------

export const AiReharmonizationSchema = z.object({
  original: z.array(ChordSymbolSchema),
  suggestions: z
    .array(
      z.object({
        label: z.string(),
        technique: z.enum([
          "tritone-substitution",
          "modal-interchange",
          "secondary-dominants",
          "diatonic-substitution",
          "chromatic-approach",
          "pedal-point",
          "extended-harmony",
          "other",
        ]),
        progression: z.array(ChordSymbolSchema),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        explanation: z.string(),
      }),
    )
    .min(1)
    .max(5),
});
export type AiReharmonization = z.infer<typeof AiReharmonizationSchema>;

// -------------------------------------------------------------------------
// deep: Setlist suggestion
// -------------------------------------------------------------------------

export const AiSetlistSuggestionSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  items: z.array(
    z.object({
      songId: z.string(),
      position: z.number().int().min(1),
      transitionNote: z
        .string()
        .describe("How to segue from the previous song (key/tempo/energy)"),
    }),
  ),
  estimatedDurationSec: z.number().int().min(0),
});
export type AiSetlistSuggestion = z.infer<typeof AiSetlistSuggestionSchema>;

/** Map task → output schema. Used by API (generation) and Web (re-validation). */
export const AI_OUTPUT_SCHEMAS = {
  arrangement: AiArrangementSchema,
  categorize: AiCategorizationSchema,
  "harmonic-analysis": AiHarmonicAnalysisSchema,
  reharmonize: AiReharmonizationSchema,
  "setlist-suggestion": AiSetlistSuggestionSchema,
} as const satisfies Record<AiTask, z.ZodType>;

// -------------------------------------------------------------------------
// Request DTOs (validated at the API boundary)
// -------------------------------------------------------------------------

export const SongRefSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
});

export const CategorizeRequestSchema = SongRefSchema.extend({
  lyricsExcerpt: z.string().max(2000).optional(),
});
export type CategorizeRequest = z.infer<typeof CategorizeRequestSchema>;

export const ArrangementStreamRequestSchema = SongRefSchema;
export type ArrangementStreamRequest = z.infer<
  typeof ArrangementStreamRequestSchema
>;

const ChordSheetSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().max(200).optional(),
  key: z.string().max(8).optional(),
  /** ChordPro-ish inline text: "[Am]Hello [G]world" per line. */
  chordSheet: z.string().min(1).max(20000),
});

export const AiDeepJobRequestSchema = z.discriminatedUnion("task", [
  z.object({ task: z.literal("harmonic-analysis"), input: ChordSheetSchema }),
  z.object({
    task: z.literal("reharmonize"),
    input: ChordSheetSchema.extend({
      style: z.string().max(60).optional(),
    }),
  }),
  z.object({
    task: z.literal("setlist-suggestion"),
    input: z.object({
      goal: z.string().min(1).max(500),
      targetDurationMin: z.number().int().min(5).max(300).optional(),
      songs: z
        .array(
          z.object({
            id: z.string(),
            title: z.string(),
            artist: z.string().optional(),
            key: z.string().optional(),
            bpm: z.number().optional(),
            durationSec: z.number().optional(),
          }),
        )
        .min(1)
        .max(200),
    }),
  }),
]);
export type AiDeepJobRequest = z.infer<typeof AiDeepJobRequestSchema>;

// -------------------------------------------------------------------------
// Job status + streaming envelopes
// -------------------------------------------------------------------------

export const AiJobStateSchema = z.enum([
  "waiting",
  "active",
  "delayed",
  "completed",
  "failed",
  "unknown",
]);
export type AiJobState = z.infer<typeof AiJobStateSchema>;

export const AiJobAcceptedSchema = z.object({
  jobId: z.string(),
  task: AiTaskSchema,
  tier: AiTierSchema,
  mode: z.enum(["queued", "inline"]),
});
export type AiJobAccepted = z.infer<typeof AiJobAcceptedSchema>;

export const AiJobStatusSchema = z.object({
  jobId: z.string(),
  task: AiTaskSchema,
  state: AiJobStateSchema,
  attemptsMade: z.number().int().min(0),
  result: z.unknown().optional(),
  error: z.string().optional(),
});
export type AiJobStatus = z.infer<typeof AiJobStatusSchema>;

/** Server-Sent Event payloads for `POST /ai/stream/arrangement`. */
export const AiStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("delta"), text: z.string() }),
  z.object({ type: z.literal("done"), data: AiArrangementSchema }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type AiStreamEvent = z.infer<typeof AiStreamEventSchema>;
