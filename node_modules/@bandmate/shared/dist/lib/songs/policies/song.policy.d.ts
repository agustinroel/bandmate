import type { Song, SongDetail } from "../song.model.js";
export declare const SongPolicy: {
    canEdit(song: Song | SongDetail | null | undefined): boolean;
    canDelete(song: Song | null | undefined): boolean;
    /**
     * Transpose is always a visual-only concern (MVP rule)
     */
    canPersistTranspose(_song: Song | SongDetail | null | undefined): boolean;
};
//# sourceMappingURL=song.policy.d.ts.map