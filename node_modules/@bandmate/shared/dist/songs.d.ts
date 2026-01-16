export type SongId = string;
export type Song = {
    id: SongId;
    title: string;
    artist: string;
    key?: string;
    bpm?: number | string;
    durationSec?: number | string;
    notes?: string;
    links?: string[];
    createdAt: string;
    updatedAt: string;
};
export type CreateSongDto = {
    title: string;
    artist: string;
    key?: string;
    bpm?: number | string;
    durationSec?: number | string;
    notes?: string;
    links?: string[];
};
export type UpdateSongDto = Partial<CreateSongDto>;
//# sourceMappingURL=songs.d.ts.map