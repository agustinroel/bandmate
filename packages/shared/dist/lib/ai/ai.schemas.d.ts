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
/** `fast` → gemini-2.5-flash (real-time). `deep` → gemini-2.5-pro (queued). */
export declare const AiTierSchema: z.ZodEnum<{
    fast: "fast";
    deep: "deep";
}>;
export type AiTier = z.infer<typeof AiTierSchema>;
export declare const AiTaskSchema: z.ZodEnum<{
    arrangement: "arrangement";
    categorize: "categorize";
    "harmonic-analysis": "harmonic-analysis";
    reharmonize: "reharmonize";
    "setlist-suggestion": "setlist-suggestion";
}>;
export type AiTask = z.infer<typeof AiTaskSchema>;
/** Which model tier each task runs on. Deep tasks are always queued. */
export declare const AI_TASK_TIERS: Record<AiTask, AiTier>;
export declare const AI_DEEP_TASKS: Array<"harmonic-analysis" | "reharmonize" | "setlist-suggestion">;
/** Mirrors `SongSectionType` from song.model.ts. */
export declare const AiSectionTypeSchema: z.ZodEnum<{
    verse: "verse";
    chorus: "chorus";
    bridge: "bridge";
    intro: "intro";
    outro: "outro";
    prechorus: "prechorus";
    solo: "solo";
    other: "other";
}>;
/** Chord symbol such as `Am`, `Dm7`, `Gsus4/B`, `F#m7b5`. */
export declare const ChordSymbolSchema: z.ZodString;
export declare const TimeSignatureSchema: z.ZodString;
export declare const AiArrangementLineSchema: z.ZodObject<{
    source: z.ZodString;
}, z.core.$strip>;
export declare const AiArrangementSectionSchema: z.ZodObject<{
    type: z.ZodEnum<{
        verse: "verse";
        chorus: "chorus";
        bridge: "bridge";
        intro: "intro";
        outro: "outro";
        prechorus: "prechorus";
        solo: "solo";
        other: "other";
    }>;
    name: z.ZodString;
    lines: z.ZodArray<z.ZodObject<{
        source: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const AiArrangementSchema: z.ZodObject<{
    confidence: z.ZodNumber;
    source: z.ZodString;
    key: z.ZodString;
    bpm: z.ZodNumber;
    timeSignature: z.ZodString;
    sections: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            verse: "verse";
            chorus: "chorus";
            bridge: "bridge";
            intro: "intro";
            outro: "outro";
            prechorus: "prechorus";
            solo: "solo";
            other: "other";
        }>;
        name: z.ZodString;
        lines: z.ZodArray<z.ZodObject<{
            source: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AiArrangement = z.infer<typeof AiArrangementSchema>;
export declare const AiCategorizationSchema: z.ZodObject<{
    genre: z.ZodString;
    subgenres: z.ZodArray<z.ZodString>;
    mood: z.ZodEnum<{
        happy: "happy";
        sad: "sad";
        energetic: "energetic";
        calm: "calm";
        dark: "dark";
        romantic: "romantic";
        epic: "epic";
        melancholic: "melancholic";
    }>;
    energy: z.ZodNumber;
    difficulty: z.ZodEnum<{
        beginner: "beginner";
        intermediate: "intermediate";
        advanced: "advanced";
    }>;
    tags: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type AiCategorization = z.infer<typeof AiCategorizationSchema>;
export declare const AiHarmonicAnalysisSchema: z.ZodObject<{
    key: z.ZodString;
    mode: z.ZodEnum<{
        other: "other";
        ionian: "ionian";
        dorian: "dorian";
        phrygian: "phrygian";
        lydian: "lydian";
        mixolydian: "mixolydian";
        aeolian: "aeolian";
        locrian: "locrian";
        "harmonic-minor": "harmonic-minor";
        "melodic-minor": "melodic-minor";
    }>;
    progression: z.ZodArray<z.ZodObject<{
        chord: z.ZodString;
        romanNumeral: z.ZodString;
        function: z.ZodEnum<{
            tonic: "tonic";
            subdominant: "subdominant";
            dominant: "dominant";
            "secondary-dominant": "secondary-dominant";
            borrowed: "borrowed";
            chromatic: "chromatic";
            passing: "passing";
        }>;
    }, z.core.$strip>>;
    cadences: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<{
            other: "other";
            authentic: "authentic";
            plagal: "plagal";
            half: "half";
            deceptive: "deceptive";
        }>;
        chords: z.ZodArray<z.ZodString>;
        section: z.ZodString;
    }, z.core.$strip>>;
    modulations: z.ZodArray<z.ZodObject<{
        fromKey: z.ZodString;
        toKey: z.ZodString;
        section: z.ZodString;
    }, z.core.$strip>>;
    summary: z.ZodString;
}, z.core.$strip>;
export type AiHarmonicAnalysis = z.infer<typeof AiHarmonicAnalysisSchema>;
export declare const AiReharmonizationSchema: z.ZodObject<{
    original: z.ZodArray<z.ZodString>;
    suggestions: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        technique: z.ZodEnum<{
            other: "other";
            "tritone-substitution": "tritone-substitution";
            "modal-interchange": "modal-interchange";
            "secondary-dominants": "secondary-dominants";
            "diatonic-substitution": "diatonic-substitution";
            "chromatic-approach": "chromatic-approach";
            "pedal-point": "pedal-point";
            "extended-harmony": "extended-harmony";
        }>;
        progression: z.ZodArray<z.ZodString>;
        difficulty: z.ZodEnum<{
            beginner: "beginner";
            intermediate: "intermediate";
            advanced: "advanced";
        }>;
        explanation: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type AiReharmonization = z.infer<typeof AiReharmonizationSchema>;
export declare const AiSetlistSuggestionSchema: z.ZodObject<{
    name: z.ZodString;
    rationale: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        songId: z.ZodString;
        position: z.ZodNumber;
        transitionNote: z.ZodString;
    }, z.core.$strip>>;
    estimatedDurationSec: z.ZodNumber;
}, z.core.$strip>;
export type AiSetlistSuggestion = z.infer<typeof AiSetlistSuggestionSchema>;
/** Map task → output schema. Used by API (generation) and Web (re-validation). */
export declare const AI_OUTPUT_SCHEMAS: {
    readonly arrangement: z.ZodObject<{
        confidence: z.ZodNumber;
        source: z.ZodString;
        key: z.ZodString;
        bpm: z.ZodNumber;
        timeSignature: z.ZodString;
        sections: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<{
                verse: "verse";
                chorus: "chorus";
                bridge: "bridge";
                intro: "intro";
                outro: "outro";
                prechorus: "prechorus";
                solo: "solo";
                other: "other";
            }>;
            name: z.ZodString;
            lines: z.ZodArray<z.ZodObject<{
                source: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    readonly categorize: z.ZodObject<{
        genre: z.ZodString;
        subgenres: z.ZodArray<z.ZodString>;
        mood: z.ZodEnum<{
            happy: "happy";
            sad: "sad";
            energetic: "energetic";
            calm: "calm";
            dark: "dark";
            romantic: "romantic";
            epic: "epic";
            melancholic: "melancholic";
        }>;
        energy: z.ZodNumber;
        difficulty: z.ZodEnum<{
            beginner: "beginner";
            intermediate: "intermediate";
            advanced: "advanced";
        }>;
        tags: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    readonly "harmonic-analysis": z.ZodObject<{
        key: z.ZodString;
        mode: z.ZodEnum<{
            other: "other";
            ionian: "ionian";
            dorian: "dorian";
            phrygian: "phrygian";
            lydian: "lydian";
            mixolydian: "mixolydian";
            aeolian: "aeolian";
            locrian: "locrian";
            "harmonic-minor": "harmonic-minor";
            "melodic-minor": "melodic-minor";
        }>;
        progression: z.ZodArray<z.ZodObject<{
            chord: z.ZodString;
            romanNumeral: z.ZodString;
            function: z.ZodEnum<{
                tonic: "tonic";
                subdominant: "subdominant";
                dominant: "dominant";
                "secondary-dominant": "secondary-dominant";
                borrowed: "borrowed";
                chromatic: "chromatic";
                passing: "passing";
            }>;
        }, z.core.$strip>>;
        cadences: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<{
                other: "other";
                authentic: "authentic";
                plagal: "plagal";
                half: "half";
                deceptive: "deceptive";
            }>;
            chords: z.ZodArray<z.ZodString>;
            section: z.ZodString;
        }, z.core.$strip>>;
        modulations: z.ZodArray<z.ZodObject<{
            fromKey: z.ZodString;
            toKey: z.ZodString;
            section: z.ZodString;
        }, z.core.$strip>>;
        summary: z.ZodString;
    }, z.core.$strip>;
    readonly reharmonize: z.ZodObject<{
        original: z.ZodArray<z.ZodString>;
        suggestions: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            technique: z.ZodEnum<{
                other: "other";
                "tritone-substitution": "tritone-substitution";
                "modal-interchange": "modal-interchange";
                "secondary-dominants": "secondary-dominants";
                "diatonic-substitution": "diatonic-substitution";
                "chromatic-approach": "chromatic-approach";
                "pedal-point": "pedal-point";
                "extended-harmony": "extended-harmony";
            }>;
            progression: z.ZodArray<z.ZodString>;
            difficulty: z.ZodEnum<{
                beginner: "beginner";
                intermediate: "intermediate";
                advanced: "advanced";
            }>;
            explanation: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    readonly "setlist-suggestion": z.ZodObject<{
        name: z.ZodString;
        rationale: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            songId: z.ZodString;
            position: z.ZodNumber;
            transitionNote: z.ZodString;
        }, z.core.$strip>>;
        estimatedDurationSec: z.ZodNumber;
    }, z.core.$strip>;
};
export declare const SongRefSchema: z.ZodObject<{
    title: z.ZodString;
    artist: z.ZodString;
}, z.core.$strip>;
export declare const CategorizeRequestSchema: z.ZodObject<{
    title: z.ZodString;
    artist: z.ZodString;
    lyricsExcerpt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CategorizeRequest = z.infer<typeof CategorizeRequestSchema>;
export declare const ArrangementStreamRequestSchema: z.ZodObject<{
    title: z.ZodString;
    artist: z.ZodString;
}, z.core.$strip>;
export type ArrangementStreamRequest = z.infer<typeof ArrangementStreamRequestSchema>;
export declare const AiDeepJobRequestSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    task: z.ZodLiteral<"harmonic-analysis">;
    input: z.ZodObject<{
        title: z.ZodString;
        artist: z.ZodOptional<z.ZodString>;
        key: z.ZodOptional<z.ZodString>;
        chordSheet: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    task: z.ZodLiteral<"reharmonize">;
    input: z.ZodObject<{
        title: z.ZodString;
        artist: z.ZodOptional<z.ZodString>;
        key: z.ZodOptional<z.ZodString>;
        chordSheet: z.ZodString;
        style: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    task: z.ZodLiteral<"setlist-suggestion">;
    input: z.ZodObject<{
        goal: z.ZodString;
        targetDurationMin: z.ZodOptional<z.ZodNumber>;
        songs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            artist: z.ZodOptional<z.ZodString>;
            key: z.ZodOptional<z.ZodString>;
            bpm: z.ZodOptional<z.ZodNumber>;
            durationSec: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>], "task">;
export type AiDeepJobRequest = z.infer<typeof AiDeepJobRequestSchema>;
export declare const AiJobStateSchema: z.ZodEnum<{
    unknown: "unknown";
    waiting: "waiting";
    active: "active";
    delayed: "delayed";
    completed: "completed";
    failed: "failed";
}>;
export type AiJobState = z.infer<typeof AiJobStateSchema>;
export declare const AiJobAcceptedSchema: z.ZodObject<{
    jobId: z.ZodString;
    task: z.ZodEnum<{
        arrangement: "arrangement";
        categorize: "categorize";
        "harmonic-analysis": "harmonic-analysis";
        reharmonize: "reharmonize";
        "setlist-suggestion": "setlist-suggestion";
    }>;
    tier: z.ZodEnum<{
        fast: "fast";
        deep: "deep";
    }>;
    mode: z.ZodEnum<{
        queued: "queued";
        inline: "inline";
    }>;
}, z.core.$strip>;
export type AiJobAccepted = z.infer<typeof AiJobAcceptedSchema>;
export declare const AiJobStatusSchema: z.ZodObject<{
    jobId: z.ZodString;
    task: z.ZodEnum<{
        arrangement: "arrangement";
        categorize: "categorize";
        "harmonic-analysis": "harmonic-analysis";
        reharmonize: "reharmonize";
        "setlist-suggestion": "setlist-suggestion";
    }>;
    state: z.ZodEnum<{
        unknown: "unknown";
        waiting: "waiting";
        active: "active";
        delayed: "delayed";
        completed: "completed";
        failed: "failed";
    }>;
    attemptsMade: z.ZodNumber;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AiJobStatus = z.infer<typeof AiJobStatusSchema>;
/** Server-Sent Event payloads for `POST /ai/stream/arrangement`. */
export declare const AiStreamEventSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"delta">;
    text: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"done">;
    data: z.ZodObject<{
        confidence: z.ZodNumber;
        source: z.ZodString;
        key: z.ZodString;
        bpm: z.ZodNumber;
        timeSignature: z.ZodString;
        sections: z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<{
                verse: "verse";
                chorus: "chorus";
                bridge: "bridge";
                intro: "intro";
                outro: "outro";
                prechorus: "prechorus";
                solo: "solo";
                other: "other";
            }>;
            name: z.ZodString;
            lines: z.ZodArray<z.ZodObject<{
                source: z.ZodString;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"error">;
    message: z.ZodString;
}, z.core.$strip>], "type">;
export type AiStreamEvent = z.infer<typeof AiStreamEventSchema>;
//# sourceMappingURL=ai.schemas.d.ts.map