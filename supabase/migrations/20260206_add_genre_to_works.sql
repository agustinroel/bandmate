-- Migration: Add genre column to song_works table
-- Date: 2026-02-06

ALTER TABLE song_works 
ADD COLUMN IF NOT EXISTS genre text;

-- Index for faster filtering
CREATE INDEX IF NOT EXISTS idx_song_works_genre ON song_works(genre);

COMMENT ON COLUMN song_works.genre IS 'Primary genre from MusicBrainz';
