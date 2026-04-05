-- ============================================================
-- MovieRater — Supabase schema  (v3)
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- Safe to re-run: all statements are idempotent.
-- ============================================================

-- ── media ────────────────────────────────────────────────────
create table if not exists public.media (
  id            bigserial primary key,
  tmdb_id       integer not null,
  media_type    text    not null,
  title         text    not null,
  poster_path   text,
  backdrop_path text,
  overview      text,
  release_date  text,
  genres        jsonb   not null default '[]',
  runtime       integer,
  tmdb_rating   numeric(3,1),
  vote_count    integer,
  tagline       text,
  year          integer,
  watch_providers jsonb default '[]',
  unique (tmdb_id, media_type)
);

-- Fix / replace the media_type check constraint to allow 'film' as well as legacy 'movie'
alter table public.media drop constraint if exists media_media_type_check;
alter table public.media add constraint media_media_type_check
  check (media_type in ('movie', 'tv', 'film'));

-- ── emotions ─────────────────────────────────────────────────
create table if not exists public.emotions (
  id         bigserial primary key,
  name       text not null unique,
  icon       text not null default '🎭',
  color      text not null default '#888888',
  category   text not null default 'Other',
  sort_order integer not null default 99
);

-- Idempotent column additions for existing DBs
alter table public.emotions add column if not exists icon       text    not null default '🎭';
alter table public.emotions add column if not exists color      text    not null default '#888888';
alter table public.emotions add column if not exists category   text    not null default 'Other';
alter table public.emotions add column if not exists sort_order integer not null default 99;

-- Seed / upsert all categorised emotions
-- Happy  #f59e0b · Interested  #3b82f6 · Surprised  #8b5cf6
-- Sad    #6b7280 · Disgusted   #10b981 · Afraid     #f97316 · Angry #ef4444
insert into public.emotions (name, icon, color, category, sort_order) values
  ('Joyful',        '😁', '#f59e0b', 'Happy',      1),
  ('Warm',          '🤗', '#f59e0b', 'Happy',      2),
  ('Touched',       '🥹', '#f59e0b', 'Happy',      3),
  ('Amused',        '😂', '#f59e0b', 'Happy',      4),
  ('Hilarious',     '🤣', '#f59e0b', 'Happy',      5),
  ('In love',       '😍', '#f59e0b', 'Happy',      6),
  ('Curious',       '🤔', '#3b82f6', 'Interested',  1),
  ('Neutral',       '😐', '#3b82f6', 'Interested',  2),
  ('Puzzled',       '😵', '#3b82f6', 'Interested',  3),
  ('Bored',         '😑', '#3b82f6', 'Interested',  4),
  ('Mind-blown',    '🤯', '#3b82f6', 'Interested',  5),
  ('Surprised',     '😮', '#8b5cf6', 'Surprised',   1),
  ('Astonished',    '😲', '#8b5cf6', 'Surprised',   2),
  ('Speechless',    '🫢', '#8b5cf6', 'Surprised',   3),
  ('Shocked',       '😱', '#8b5cf6', 'Surprised',   4),
  ('Disappointed',  '🙁', '#6b7280', 'Sad',         1),
  ('Sad',           '😔', '#6b7280', 'Sad',         2),
  ('Distressed',    '😣', '#6b7280', 'Sad',         3),
  ('Tearful',       '😢', '#6b7280', 'Sad',         4),
  ('Devastated',    '😭', '#6b7280', 'Sad',         5),
  ('Indifferent',   '😶', '#10b981', 'Disgusted',   1),
  ('Uncomfortable', '😬', '#10b981', 'Disgusted',   2),
  ('Disgusted',     '🤢', '#10b981', 'Disgusted',   3),
  ('Revolted',      '🤮', '#10b981', 'Disgusted',   4),
  ('Anxious',       '😟', '#f97316', 'Afraid',      1),
  ('Afraid',        '😰', '#f97316', 'Afraid',      2),
  ('Scared',        '🫣', '#f97316', 'Afraid',      3),
  ('Horrified',     '😱', '#f97316', 'Afraid',      4),
  ('Frustrated',    '😤', '#ef4444', 'Angry',       1),
  ('Irritated',     '😾', '#ef4444', 'Angry',       2),
  ('Angry',         '😡', '#ef4444', 'Angry',       3),
  ('Furious',       '🤬', '#ef4444', 'Angry',       4)
on conflict (name) do update set
  icon = excluded.icon, color = excluded.color,
  category = excluded.category, sort_order = excluded.sort_order;

-- ── diary_entries ─────────────────────────────────────────────
create table if not exists public.diary_entries (
  id         bigserial primary key,
  user_id    uuid    not null references auth.users (id) on delete cascade,
  media_id   bigint  not null references public.media (id) on delete cascade,
  watched_on date    not null,
  rating     numeric(2,1) not null check (rating >= 0 and rating <= 5),
  review     text    not null default '',
  rewatch        boolean not null default false,
  season_number  integer,
  episode_number integer,
  created_at     timestamptz not null default now()
);

-- Add season/episode columns if upgrading an existing DB
alter table public.diary_entries add column if not exists season_number  integer;
alter table public.diary_entries add column if not exists episode_number integer;

-- ── diary_entry_emotions (junction) ──────────────────────────
create table if not exists public.diary_entry_emotions (
  id         bigserial primary key,
  entry_id   bigint not null references public.diary_entries (id) on delete cascade,
  emotion_id bigint not null references public.emotions (id) on delete cascade,
  unique (entry_id, emotion_id)
);

-- ── profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text,
  display_name text,
  bio          text not null default '',
  avatar_url   text,
  updated_at   timestamptz not null default now()
);

-- ── watchlist ─────────────────────────────────────────────────
create table if not exists public.watchlist (
  id       bigserial primary key,
  user_id  uuid   not null references auth.users (id) on delete cascade,
  media_id bigint not null references public.media (id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (user_id, media_id)
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.media                enable row level security;
alter table public.emotions             enable row level security;
alter table public.diary_entries        enable row level security;
alter table public.diary_entry_emotions enable row level security;
alter table public.profiles             enable row level security;
alter table public.watchlist            enable row level security;

-- media: readable by everyone, writable by authenticated users
do $$ begin
  if not exists (select 1 from pg_policies where tablename='media' and policyname='media_read') then
    create policy "media_read"   on public.media for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='media' and policyname='media_insert') then
    create policy "media_insert" on public.media for insert with check (auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename='media' and policyname='media_update') then
    create policy "media_update" on public.media for update using (auth.uid() is not null);
  end if;
end $$;

-- emotions: read-only for everyone
do $$ begin
  if not exists (select 1 from pg_policies where tablename='emotions' and policyname='emotions_read') then
    create policy "emotions_read" on public.emotions for select using (true);
  end if;
end $$;

-- diary_entries: users own their rows
do $$ begin
  if not exists (select 1 from pg_policies where tablename='diary_entries' and policyname='diary_entries_select') then
    create policy "diary_entries_select" on public.diary_entries for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='diary_entries' and policyname='diary_entries_insert') then
    create policy "diary_entries_insert" on public.diary_entries for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='diary_entries' and policyname='diary_entries_update') then
    create policy "diary_entries_update" on public.diary_entries for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='diary_entries' and policyname='diary_entries_delete') then
    create policy "diary_entries_delete" on public.diary_entries for delete using (auth.uid() = user_id);
  end if;
end $$;

-- diary_entry_emotions: access via diary_entries ownership
do $$ begin
  if not exists (select 1 from pg_policies where tablename='diary_entry_emotions' and policyname='dee_select') then
    create policy "dee_select" on public.diary_entry_emotions for select using (
      exists (select 1 from public.diary_entries e where e.id = entry_id and e.user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='diary_entry_emotions' and policyname='dee_insert') then
    create policy "dee_insert" on public.diary_entry_emotions for insert with check (
      exists (select 1 from public.diary_entries e where e.id = entry_id and e.user_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='diary_entry_emotions' and policyname='dee_delete') then
    create policy "dee_delete" on public.diary_entry_emotions for delete using (
      exists (select 1 from public.diary_entries e where e.id = entry_id and e.user_id = auth.uid())
    );
  end if;
end $$;

-- profiles: public read, owner write
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_select') then
    create policy "profiles_select" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_insert') then
    create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_update') then
    create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- watchlist: users own their rows
do $$ begin
  if not exists (select 1 from pg_policies where tablename='watchlist' and policyname='watchlist_select') then
    create policy "watchlist_select" on public.watchlist for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='watchlist' and policyname='watchlist_insert') then
    create policy "watchlist_insert" on public.watchlist for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='watchlist' and policyname='watchlist_delete') then
    create policy "watchlist_delete" on public.watchlist for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ── Trigger: auto-create profile on signup ────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── RPC: delete current user's account (security definer) ─────
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  -- cascade deletes handle diary_entry_emotions and watchlist rows
  delete from public.diary_entries where user_id = uid;
  delete from public.watchlist     where user_id = uid;
  delete from public.profiles      where id       = uid;
  delete from auth.users           where id       = uid;
end;
$$;
