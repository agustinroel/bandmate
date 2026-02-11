-- Migration: Add import and link columns to legacy songs table
-- Date: 2026-02-09

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS is_imported BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS spotify_id TEXT,
  ADD COLUMN IF NOT EXISTS musicbrainz_id TEXT,
  ADD COLUMN IF NOT EXISTS work_id UUID REFERENCES public.song_works(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin_arrangement_id UUID REFERENCES public.arrangements(id) ON DELETE SET NULL;

-- Indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_songs_musicbrainz ON public.songs(musicbrainz_id);
CREATE INDEX IF NOT EXISTS idx_songs_spotify ON public.songs(spotify_id);
CREATE INDEX IF NOT EXISTS idx_songs_work_id ON public.songs(work_id);

COMMENT ON COLUMN public.songs.is_imported IS 'True if the song was created via external API ingestion';
COMMENT ON COLUMN public.songs.work_id IS 'Reference to the canonical Work in Camino 2 schema';
COMMENT ON COLUMN public.songs.origin_arrangement_id IS 'Reference to the specific Arrangement generated during ingestion';
