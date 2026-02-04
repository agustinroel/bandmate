/**
 * Seed “Work” (Camino B)
 * - SOLO metadata (título, artista, derechos, notas)
 * - sin letras
 */
export const SEED_WORKS = [
    // ✅ Public domain / traditional (podés meter letras si verificás bien)
    {
        title: "Amazing Grace",
        artist: "John Newton (Traditional Hymn)",
        slug: "amazing-grace-traditional",
        rights: "public-domain",
        rightsNotes: "Traditional hymn / public domain (seed)",
        source: "import",
    },
    {
        title: "Auld Lang Syne",
        artist: "Robert Burns (Traditional)",
        slug: "auld-lang-syne-traditional",
        rights: "public-domain",
        rightsNotes: "Traditional / public domain (seed)",
        source: "import",
    },
    // ⚠️ Copyrighted: SOLO metadata
    {
        title: "Creep",
        artist: "Radiohead",
        slug: "radiohead-creep",
        rights: "copyrighted",
        rightsNotes: "Copyrighted work. Seed arrangement uses chords/structure only (no lyrics).",
        source: "import",
    },
    {
        title: "Wonderwall",
        artist: "Oasis",
        slug: "oasis-wonderwall",
        rights: "copyrighted",
        rightsNotes: "Copyrighted work. Seed arrangement uses chords/structure only (no lyrics).",
        source: "import",
    },
    {
        title: "Smells Like Teen Spirit",
        artist: "Nirvana",
        slug: "nirvana-smells-like-teen-spirit",
        rights: "copyrighted",
        rightsNotes: "Copyrighted work. Seed arrangement uses chords/structure only (no lyrics).",
        source: "import",
    },
    {
        title: "Billie Jean",
        artist: "Michael Jackson",
        slug: "michael-jackson-billie-jean",
        rights: "copyrighted",
        rightsNotes: "Copyrighted work. Seed arrangement uses chords/structure only (no lyrics).",
        source: "import",
    },
    {
        title: "Hotel California",
        artist: "Eagles",
        slug: "eagles-hotel-california",
        rights: "copyrighted",
        rightsNotes: "Copyrighted work. Seed arrangement uses chords/structure only (no lyrics).",
        source: "import",
    },
];
