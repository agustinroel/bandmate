-- Songs
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
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

create index if not exists songs_owner_id_idx on public.songs(owner_id);
create index if not exists songs_is_seed_idx on public.songs(is_seed);

-- Setlists
create table if not exists public.setlists (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists setlists_owner_id_idx on public.setlists(owner_id);

-- Setlist items
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

create index if not exists setlist_items_setlist_id_idx on public.setlist_items(setlist_id);
