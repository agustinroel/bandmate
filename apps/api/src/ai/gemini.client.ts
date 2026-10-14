import { GoogleGenAI } from "@google/genai";
import type { AiTier } from "@bandmate/shared";

/**
 * Model tiers.
 *  - fast → real-time work: categorization, lyric/chord streaming.
 *  - deep → harmonic analysis, reharmonization, setlist suggestions (queued).
 *
 * Overridable via env so ops can roll models without a deploy
 * (Gemini 2.5 access is restricted for new projects).
 */
export const DEFAULT_MODELS: Record<AiTier, string> = {
  fast: "gemini-2.5-flash",
  deep: "gemini-2.5-pro",
};

export function resolveModel(tier: AiTier): string {
  const override =
    tier === "fast"
      ? process.env.GEMINI_FAST_MODEL
      : process.env.GEMINI_DEEP_MODEL;
  return override?.trim() || DEFAULT_MODELS[tier];
}

/** Minimal surface of the SDK we depend on — makes the client mockable. */
export type GeminiModelsApi = Pick<
  GoogleGenAI["models"],
  "generateContent" | "generateContentStream"
>;
export interface GeminiClientLike {
  models: GeminiModelsApi;
}

let client: GeminiClientLike | null = null;

export function getApiKey(): string | undefined {
  // GOOGLE_GENAI_API_KEY kept for backwards compatibility with existing envs.
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
}

export function hasGeminiCredentials(): boolean {
  return client !== null || !!getApiKey();
}

/** Returns the shared client, or null when no API key is configured. */
export function getGeminiClient(): GeminiClientLike | null {
  if (client) return client;
  const apiKey = getApiKey();
  if (!apiKey) return null;
  client = new GoogleGenAI({ apiKey });
  return client;
}

/** Test seam: inject a fake client (or reset with `null`). */
export function setGeminiClient(next: GeminiClientLike | null): void {
  client = next;
}
