-- ==============================================================================
-- Migration: 20261015_community_persistence.sql
-- Description: Adds tables for community social feed, comments, likes, follows,
--              and audition applications for permanent Supabase PostgreSQL persistence.
-- ==============================================================================

-- 1. Community Follows
create table if not exists public.community_follows (
  follower_id text not null,
  followed_id text not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id)
);

create index if not exists idx_community_follows_follower on public.community_follows(follower_id);
create index if not exists idx_community_follows_followed on public.community_follows(followed_id);

-- 2. Community Posts
create table if not exists public.community_posts (
  id text primary key,
  author_id text not null,
  author_name text not null,
  author_username text not null,
  author_avatar text null,
  author_instruments jsonb not null default '[]'::jsonb,
  author_tier text null default 'free',
  author_band text null,
  is_band_verified boolean not null default false,
  reposted_by text null,
  reposted_by_name text null,
  type text not null default 'status',
  content text not null,
  attached_song jsonb null,
  media_url text null,
  media_type text null,
  youtube_id text null,
  tags jsonb not null default '[]'::jsonb,
  likes_count int not null default 0,
  reposts_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_community_posts_author on public.community_posts(author_id);
create index if not exists idx_community_posts_created on public.community_posts(created_at desc);

-- 3. Community Comments
create table if not exists public.community_comments (
  id text primary key,
  post_id text not null,
  author_id text not null,
  author_name text not null,
  author_username text not null,
  author_avatar text null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_comments_post on public.community_comments(post_id);

-- 4. Community Likes
create table if not exists public.community_likes (
  user_id text not null,
  post_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists idx_community_likes_post on public.community_likes(post_id);

-- 5. Audition Applications
create table if not exists public.audition_applications (
  id text primary key,
  post_id text not null,
  musician_id text not null,
  musician_name text not null,
  musician_username text null,
  musician_avatar text null,
  instrument text not null,
  experience_years int not null default 0,
  media_url text null,
  message text not null,
  status text not null default 'pending',
  private_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_audition_apps_post on public.audition_applications(post_id);
create index if not exists idx_audition_apps_musician on public.audition_applications(musician_id);

-- Enable RLS
alter table public.community_follows enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.audition_applications enable row level security;

-- Policies: allow public read, authenticated write
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'community_follows_select') then
    create policy community_follows_select on public.community_follows for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'community_follows_all') then
    create policy community_follows_all on public.community_follows for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'community_posts_select') then
    create policy community_posts_select on public.community_posts for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'community_posts_all') then
    create policy community_posts_all on public.community_posts for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'community_comments_select') then
    create policy community_comments_select on public.community_comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'community_comments_all') then
    create policy community_comments_all on public.community_comments for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'community_likes_select') then
    create policy community_likes_select on public.community_likes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'community_likes_all') then
    create policy community_likes_all on public.community_likes for all using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'audition_applications_select') then
    create policy audition_applications_select on public.audition_applications for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'audition_applications_all') then
    create policy audition_applications_all on public.audition_applications for all using (true) with check (true);
  end if;
end $$;

-- 6. User Notifications
create table if not exists public.notifications (
  id text primary key default gen_random_uuid()::text,
  user_id text not null,
  type text not null,
  title text not null,
  message text null,
  data jsonb null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

alter table public.notifications enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'notifications_all') then
    create policy notifications_all on public.notifications for all using (true) with check (true);
  end if;
end $$;

