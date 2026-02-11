-- =========================
-- Bandmate — schema.sql
-- Backwards compatible:
-- - Keeps public.songs used by current API + setlists
-- - Adds: sections/links/version/source + rating columns
-- - Adds: song_ratings + RPC rate_song()
-- - Adds: vNext tables (song_works, arrangements, arrangement_ratings) for camino 2
-- =========================

-- ---------- Extensions ----------
-- gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------- Generic updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- Songs (legacy + enhanced)
-- =========================
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),

  -- NOTE: keep as text for compatibility with your current code;
  -- later we can migrate to uuid + auth.users.id
  owner_id text,

  is_seed boolean not null default false,

  title text not null,
  artist text not null,

  key text,
  bpm int,
  duration_sec int,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.arrangements enable row level security;

-- Additive (safe) columns for current front + rating + “library/community/public-domain”
alter table public.songs
  add column if not exists version int not null default 1;

alter table public.songs
  add column if not exists sections jsonb not null default '[]'::jsonb;

alter table public.songs
  add column if not exists links jsonb not null default '[]'::jsonb;

alter table public.songs
  add column if not exists source text not null default 'community'
    check (source in ('community','official','public-domain'));

-- Aggregated rating (1..5)
alter table public.songs
  add column if not exists rating_avg numeric(3,2) not null default 0;

alter table public.songs
  add column if not exists rating_count int not null default 0;

alter table public.songs
  add column if not exists is_imported boolean not null default false;

alter table public.songs
  add column if not exists spotify_id text;

alter table public.songs
  add column if not exists musicbrainz_id text;

alter table public.songs
  add column if not exists work_id uuid references public.song_works(id) on delete set null;

alter table public.songs
  add column if not exists origin_arrangement_id uuid references public.arrangements(id) on delete set null;

create index if not exists idx_songs_musicbrainz on public.songs(musicbrainz_id);
create index if not exists idx_songs_spotify on public.songs(spotify_id);
create index if not exists idx_songs_work_id on public.songs(work_id);

  alter table public.song_ratings
  alter column user_id type uuid using user_id::uuid;

create index if not exists songs_owner_id_idx on public.songs(owner_id);
create index if not exists songs_is_seed_idx on public.songs(is_seed);
create index if not exists songs_source_idx on public.songs(source);

-- keep updated_at in sync
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_songs_updated_at'
  ) then
    create trigger trg_songs_updated_at
    before update on public.songs
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- =========================
-- Rating for legacy /songs
-- (so your current GET /songs
-- can return ratingAvg/ratingCount)
-- =========================
create table if not exists public.song_ratings (
  song_id uuid not null references public.songs(id) on delete cascade,
  user_id uuid not null,
  value int not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (song_id, user_id)
);

alter table public.song_ratings enable row level security;

create index if not exists song_ratings_song_id_idx on public.song_ratings(song_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_song_ratings_updated_at'
  ) then
    create trigger trg_song_ratings_updated_at
    before update on public.song_ratings
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- RPC: rate a song (upsert) and refresh aggregate
-- Requires Supabase auth (auth.uid())
create or replace function public.rate_song(p_song_id uuid, p_value int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_value < 1 or p_value > 5 then
    raise exception 'rating must be between 1 and 5';
  end if;

  insert into public.song_ratings (song_id, user_id, value)
  values (p_song_id, auth.uid(), p_value)
  on conflict (song_id, user_id)
  do update set value = excluded.value, updated_at = now();

  update public.songs s
  set
    rating_count = agg.cnt,
    rating_avg = agg.avg,
    updated_at = now()
  from (
    select song_id, count(*)::int as cnt, avg(value)::numeric(3,2) as avg
    from public.song_ratings
    where song_id = p_song_id
    group by song_id
  ) agg
  where s.id = agg.song_id;
end;
$$;


-- =========================
-- Setlists
-- =========================
create table if not exists public.setlists (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.arrangements enable row level security;

create index if not exists setlists_owner_id_idx on public.setlists(owner_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_setlists_updated_at'
  ) then
    create trigger trg_setlists_updated_at
    before update on public.setlists
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- =========================
-- Setlist items
-- =========================
create table if not exists public.setlist_items (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references public.setlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete restrict,
  position int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (setlist_id, song_id),
  unique (setlist_id, position)
);

alter table public.setlist_items enable row level security;

create index if not exists setlist_items_setlist_id_idx on public.setlist_items(setlist_id);
create index if not exists setlist_items_song_id_idx on public.setlist_items(song_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_setlist_items_updated_at'
  ) then
    create trigger trg_setlist_items_updated_at
    before update on public.setlist_items
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- ============================================================
-- vNext (Camino 2) — Work + Arrangement (future endpoints)
-- (No rompe nada hoy; queda listo para migrar luego)
-- ============================================================

create table if not exists public.song_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,

  musicbrainz_id text null,
  wikidata_id text null,

  rights text not null default 'unknown'
    check (rights in ('unknown','public-domain','copyrighted','licensed')),
  rights_notes text null,

  source text not null default 'user'
    check (source in ('musicbrainz','wikidata','user','import')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.arrangements enable row level security;

create index if not exists idx_song_works_title_artist on public.song_works(title, artist);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_song_works_updated_at'
  ) then
    create trigger trg_song_works_updated_at
    before update on public.song_works
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

create table if not exists public.arrangements (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.song_works(id) on delete cascade,

  author_user_id uuid null,

  version int not null default 1,
  sections jsonb not null default '[]'::jsonb,

  key text null,
  bpm text null,
  duration_sec int null,
  notes text null,
  links jsonb null,

  tags jsonb null,
  capo int null,
  time_signature text null,

  source text not null default 'community'
    check (source in ('community','official','public-domain')),
  is_seed boolean not null default false,

  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.arrangements enable row level security;

create index if not exists idx_arrangements_work on public.arrangements(work_id);
create index if not exists idx_arrangements_seed on public.arrangements(is_seed);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_arrangements_updated_at'
  ) then
    create trigger trg_arrangements_updated_at
    before update on public.arrangements
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

create table if not exists public.arrangement_ratings (
  arrangement_id uuid not null references public.arrangements(id) on delete cascade,
  user_id uuid not null,
  value int not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (arrangement_id, user_id)
);

alter table public.arrangement_ratings enable row level security;

create index if not exists idx_arrangement_ratings_arrangement on public.arrangement_ratings(arrangement_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_arrangement_ratings_updated_at'
  ) then
    create trigger trg_arrangement_ratings_updated_at
    before update on public.arrangement_ratings
    for each row
    execute function public.set_updated_at();
  end if;
end $$;

-- RPC: rate arrangement (future)
create or replace function public.rate_arrangement(p_arrangement_id uuid, p_value int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_value < 1 or p_value > 5 then
    raise exception 'rating must be 1..5';
  end if;

  insert into public.arrangement_ratings (arrangement_id, user_id, value)
  values (p_arrangement_id, auth.uid(), p_value)
  on conflict (arrangement_id, user_id)
  do update set value = excluded.value, updated_at = now();

  update public.arrangements a
  set
    rating_count = agg.cnt,
    rating_avg = agg.avg,
    updated_at = now()
  from (
    select arrangement_id, count(*)::int as cnt, avg(value)::numeric(3,2) as avg
    from public.arrangement_ratings
    where arrangement_id = p_arrangement_id
    group by arrangement_id
  ) agg
  where a.id = agg.arrangement_id;
end;
$$;

-- =========================
-- Bandmate — Camino 2 tables
-- Additive: no rompe songs/setlists actuales
-- =========================

-- gen_random_uuid()
create extension if not exists pgcrypto;

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------
-- song_works (la obra)
-- -------------------------
create table if not exists public.song_works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,

  musicbrainz_id text null,
  wikidata_id text null,

  rights text not null default 'unknown'
    check (rights in ('unknown','public-domain','copyrighted','licensed')),
  rights_notes text null,

  source text not null default 'user'
    check (source in ('musicbrainz','wikidata','user','import')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.arrangements enable row level security;

create index if not exists idx_song_works_title_artist on public.song_works(title, artist);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_song_works_updated_at') then
    create trigger trg_song_works_updated_at
    before update on public.song_works
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- -------------------------
-- arrangements (versiones)
-- -------------------------
create table if not exists public.arrangements (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.song_works(id) on delete cascade,

  author_user_id uuid null, -- si luego querés linkear con auth.users

  version int not null default 1,
  sections jsonb not null default '[]'::jsonb,

  key text null,
  bpm text null,
  duration_sec int null,
  notes text null,
  links jsonb not null default '[]'::jsonb,

  tags jsonb null,
  capo int null,
  time_signature text null,

  source text not null default 'community'
    check (source in ('community','official','public-domain')),
  is_seed boolean not null default false,

  rating_avg numeric(3,2) not null default 0,
  rating_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.arrangements enable row level security;

create index if not exists idx_arrangements_work on public.arrangements(work_id);
create index if not exists idx_arrangements_seed on public.arrangements(is_seed);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_arrangements_updated_at') then
    create trigger trg_arrangements_updated_at
    before update on public.arrangements
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- -------------------------
-- arrangement_ratings
-- -------------------------
create table if not exists public.arrangement_ratings (
  arrangement_id uuid not null references public.arrangements(id) on delete cascade,
  user_id uuid not null, -- auth.users.id
  value int not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (arrangement_id, user_id)
);

alter table public.arrangement_ratings enable row level security;

create index if not exists idx_arrangement_ratings_arrangement
on public.arrangement_ratings(arrangement_id);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_arrangement_ratings_updated_at') then
    create trigger trg_arrangement_ratings_updated_at
    before update on public.arrangement_ratings
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- -------------------------
-- RPC rate_arrangement()
-- -------------------------
create or replace function public.rate_arrangement(p_arrangement_id uuid, p_value int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_value < 1 or p_value > 5 then
    raise exception 'rating must be 1..5';
  end if;

  insert into public.arrangement_ratings (arrangement_id, user_id, value)
  values (p_arrangement_id, auth.uid(), p_value)
  on conflict (arrangement_id, user_id)
  do update set value = excluded.value, updated_at = now();

  update public.arrangements a
  set
    rating_count = agg.cnt,
    rating_avg   = agg.avg,
    updated_at   = now()
  from (
    select arrangement_id,
           count(*)::int as cnt,
           avg(value)::numeric(3,2) as avg
    from public.arrangement_ratings
    where arrangement_id = p_arrangement_id
    group by arrangement_id
  ) agg
  where a.id = agg.arrangement_id;
end;
$$;

-- =========================
-- Practice Sessions
-- Track user practice time for statistics
-- =========================

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                  -- auth.users.id (stored as uuid for future FK)
  setlist_id uuid references public.setlists(id) on delete set null,
  
  started_at timestamptz not null default now(),
  ended_at timestamptz,                   -- null if still in progress
  duration_sec int,                       -- calculated on end
  
  songs_practiced int not null default 0, -- count of songs viewed during session
  completed boolean not null default false, -- true if reached end of setlist
  
  created_at timestamptz not null default now()
);

create index if not exists idx_practice_sessions_user on public.practice_sessions(user_id);
create index if not exists idx_practice_sessions_started on public.practice_sessions(started_at);
create index if not exists idx_practice_sessions_setlist on public.practice_sessions(setlist_id);

-- New table for granular song tracking
create table if not exists public.practice_session_songs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.practice_sessions(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  started_at timestamptz not null default now(),
  duration_sec int default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_pss_session on public.practice_session_songs(session_id);
create index if not exists idx_pss_song on public.practice_session_songs(song_id);

-- RPC: Get practice stats for a user
-- (keep existing get_practice_stats and get_practice_summary as they use the main session table)

-- RPC: Update song practice duration (called when navigating away from a song)
create or replace function public.record_song_practice(
  p_session_id uuid,
  p_song_id uuid,
  p_duration_sec int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.practice_session_songs (session_id, song_id, duration_sec)
  values (p_session_id, p_song_id, p_duration_sec);
end;
$$;

-- UPDATED RPC: Get most practiced songs using granular tracking
create or replace function public.get_most_practiced_songs(
  p_user_id uuid,
  p_limit int default 5
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json)
    from (
      select 
        s.id,
        s.title,
        s.artist,
        count(pss.id) as practice_count,
        coalesce(sum(pss.duration_sec), 0) as total_seconds
      from public.songs s
      join public.practice_session_songs pss on pss.song_id = s.id
      join public.practice_sessions ps on ps.id = pss.session_id
      where ps.user_id = p_user_id
      group by s.id, s.title, s.artist
      order by practice_count desc, total_seconds desc
      limit p_limit
    ) t
  );
end;
$$;

-- =========================
-- Achievements System
-- =========================

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, -- stored as uuid
  achievement_id text not null, -- slug: 'first_song', 'practice_streak_5', etc.
  unlocked_at timestamptz not null default now(),
  
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create index if not exists idx_user_achievements_user on public.user_achievements(user_id);

-- RPC: Unlock an achievement safely (idempotent)
create or replace function public.unlock_achievement(
  p_user_id uuid,
  p_achievement_id text
)
returns boolean -- returns true if it was newly unlocked
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.user_achievements 
    where user_id = p_user_id and achievement_id = p_achievement_id
  ) then
    return false;
  end if;

  insert into public.user_achievements (user_id, achievement_id)
  values (p_user_id, p_achievement_id);
  
  return true;
end;
$$;

-- RPC: Get user achievements
create or replace function public.get_user_achievements(p_user_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
begin
  return array(
    select achievement_id from public.user_achievements
    where user_id = p_user_id
  );
end;
$$;


-- RPC: Get current practice streak (consecutive days)
create or replace function public.get_practice_streak(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streak int := 0;
  v_current_date date := current_date;
  v_has_today boolean;
begin
  -- Check if practiced today
  select exists(
    select 1 from public.practice_sessions
    where user_id = p_user_id
      and date(started_at) = v_current_date
      and ended_at is not null
  ) into v_has_today;
  
  if not v_has_today then
    v_current_date := v_current_date - 1;
  end if;
  
  -- Count consecutive days backwards
  loop
    exit when not exists(
      select 1 from public.practice_sessions
      where user_id = p_user_id
        and date(started_at) = v_current_date
        and ended_at is not null
    );
    
    v_streak := v_streak + 1;
    v_current_date := v_current_date - 1;
  end loop;
  
  return v_streak;
end;
$$;


-- =========================
-- Final Security: Enable RLS
-- =========================
-- Enabling RLS on all tables to satisfy security lints and best practices.
-- Note: Existing policies will now be enforced.
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
