export const SongPolicy = {
    canEdit(song) {
        if (!song)
            return false;
        return song.isSeed !== true;
    },
    canDelete(song) {
        if (!song)
            return false;
        return song.isSeed !== true;
    },
    /**
     * Transpose is always a visual-only concern (MVP rule)
     */
    canPersistTranspose(_song) {
        return false;
    },
};
