// apps/api/src/seed/seed-arrangements.ts

export type SeedArrangement = {
  workSlug: string;

  // para distinguir “curado” vs “comunidad”
  source: "community" | "official" | "public-domain";
  isSeed: boolean;

  key?: string;
  bpm?: number | string;
  durationSec?: number;
  notes?: string;
  links?: string[];
  tags?: string[];
  capo?: number;
  timeSignature?: string;

  sections: any[];
};

const chordLine = (id: string, chords: string) => ({
  id,
  kind: "lyrics",
  // ✅ “lyrics” line type, but content is only chords / rehearsal cues
  source: chords,
});

const commentLine = (id: string, text: string) => ({
  id,
  kind: "comment",
  text,
});

export const SEED_ARRANGEMENTS: SeedArrangement[] = [
  // =========================
  // Amazing Grace (Public Domain - Complete Chords & Lyrics)
  // =========================
  {
    workSlug: "amazing-grace-traditional",
    source: "public-domain",
    isSeed: true,
    key: "G",
    bpm: 72,
    durationSec: 210,
    timeSignature: "3/4",
    notes: "Public domain arrangement with full chords and lyrics.",
    tags: ["hymn", "traditional", "chords-and-lyrics"],
    sections: [
      {
        id: "ag-v1",
        type: "verse",
        name: "Verse 1",
        order: 1,
        lines: [
          chordLine("ag-v1-1", "[G]Amazing grace, how [C]sweet the sound,"),
          chordLine("ag-v1-2", "That [G]saved a wretch like [D]me;"),
          chordLine("ag-v1-3", "I [G]once was lost, but [C]now am found,"),
          chordLine("ag-v1-4", "Was [G]blind, but [D]now I [G]see."),
        ],
      },
      {
        id: "ag-v2",
        type: "verse",
        name: "Verse 2",
        order: 2,
        lines: [
          chordLine("ag-v2-1", "[G]'Twas grace that taught my [C]heart to fear,"),
          chordLine("ag-v2-2", "And [G]grace my fears re[D]lieved;"),
          chordLine("ag-v2-3", "How [G]precious did that [C]grace appear"),
          chordLine("ag-v2-4", "The [G]hour I [D]first be[G]lieved."),
        ],
      },
    ],
  },
  // =========================
  // Auld Lang Syne (Public Domain - Complete Chords & Lyrics)
  // =========================
  {
    workSlug: "auld-lang-syne-traditional",
    source: "public-domain",
    isSeed: true,
    key: "G",
    bpm: 84,
    durationSec: 180,
    timeSignature: "4/4",
    notes: "Public domain folk song with full chords and lyrics.",
    tags: ["folk", "traditional", "chords-and-lyrics"],
    sections: [
      {
        id: "als-v1",
        type: "verse",
        name: "Verse 1",
        order: 1,
        lines: [
          chordLine("als-v1-1", "Should [G]auld acquaintance be for[C]got,"),
          chordLine("als-v1-2", "And [G]never brought to [D]mind?"),
          chordLine("als-v1-3", "Should [G]auld acquaintance be for[C]got,"),
          chordLine("als-v1-4", "And [G]days of [D]auld lang [G]syne!"),
        ],
      },
      {
        id: "als-c",
        type: "chorus",
        name: "Chorus",
        order: 2,
        lines: [
          chordLine("als-c-1", "For [G]auld lang [C]syne, my dear,"),
          chordLine("als-c-2", "For [G]auld lang [D]syne,"),
          chordLine("als-c-3", "We'll [G]take a cup o' [C]kindness yet,"),
          chordLine("als-c-4", "For [G]auld lang [D]syne!"),
        ],
      },
    ],
  },
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
    notes:
      "Seed arrangement (SAFE): chords + structure only. No copyrighted lyrics included.",
    tags: ["placeholder", "rehearsal", "no-lyrics"],
    sections: [
      {
        id: "cr-intro",
        type: "intro",
        name: "Intro",
        order: 1,
        lines: [
          commentLine(
            "cr-intro-1",
            "Chord loop (x2 or x4 depending on version)",
          ),
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
          commentLine(
            "cr-v-3",
            "Sing verse melody over this loop (no lyrics).",
          ),
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
          commentLine(
            "cr-br-1",
            "Optional: add alt bridge once you decide the version.",
          ),
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
    notes:
      "Seed arrangement (SAFE): chords + structure only. No copyrighted lyrics included.",
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
    notes:
      "Seed arrangement (SAFE): riffs/chords + structure only. No copyrighted lyrics included.",
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
          commentLine(
            "slts-v-1",
            "Verse uses the same cycle (lighter dynamics).",
          ),
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
    notes:
      "Seed arrangement (SAFE): groove/chords + structure only. No copyrighted lyrics included.",
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
    notes:
      "Seed arrangement (SAFE): chord progression + structure only. No copyrighted lyrics included.",
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
