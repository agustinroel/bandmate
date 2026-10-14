import { z } from "zod";
import type { GenerateContentConfig } from "@google/genai";
import type { AiTier } from "@bandmate/shared";
import { getGeminiClient, resolveModel } from "./gemini.client.js";
import {
  AiConfigError,
  AiValidationError,
  normalizeAiError,
} from "./ai.errors.js";

/**
 * JSON-Schema keywords Gemini's structured-output mode understands.
 * Anything else (pattern, minLength, $schema, ...) is stripped before sending;
 * Zod still enforces the full contract when parsing the response.
 */
const GEMINI_SCHEMA_KEYS = new Set([
  "type",
  "title",
  "description",
  "properties",
  "required",
  "additionalProperties",
  "enum",
  "format",
  "minimum",
  "maximum",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "nullable",
  "anyOf",
]);

const SAFE_INT = Number.MAX_SAFE_INTEGER;

function sanitize(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(sanitize);
  if (!node || typeof node !== "object") return node;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (!GEMINI_SCHEMA_KEYS.has(key)) continue;
    // Zod emits ±MAX_SAFE_INTEGER bounds for .int(); they are noise for Gemini.
    if ((key === "minimum" || key === "maximum") && Math.abs(value as number) >= SAFE_INT) {
      continue;
    }
    if (key === "properties" && value && typeof value === "object") {
      out[key] = Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)]),
      );
      continue;
    }
    out[key] = sanitize(value);
  }
  return out;
}

/** Zod → Gemini-compatible JSON Schema (output shape). */
export function toGeminiJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io: "output", unrepresentable: "any" });
  return sanitize(json) as Record<string, unknown>;
}

/** Parse raw model text and validate it against the Zod contract. */
export function parseStructured<S extends z.ZodType>(schema: S, text: string): z.infer<S> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiValidationError(
      `Model returned non-JSON payload (${text.length} chars)`,
    );
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const issues = z.prettifyError(result.error);
    throw new AiValidationError("Model output failed schema validation", issues);
  }
  return result.data;
}

export interface StructuredRequest<S extends z.ZodType> {
  tier: AiTier;
  schema: S;
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  signal?: AbortSignal;
}

function buildConfig<S extends z.ZodType>(req: StructuredRequest<S>): GenerateContentConfig {
  const config: GenerateContentConfig = {
    responseMimeType: "application/json",
    responseJsonSchema: toGeminiJsonSchema(req.schema),
    temperature: req.temperature ?? (req.tier === "fast" ? 0.2 : 0.4),
    systemInstruction: req.systemInstruction,
    abortSignal: req.signal,
  };
  // Flash: disable thinking for real-time latency. Pro cannot disable thinking.
  if (req.tier === "fast") {
    config.thinkingConfig = { thinkingBudget: 0 };
  }
  return config;
}

function requireClient() {
  const client = getGeminiClient();
  if (!client) {
    throw new AiConfigError(
      "Gemini API key missing (set GEMINI_API_KEY or GOOGLE_GENAI_API_KEY).",
    );
  }
  return client;
}

/** One-shot structured generation, validated with Zod. */
export async function generateStructured<S extends z.ZodType>(
  req: StructuredRequest<S>,
): Promise<z.infer<S>> {
  const client = requireClient();
  let text: string;
  try {
    const res = await client.models.generateContent({
      model: resolveModel(req.tier),
      contents: req.prompt,
      config: buildConfig(req),
    });
    text = res.text ?? "";
  } catch (err) {
    throw normalizeAiError(err);
  }
  return parseStructured(req.schema, text);
}

export type StructuredStreamEvent<T> =
  | { type: "delta"; text: string }
  | { type: "done"; data: T };

/**
 * Streamed structured generation. Yields raw JSON deltas as they arrive
 * (for progressive UI) and finishes with a single Zod-validated `done` event.
 * Nothing unvalidated is ever surfaced as `data`.
 */
export async function* streamStructured<S extends z.ZodType>(
  req: StructuredRequest<S>,
): AsyncGenerator<StructuredStreamEvent<z.infer<S>>> {
  const client = requireClient();
  let buffer = "";
  try {
    const stream = await client.models.generateContentStream({
      model: resolveModel(req.tier),
      contents: req.prompt,
      config: buildConfig(req),
    });
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        buffer += text;
        yield { type: "delta", text };
      }
    }
  } catch (err) {
    throw normalizeAiError(err);
  }
  yield { type: "done", data: parseStructured(req.schema, buffer) };
}
