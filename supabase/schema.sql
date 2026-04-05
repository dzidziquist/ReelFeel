-- ============================================================
-- MovieRater — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── media ────────────────────────────────────────────────────
create table if not exists public.media (
  id           bigserial primary key,
  tmdb_id      integer not null,
  media_type   text    not null check (media_type in ('movie','tv')),
  title        text    not null,
  poster_path  text,
  backdrop_path text,
  overview     text,
  release_date text,
  unique (tmdb_id, media_type)
);

-- ── emotions ─────────────────────────────────────────────────
create table if not exists public.emotions (
  id   bigserial primary key,
  name text not null unique
);

insert into public.emotions (name) values
  ('Happy'),('Sad'),('Excited'),('Scared'),('Bored'),
  ('Moved'),('Confused'),('Inspired'),('Amused'),('Tense')
on conflict (name) do nothing;

-- ── diary_entries ─────────────────────────────────────────────
create table if not exists public.diary_entries (
  id         bigserial primary key,
  user_id    uuid    not null references auth.users (id) on delete cascade,
  media_id   bigint  not null references public.media (id) on delete cascade,
  watched_on date    not null,
  rating     numeric(2,1) not null check (rating >= 0 and rating <= 5),
  review     text    not null default '',
  rewatch    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── diary_entry_emotions (junction) ──────────────────────────
create table if not exists public.diary_entry_emotions (
  id         bigserial primary key,
  entry_id   bigint not null references public.diary_entries (id) on delete cascade,
  emotion_id bigint not null references public.emotions (id) on delete cascade,
  unique (entry_id, emotion_id)
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.media                enable row level security;
alter table public.emotions             enable row level security;
alter table public.diary_entries        enable row level security;
alter table public.diary_entry_emotions enable row level security;

-- media: readable by everyone, writable by authenticated users
create policy "media_read"   on public.media for select using (true);
create policy "media_insert" on public.media for insert with check (auth.uid() is not null);

-- emotions: read-only for everyone
create policy "emotions_read" on public.emotions for select using (true);

-- diary_entries: users own their rows
create policy "diary_entries_select" on public.diary_entries
  for select using (auth.uid() = user_id);

create policy "diary_entries_insert" on public.diary_entries
  for insert with check (auth.uid() = user_id);

create policy "diary_entries_update" on public.diary_entries
  for update using (auth.uid() = user_id);

create policy "diary_entries_delete" on public.diary_entries
  for delete using (auth.uid() = user_id);

-- diary_entry_emotions: access via diary_entries ownership
create policy "dee_select" on public.diary_entry_emotions
  for select using (
    exists (
      select 1 from public.diary_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "dee_insert" on public.diary_entry_emotions
  for insert with check (
    exists (
      select 1 from public.diary_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );

create policy "dee_delete" on public.diary_entry_emotions
  for delete using (
    exists (
      select 1 from public.diary_entries e
      where e.id = entry_id and e.user_id = auth.uid()
    )
  );
