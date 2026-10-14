// apps/api/src/seed/seed-arrangements.ts
const chordLine = (id, chords) => ({
    id,
    kind: "lyrics",
    // ✅ “lyrics” line type, but content is only chords / rehearsal cues
    source: chords,
});
const commentLine = (id, text) => ({
    id,
    kind: "comment",
    text,
});
export const SEED_ARRANGEMENTS = [
    // =========================
    // Radiohead — Creep (SAFE)
    // =========================
    {
        workSlug: "radiohead-creep",
        source: "community",
        isSeed: true,
        key: "G",
        bpm: 92,
        durationSec: 240,
        timeSignature: "4/4",
        notes: "Seed arrangement (SAFE): chords + structure only. No copyrighted lyrics included.",
        tags: ["placeholder", "rehearsal", "no-lyrics"],
        sections: [
            {
                id: "cr-intro",
                type: "intro",
                name: "Intro",
                order: 1,
                lines: [
                    commentLine("cr-intro-1", "Chord loop (x2 or x4 depending on version)"),
                    chordLine("cr-intro-2", "[G] [B] [C] [Cm]"),
                ],
            },
            {
                id: "cr-v",
                type: "verse",
                name: "Verse",
                order: 2,
                lines: [
                    commentLine("cr-v-1", "Verse progression (repeat)"),
                    chordLine("cr-v-2", "[G] [B] [C] [Cm]"),
                    commentLine("cr-v-3", "Sing verse melody over this loop (no lyrics)."),
                ],
            },
            {
                id: "cr-ch",
                type: "chorus",
                name: "Chorus",
                order: 3,
                lines: [
                    commentLine("cr-ch-1", "Chorus progression (repeat)"),
                    chordLine("cr-ch-2", "[G] [B] [C] [Cm]"),
                ],
            },
            {
                id: "cr-br",
                type: "bridge",
                name: "Bridge (optional)",
                order: 4,
                lines: [
                    commentLine("cr-br-1", "Optional: add alt bridge once you decide the version."),
                    chordLine("cr-br-2", "[Em] [G] [C] [D]"),
                ],
            },
        ],
    },
    // =========================
    // Oasis — Wonderwall (SAFE)
    // =========================
    {
        workSlug: "oasis-wonderwall",
        source: "community",
        isSeed: true,
        key: "Em",
        bpm: 87,
        durationSec: 260,
        timeSignature: "4/4",
        notes: "Seed arrangement (SAFE): chords + structure only. No copyrighted lyrics included.",
        tags: ["placeholder", "rehearsal", "no-lyrics"],
        capo: 2,
        sections: [
            {
                id: "ww-intro",
                type: "intro",
                name: "Intro",
                order: 1,
                lines: [
                    commentLine("ww-intro-1", "Common loop (capo 2):"),
                    chordLine("ww-intro-2", "[Em] [G] [Dsus4] [A7sus4]"),
                ],
            },
            {
                id: "ww-v",
                type: "verse",
                name: "Verse",
                order: 2,
                lines: [
                    commentLine("ww-v-1", "Verse loop (repeat):"),
                    chordLine("ww-v-2", "[Em] [G] [Dsus4] [A7sus4]"),
                    commentLine("ww-v-3", "Sing verse melody (no lyrics)."),
                ],
            },
            {
                id: "ww-ch",
                type: "chorus",
                name: "Chorus",
                order: 3,
                lines: [
                    commentLine("ww-ch-1", "Chorus loop (repeat):"),
                    chordLine("ww-ch-2", "[C] [D] [Em] [Em]"),
                ],
            },
        ],
    },
    // ==================================
    // Nirvana — Smells Like Teen Spirit
    // ==================================
    {
        workSlug: "nirvana-smells-like-teen-spirit",
        source: "community",
        isSeed: true,
        key: "F",
        bpm: 116,
        durationSec: 300,
        timeSignature: "4/4",
        notes: "Seed arrangement (SAFE): riffs/chords + structure only. No copyrighted lyrics included.",
        tags: ["placeholder", "rehearsal", "no-lyrics", "riff"],
        sections: [
            {
                id: "slts-riff",
                type: "intro",
                name: "Main riff / progression",
                order: 1,
                lines: [
                    commentLine("slts-riff-1", "Power-chord cycle (typical):"),
                    chordLine("slts-riff-2", "[F5] [Bb5] [Ab5] [Db5]"),
                ],
            },
            {
                id: "slts-v",
                type: "verse",
                name: "Verse",
                order: 2,
                lines: [
                    commentLine("slts-v-1", "Verse uses the same cycle (lighter dynamics)."),
                    chordLine("slts-v-2", "[F5] [Bb5] [Ab5] [Db5]"),
                ],
            },
            {
                id: "slts-ch",
                type: "chorus",
                name: "Chorus",
                order: 3,
                lines: [
                    commentLine("slts-ch-1", "Chorus uses same cycle (full dynamics)."),
                    chordLine("slts-ch-2", "[F5] [Bb5] [Ab5] [Db5]"),
                ],
            },
        ],
    },
    // =========================
    // Michael Jackson — Billie Jean (SAFE)
    // =========================
    {
        workSlug: "michael-jackson-billie-jean",
        source: "community",
        isSeed: true,
        key: "F#m",
        bpm: 117,
        durationSec: 295,
        timeSignature: "4/4",
        notes: "Seed arrangement (SAFE): groove/chords + structure only. No copyrighted lyrics included.",
        tags: ["placeholder", "rehearsal", "no-lyrics", "groove"],
        sections: [
            {
                id: "bj-intro",
                type: "intro",
                name: "Intro / Groove",
                order: 1,
                lines: [
                    commentLine("bj-intro-1", "Keep bass groove; chords as guide:"),
                    chordLine("bj-intro-2", "[F#m] [G#m] [A] [F#m]"),
                ],
            },
            {
                id: "bj-v",
                type: "verse",
                name: "Verse",
                order: 2,
                lines: [
                    commentLine("bj-v-1", "Verse loop (repeat):"),
                    chordLine("bj-v-2", "[F#m] [G#m] [A] [F#m]"),
                ],
            },
            {
                id: "bj-ch",
                type: "chorus",
                name: "Chorus",
                order: 3,
                lines: [
                    commentLine("bj-ch-1", "Chorus loop (repeat):"),
                    chordLine("bj-ch-2", "[D] [E] [F#m] [F#m]"),
                ],
            },
        ],
    },
    // =========================
    // Eagles — Hotel California (SAFE)
    // =========================
    {
        workSlug: "eagles-hotel-california",
        source: "community",
        isSeed: true,
        key: "Bm",
        bpm: 75,
        durationSec: 390,
        timeSignature: "4/4",
        notes: "Seed arrangement (SAFE): chord progression + structure only. No copyrighted lyrics included.",
        tags: ["placeholder", "rehearsal", "no-lyrics"],
        sections: [
            {
                id: "hc-intro",
                type: "intro",
                name: "Intro / Verse progression",
                order: 1,
                lines: [
                    commentLine("hc-intro-1", "Classic progression (repeat):"),
                    chordLine("hc-intro-2", "[Bm] [F#] [A] [E] [G] [D] [Em] [F#]"),
                ],
            },
            {
                id: "hc-solo",
                type: "bridge",
                name: "Solo vamp (optional)",
                order: 2,
                lines: [
                    commentLine("hc-solo-1", "Use the same progression for soloing."),
                    chordLine("hc-solo-2", "[Bm] [F#] [A] [E] [G] [D] [Em] [F#]"),
                ],
            },
        ],
    },
];
