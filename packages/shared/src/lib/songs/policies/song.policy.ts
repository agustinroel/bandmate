import type { Song, SongDetail } from "../song.model.js";

export const SongPolicy = {
  canEdit(song: Song | SongDetail | null | undefined): boolean {
    if (!song) return false;
    return song.isSeed !== true;
  },

  canDelete(song: Song | null | undefined): boolean {
    if (!song) return false;
    return song.isSeed !== true;
  },

  /**
   * Transpose is always a visual-only concern (MVP rule)
   */
  canPersistTranspose(_song: Song | SongDetail | null | undefined): boolean {
    return false;
  },
};
