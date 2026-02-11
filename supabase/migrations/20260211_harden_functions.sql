-- Migration: Harden Database Functions (SET search_path)
-- Date: 2026-02-11
-- Resolves Supabase Linter Warning: 0011_function_search_path_mutable

-- 1. Helper Function
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 2. Practice Stats & Summary (Project-specific RPCs)
ALTER FUNCTION public.get_practice_stats(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_practice_summary(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_practice_streak(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_most_practiced_songs(p_user_id uuid, p_limit int) SET search_path = public;
ALTER FUNCTION public.record_song_practice(p_session_id uuid, p_song_id uuid, p_duration_sec int) SET search_path = public;

-- 3. Rating & Community
ALTER FUNCTION public.rate_song(p_song_id uuid, p_value int) SET search_path = public;
ALTER FUNCTION public.rate_arrangement(p_arrangement_id uuid, p_value int) SET search_path = public;

-- 4. Achievements
ALTER FUNCTION public.unlock_achievement(p_user_id uuid, p_achievement_id text) SET search_path = public;
ALTER FUNCTION public.get_user_achievements(p_user_id uuid) SET search_path = public;

-- NOTE: If any function above does not exist in your specific environment, 
-- you can safely skip it or check the schema name.
