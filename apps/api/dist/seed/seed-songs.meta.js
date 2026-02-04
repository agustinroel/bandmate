const now = new Date().toISOString();
const iso = (d) => new Date(d).toISOString();
export const seedSongsMeta = [
    {
        id: "seed-amazing-grace",
        title: "Amazing Grace",
        artist: "John Newton (Traditional Hymn)",
        key: "G",
        bpm: 72,
        durationSec: 210,
        notes: "Public domain hymn. Great for testing Verse repetition + dynamics.",
        links: ["https://en.wikisource.org/wiki/Amazing_Grace"],
        createdAt: iso("2026-01-01"),
        updatedAt: now,
        version: 1,
        isSeed: true,
        sections: [
            {
                id: "ag-v1",
                type: "verse",
                name: "Verse 1",
                order: 1,
                lines: [
                    {
                        id: "ag-v1-1",
                        kind: "lyrics",
                        source: "[G]Amazing grace, how [C]sweet the sound,",
                    },
                    {
                        id: "ag-v1-2",
                        kind: "lyrics",
                        source: "That [G]saved a wretch like [D]me;",
                    },
                    {
                        id: "ag-v1-3",
                        kind: "lyrics",
                        source: "I [G]once was lost, but [C]now am found,",
                    },
                    {
                        id: "ag-v1-4",
                        kind: "lyrics",
                        source: "Was [G]blind, but [D]now I [G]see.",
                    },
                ],
            },
            {
                id: "ag-v2",
                type: "verse",
                name: "Verse 2",
                order: 2,
                lines: [
                    {
                        id: "ag-v2-1",
                        kind: "lyrics",
                        source: "[G]'Twas grace that taught my [C]heart to fear,",
                    },
                    {
                        id: "ag-v2-2",
                        kind: "lyrics",
                        source: "And [G]grace my fears re[D]lieved;",
                    },
                    {
                        id: "ag-v2-3",
                        kind: "lyrics",
                        source: "How [G]precious did that [C]grace appear",
                    },
                    {
                        id: "ag-v2-4",
                        kind: "lyrics",
                        source: "The [G]hour I [D]first be[G]lieved.",
                    },
                ],
            },
            {
                id: "ag-c",
                type: "chorus",
                name: "Tag (optional)",
                order: 3,
                lines: [
                    {
                        id: "ag-c-1",
                        kind: "comment",
                        text: "No chorus in the classic structure; keep as verses. This section is optional.",
                    },
                ],
            },
        ],
    },
    {
        id: "seed-auld-lang-syne",
        title: "Auld Lang Syne",
        artist: "Robert Burns (Traditional)",
        key: "G",
        bpm: 84,
        durationSec: 180,
        notes: "Public domain poem/song. Nice for chorus testing.",
        links: ["https://en.wikisource.org/wiki/Auld_Lang_Syne_(Burns)"],
        createdAt: iso("2026-01-01"),
        updatedAt: now,
        version: 1,
        isSeed: true,
        sections: [
            {
                id: "als-v1",
                type: "verse",
                name: "Verse 1",
                order: 1,
                lines: [
                    {
                        id: "als-v1-1",
                        kind: "lyrics",
                        source: "Should [G]auld acquaintance be for[C]got,",
                    },
                    {
                        id: "als-v1-2",
                        kind: "lyrics",
                        source: "And [G]never brought to [D]mind?",
                    },
                    {
                        id: "als-v1-3",
                        kind: "lyrics",
                        source: "Should [G]auld acquaintance be for[C]got,",
                    },
                    {
                        id: "als-v1-4",
                        kind: "lyrics",
                        source: "And [G]days of [D]auld lang [G]syne!",
                    },
                ],
            },
            {
                id: "als-c",
                type: "chorus",
                name: "Chorus",
                order: 2,
                lines: [
                    {
                        id: "als-c-1",
                        kind: "lyrics",
                        source: "For [G]auld lang [C]syne, my dear,",
                    },
                    {
                        id: "als-c-2",
                        kind: "lyrics",
                        source: "For [G]auld lang [D]syne,",
                    },
                    {
                        id: "als-c-3",
                        kind: "lyrics",
                        source: "We'll [G]take a cup o' [C]kindness yet,",
                    },
                    {
                        id: "als-c-4",
                        kind: "lyrics",
                        source: "For [G]auld lang [D]syne!",
                    },
                ],
            },
        ],
    },
    {
        id: "seed-silent-night",
        title: "Silent Night",
        artist: "Mohr/Gruber (Traditional Carol)",
        key: "C",
        bpm: 66,
        durationSec: 190,
        notes: "Public domain carol. Good for slow scroll + big chords.",
        links: [
            "https://en.wikisource.org/wiki/The_Army_and_Navy_Hymnal/Hymns/Silent_Night,_Holy_Night",
        ],
        createdAt: iso("2026-01-01"),
        updatedAt: now,
        version: 1,
        isSeed: true,
        sections: [
            {
                id: "sn-v1",
                type: "verse",
                name: "Verse 1",
                order: 1,
                lines: [
                    {
                        id: "sn-v1-1",
                        kind: "lyrics",
                        source: "[C]Silent night, [G]holy night,",
                    },
                    {
                        id: "sn-v1-2",
                        kind: "lyrics",
                        source: "[C]All is calm, [G]all is bright",
                    },
                    {
                        id: "sn-v1-3",
                        kind: "lyrics",
                        source: "[F]'Round yon Virgin [C]Mother and Child,",
                    },
                    {
                        id: "sn-v1-4",
                        kind: "lyrics",
                        source: "[F]Holy Infant so [C]tender and mild,",
                    },
                    {
                        id: "sn-v1-5",
                        kind: "lyrics",
                        source: "[G]Sleep in heavenly [C]peace,",
                    },
                    {
                        id: "sn-v1-6",
                        kind: "lyrics",
                        source: "[G]Sleep in heavenly [C]peace.",
                    },
                ],
            },
            {
                id: "sn-v2",
                type: "verse",
                name: "Verse 2",
                order: 2,
                lines: [
                    {
                        id: "sn-v2-1",
                        kind: "lyrics",
                        source: "[C]Silent night, [G]holy night,",
                    },
                    {
                        id: "sn-v2-2",
                        kind: "lyrics",
                        source: "[C]Shepherds quake at the [G]sight;",
                    },
                    {
                        id: "sn-v2-3",
                        kind: "lyrics",
                        source: "[F]Glories stream from [C]heaven afar,",
                    },
                    {
                        id: "sn-v2-4",
                        kind: "lyrics",
                        source: "[F]Heavenly hosts sing [C]Alleluia,",
                    },
                    {
                        id: "sn-v2-5",
                        kind: "lyrics",
                        source: "[G]Christ the Saviour is [C]born,",
                    },
                    {
                        id: "sn-v2-6",
                        kind: "lyrics",
                        source: "[G]Christ the Saviour is [C]born.",
                    },
                ],
            },
        ],
    },
    {
        id: "seed-twinkle-twinkle",
        title: "Twinkle, Twinkle, Little Star",
        artist: "Jane Taylor (Traditional)",
        key: "C",
        bpm: 92,
        durationSec: 120,
        notes: "Simple structure; great for mobile + big font testing.",
        links: ["https://en.wikisource.org/wiki/Rhymes_for_the_Nursery/The_Star"],
        createdAt: iso("2026-01-01"),
        updatedAt: now,
        version: 1,
        isSeed: true,
        sections: [
            {
                id: "tt-v1",
                type: "verse",
                name: "Verse",
                order: 1,
                lines: [
                    {
                        id: "tt-v1-1",
                        kind: "lyrics",
                        source: "[C]Twinkle, twinkle, [F]little star,",
                    },
                    {
                        id: "tt-v1-2",
                        kind: "lyrics",
                        source: "[C]How I wonder [G]what you are!",
                    },
                    {
                        id: "tt-v1-3",
                        kind: "lyrics",
                        source: "[C]Up above the [F]world so high,",
                    },
                    {
                        id: "tt-v1-4",
                        kind: "lyrics",
                        source: "[C]Like a diamond [G]in the sky.",
                    },
                ],
            },
            {
                id: "tt-v2",
                type: "verse",
                name: "Verse (alt)",
                order: 2,
                lines: [
                    {
                        id: "tt-v2-1",
                        kind: "lyrics",
                        source: "[C]When the blazing [F]sun is gone,",
                    },
                    {
                        id: "tt-v2-2",
                        kind: "lyrics",
                        source: "[C]When he nothing [G]shines upon,",
                    },
                    {
                        id: "tt-v2-3",
                        kind: "lyrics",
                        source: "[C]Then you show your [F]little light,",
                    },
                    {
                        id: "tt-v2-4",
                        kind: "lyrics",
                        source: "[C]Twinkle, twinkle, [G]all the night.",
                    },
                ],
            },
        ],
    },
    {
        id: "seed-clementine",
        title: "Clementine",
        artist: "Barker Bradford (1885)",
        key: "D",
        bpm: 96,
        durationSec: 170,
        notes: "Classic folk ballad. Public domain in the US (pre-1931).",
        links: ["https://en.wikisource.org/wiki/Clementine_(Bradford)"],
        createdAt: iso("2026-01-01"),
        updatedAt: now,
        version: 1,
        isSeed: true,
        sections: [
            {
                id: "cl-v1",
                type: "verse",
                name: "Verse 1",
                order: 1,
                lines: [
                    {
                        id: "cl-v1-1",
                        kind: "lyrics",
                        source: "In a [D]cavern, in a [G]canyon,",
                    },
                    {
                        id: "cl-v1-2",
                        kind: "lyrics",
                        source: "Exca[D]vating for a [A]mine,",
                    },
                    {
                        id: "cl-v1-3",
                        kind: "lyrics",
                        source: "Dwelt a [D]miner, forty-[G]niner,",
                    },
                    {
                        id: "cl-v1-4",
                        kind: "lyrics",
                        source: "And his [D]daughter, [A]Clement[D]ine.",
                    },
                ],
            },
            {
                id: "cl-c",
                type: "chorus",
                name: "Chorus",
                order: 2,
                lines: [
                    {
                        id: "cl-c-1",
                        kind: "lyrics",
                        source: "Oh my [D]darling, oh my [G]darling,",
                    },
                    {
                        id: "cl-c-2",
                        kind: "lyrics",
                        source: "Oh my [D]darling [A]Clement[D]ine,",
                    },
                    {
                        id: "cl-c-3",
                        kind: "lyrics",
                        source: "Thou art [D]lost and gone for[G]ever,",
                    },
                    {
                        id: "cl-c-4",
                        kind: "lyrics",
                        source: "Dreadful [D]sorry, [A]Clement[D]ine.",
                    },
                ],
            },
        ],
    },
    {
        id: "seed-down-by-the-riverside",
        title: "Down by the Riverside",
        artist: "Traditional Spiritual",
        key: "E",
        bpm: 104,
        durationSec: 200,
        notes: "Hymnary marks this text as Public Domain. Great for call/response feel.",
        links: ["https://hymnary.org/text/gonna_lay_down_my_sword_and_shield"],
        createdAt: iso("2026-01-01"),
        updatedAt: now,
        version: 1,
        isSeed: true,
        sections: [
            {
                id: "dbr-c",
                type: "chorus",
                name: "Chorus",
                order: 1,
                lines: [
                    {
                        id: "dbr-c-1",
                        kind: "lyrics",
                        source: "Ain't gonna [E]study war no [A]more,",
                    },
                    {
                        id: "dbr-c-2",
                        kind: "lyrics",
                        source: "Ain't gonna [E]study war no [B]more,",
                    },
                    {
                        id: "dbr-c-3",
                        kind: "lyrics",
                        source: "Ain't gonna [E]study war no [A]more,",
                    },
                    {
                        id: "dbr-c-4",
                        kind: "lyrics",
                        source: "[E]Down by the [B]rivers[E]ide.",
                    },
                ],
            },
            {
                id: "dbr-v1",
                type: "verse",
                name: "Verse 1",
                order: 2,
                lines: [
                    {
                        id: "dbr-v1-1",
                        kind: "lyrics",
                        source: "Gonna [E]lay down my [A]sword and shield,",
                    },
                    {
                        id: "dbr-v1-2",
                        kind: "lyrics",
                        source: "[E]Down by the [B]rivers[E]ide,",
                    },
                ],
            },
            {
                id: "dbr-v2",
                type: "verse",
                name: "Verse 2",
                order: 3,
                lines: [
                    {
                        id: "dbr-v2-1",
                        kind: "lyrics",
                        source: "Gonna [E]put on my [A]long white robe,",
                    },
                    {
                        id: "dbr-v2-2",
                        kind: "lyrics",
                        source: "[E]Down by the [B]rivers[E]ide,",
                    },
                ],
            },
        ],
    },
    {
        id: "seed-scarborough-fair",
        title: "Scarborough Fair",
        artist: "Traditional English Ballad",
        key: "Am",
        bpm: 78,
        durationSec: 220,
        notes: "Traditional ballad. Beware modern arrangements; stick to traditional lyric sets.",
        links: ["https://en.wikipedia.org/wiki/Scarborough_Fair_(ballad)"],
        createdAt: iso("2026-01-01"),
        updatedAt: now,
        version: 1,
        isSeed: true,
        sections: [
            {
                id: "sf-v1",
                type: "verse",
                name: "Verse 1",
                order: 1,
                lines: [
                    {
                        id: "sf-v1-1",
                        kind: "lyrics",
                        source: "Are you [Am]going to [G]Scarborough [Am]Fair?",
                    },
                    {
                        id: "sf-v1-2",
                        kind: "lyrics",
                        source: "[Am]Parsley, [G]sage, rose[Am]mary and thyme,",
                    },
                    {
                        id: "sf-v1-3",
                        kind: "lyrics",
                        source: "Re[Am]member me to one who [G]lives [Am]there,",
                    },
                    {
                        id: "sf-v1-4",
                        kind: "lyrics",
                        source: "For [Am]once she was a [G]true love of [Am]mine.",
                    },
                ],
            },
            {
                id: "sf-v2",
                type: "verse",
                name: "Verse 2",
                order: 2,
                lines: [
                    {
                        id: "sf-v2-1",
                        kind: "lyrics",
                        source: "Tell her to [Am]make me a [G]cambric [Am]shirt,",
                    },
                    {
                        id: "sf-v2-2",
                        kind: "lyrics",
                        source: "[Am]Parsley, [G]sage, rose[Am]mary and thyme,",
                    },
                    {
                        id: "sf-v2-3",
                        kind: "lyrics",
                        source: "With[Am]out any seam nor [G]needle[Am]work,",
                    },
                    {
                        id: "sf-v2-4",
                        kind: "lyrics",
                        source: "And [Am]then she'll be a [G]true love of [Am]mine.",
                    },
                ],
            },
        ],
    },
    {
        id: "seed-greensleeves",
        title: "Greensleeves",
        artist: "Traditional (16th century)",
        key: "Em",
        bpm: 80,
        durationSec: 210,
        notes: "Traditional text variant. Great for minor-key rehearsal vibe.",
        links: [
            "https://en.wikisource.org/wiki/A_Handful_of_Pleasant_Delights/A_new_Courtly_Sonet,_of_the_Lady_Greensleeues",
        ],
        createdAt: iso("2026-01-01"),
        updatedAt: now,
        version: 1,
        isSeed: true,
        sections: [
            {
                id: "gs-v1",
                type: "verse",
                name: "Verse (traditional text)",
                order: 1,
                lines: [
                    {
                        id: "gs-v1-1",
                        kind: "lyrics",
                        source: "[Em]Greensleeves was all my [D]joy,",
                    },
                    {
                        id: "gs-v1-2",
                        kind: "lyrics",
                        source: "[C]Greensleeves was my de[Em]light;",
                    },
                    {
                        id: "gs-v1-3",
                        kind: "lyrics",
                        source: "[Em]Greensleeves was my heart of [D]gold,",
                    },
                    {
                        id: "gs-v1-4",
                        kind: "lyrics",
                        source: "And [C]who but Lady [B7]Greenslee[Em]ves.",
                    },
                ],
            },
            {
                id: "gs-v2",
                type: "verse",
                name: "Verse 2",
                order: 2,
                lines: [
                    {
                        id: "gs-v2-1",
                        kind: "lyrics",
                        source: "Alas my [Em]love, you do me [D]wrong,",
                    },
                    {
                        id: "gs-v2-2",
                        kind: "lyrics",
                        source: "To [C]cast me off discourteous[Em]ly;",
                    },
                    {
                        id: "gs-v2-3",
                        kind: "lyrics",
                        source: "And I have [Em]loved you so [D]long,",
                    },
                    {
                        id: "gs-v2-4",
                        kind: "lyrics",
                        source: "De[C]lighting in your [B7]company[Em].",
                    },
                ],
            },
        ],
    },
];
