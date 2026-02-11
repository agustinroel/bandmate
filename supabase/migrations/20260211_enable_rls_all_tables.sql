-- Migration: Enable Row Level Security (RLS) for all core tables (Self-healing)
-- Date: 2026-02-11

-- Ensure all tables exist before enabling RLS
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  setlist_id uuid REFERENCES public.setlists(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_sec int,
  songs_practiced int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.practice_session_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  duration_sec int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for all core tables
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrangement_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- NOTE: Since RLS is now enabled, existing policies will be Enforced.
-- If a table had RLS disabled but had policies (like public.songs), those policies are now active.
-- If a table has no policies yet, default behavior is "deny all" for non-owners/public.
