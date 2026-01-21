export type SongId = string;
/**
 * Chord/lyrics line format (MVP):
 * - Anything inside [ ] is treated as a chord token.
 *   Example: "[Am]Hello [G]world"
 */
export type SongLineKind = "lyrics" | "comment" | "blank";
export type SongLine = {
    id: string;
    kind: SongLineKind;
    /**
     * For kind="lyrics":
     * Inline chord notation. Example: "[Am]Hello [G]world"
     */
    source?: string;
    /**
     * For kind="comment":
     * Free text. Example: "Let ring", "Build intensity"
     */
    text?: string;
};
export type SongSectionType = "verse" | "chorus" | "bridge" | "intro" | "outro" | "prechorus" | "solo" | "other";
export type SongSection = {
    id: string;
    type: SongSectionType;
    name?: string;
    order: number;
    lines: SongLine[];
    repeats?: number;
};
/**
 * Keep your existing Song as "metadata" for lists, CRUD, etc.
 * We'll extend it for the full detail view.
 */
export type Song = {
    id: SongId;
    title: string;
    artist: string;
    /**
     * Legacy / compact representation of key. Example: "Gm", "C", "Am"
     * We'll keep it for now for compatibility.
     */
    key?: string;
    bpm?: number | string;
    durationSec?: number | string;
    notes?: string;
    links?: string[];
    sections?: SongSection[];
    createdAt: string;
    updatedAt: string;
    isSeed: boolean;
};
/**
 * Full/detail song model (MVP v0):
 * - Adds structured content: sections + lines with inline chords
 * - Adds optional versioning
 */
export type SongDetail = Song & {
    version: 1;
    sections: SongSection[];
    tags?: string[];
    isFavorite?: boolean;
    capo?: number;
    timeSignature?: string;
};
//# sourceMappingURL=song.model.d.ts.map