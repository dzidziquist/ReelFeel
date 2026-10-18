-- Run ONLY after:
--   1. the ensure-media Edge Function is deployed, and
--   2. the app version that uses it is what your users are running.
-- Older app versions insert media rows directly; after this runs they can
-- no longer log titles that are not already in the catalogue.
drop policy if exists "media_insert" on public.media;
