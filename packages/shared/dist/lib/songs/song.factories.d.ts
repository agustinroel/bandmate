import { CreateSongDto } from "./song.dto.js";
import type { SongDetail, SongSection, SongLine } from "./song.model.ts";
/**
 * Small helpers to create safe defaults for MVP.
 * These are optional, but super useful to avoid "undefined" headaches.
 */
export declare function createEmptySongDto(): CreateSongDto;
export declare function createEmptySections(): SongSection[];
export declare function createDraftSongDetail(base: {
    id?: string;
    title: string;
    artist: string;
    key?: string;
    bpm?: number | string;
    durationSec?: number | string;
    notes?: string;
    links?: string[];
    sections?: SongSection[];
}): SongDetail;
export declare function createSection(params?: Partial<Omit<SongSection, "lines">> & {
    lines?: SongLine[];
}): SongSection;
export declare function createLine(params?: Partial<SongLine>): SongLine;
export declare function cryptoRandomId(): string;
//# sourceMappingURL=song.factories.d.ts.map