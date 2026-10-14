import { describe, it, expect, vi } from "vitest";
import { AiArrangementSchema, AI_TASK_TIERS, } from "@bandmate/shared";
import { toGeminiJsonSchema, parseStructured } from "./structured-output.js";
import { setGeminiClient, resolveModel } from "./gemini.client.js";
import { aiService } from "./ai.service.js";
describe("AI Structured Output & Zod Validation", () => {
    it("maps task tiers correctly to fast (gemini-2.5-flash) and deep (gemini-2.5-pro)", () => {
        expect(AI_TASK_TIERS.arrangement).toBe("fast");
        expect(AI_TASK_TIERS.categorize).toBe("fast");
        expect(AI_TASK_TIERS["harmonic-analysis"]).toBe("deep");
        expect(AI_TASK_TIERS.reharmonize).toBe("deep");
        expect(AI_TASK_TIERS["setlist-suggestion"]).toBe("deep");
        expect(resolveModel("fast")).toBe("gemini-2.5-flash");
        expect(resolveModel("deep")).toBe("gemini-2.5-pro");
    });
    it("converts Zod schema to Gemini-compatible JSON schema", () => {
        const schema = toGeminiJsonSchema(AiArrangementSchema);
        expect(schema).toBeDefined();
        expect(schema.type).toBe("object");
        expect(schema.properties).toBeDefined();
    });
    it("parses and validates structured JSON properly against Zod schema", () => {
        const validArrangement = JSON.stringify({
            confidence: 0.95,
            source: "verified-catalog",
            key: "G",
            bpm: 120,
            timeSignature: "4/4",
            sections: [
                {
                    type: "verse",
                    name: "Verse 1",
                    lines: [{ source: "[G]Some lyrics [C]here" }],
                },
            ],
        });
        const parsed = parseStructured(AiArrangementSchema, validArrangement);
        expect(parsed.key).toBe("G");
        expect(parsed.bpm).toBe(120);
        expect(parsed.sections.length).toBe(1);
    });
    it("generates structured categorization using mock Gemini client", async () => {
        const mockCategorization = {
            genre: "Rock",
            subgenres: ["Alternative", "Indie"],
            mood: "energetic",
            energy: 8,
            difficulty: "intermediate",
            tags: ["upbeat", "live"],
        };
        setGeminiClient({
            models: {
                generateContent: vi.fn().mockResolvedValue({
                    text: JSON.stringify(mockCategorization),
                }),
                generateContentStream: vi.fn(),
            },
        });
        const res = await aiService.categorize({
            title: "Song 2",
            artist: "Blur",
        });
        expect(res.genre).toBe("Rock");
        expect(res.mood).toBe("energetic");
        expect(res.energy).toBe(8);
    });
});
