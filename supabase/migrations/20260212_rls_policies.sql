-- Migration: RLS Policies for all core tables
-- Date: 2026-02-12
-- Fix: cast BOTH sides to text to handle mixed uuid/text column types.

-- ============================================================
-- songs
-- ============================================================
CREATE POLICY "Users can CRUD own songs" ON public.songs
  FOR ALL USING (owner_id::text = auth.uid()::text);

CREATE POLICY "Anyone can read seed songs" ON public.songs
  FOR SELECT USING (is_seed = true);

-- ============================================================
-- setlists
-- ============================================================
CREATE POLICY "Users can CRUD own setlists" ON public.setlists
  FOR ALL USING (owner_id::text = auth.uid()::text);

-- ============================================================
-- setlist_items (via setlist ownership)
-- ============================================================
CREATE POLICY "Users manage own setlist items" ON public.setlist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.setlists
      WHERE id = setlist_items.setlist_id
        AND owner_id::text = auth.uid()::text
    )
  );

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "Public profiles readable by all" ON public.profiles
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (id::text = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id::text = auth.uid()::text);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id::text = auth.uid()::text);

-- ============================================================
-- arrangements (public read, author write)
-- ============================================================
CREATE POLICY "Arrangements publicly readable" ON public.arrangements
  FOR SELECT USING (true);

CREATE POLICY "Authors manage own arrangements" ON public.arrangements
  FOR ALL USING (author_user_id::text = auth.uid()::text);

-- ============================================================
-- song_works (read-only public, managed by service role)
-- ============================================================
CREATE POLICY "Song works readable by all" ON public.song_works
  FOR SELECT USING (true);

-- ============================================================
-- song_ratings
-- ============================================================
CREATE POLICY "Ratings readable by all" ON public.song_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users manage own song ratings" ON public.song_ratings
  FOR ALL USING (user_id::text = auth.uid()::text);

-- ============================================================
-- arrangement_ratings
-- ============================================================
CREATE POLICY "Arrangement ratings readable" ON public.arrangement_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users manage own arrangement ratings" ON public.arrangement_ratings
  FOR ALL USING (user_id::text = auth.uid()::text);

-- ============================================================
-- practice_sessions (only owner)
-- ============================================================
CREATE POLICY "Users CRUD own practice sessions" ON public.practice_sessions
  FOR ALL USING (user_id::text = auth.uid()::text);

-- ============================================================
-- practice_session_songs (via session ownership)
-- ============================================================
CREATE POLICY "Users CRUD own session songs" ON public.practice_session_songs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions
      WHERE id = practice_session_songs.session_id
        AND user_id::text = auth.uid()::text
    )
  );

-- ============================================================
-- user_achievements (only owner)
-- ============================================================
CREATE POLICY "Users read own achievements" ON public.user_achievements
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);
