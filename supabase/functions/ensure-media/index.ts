// ensure-media: returns the shared `media` row for a TMDB title, creating it
// from TMDB data if it does not exist yet.
//
// Clients may only choose WHICH title gets added; WHAT it says always comes
// from TMDB, so no user can plant a fake title/overview/poster for everyone.
//
// POST { tmdb_id: number, media_type: 'film' | 'movie' | 'tv' }  (signed-in users only)

import { createClient } from 'npm:@supabase/supabase-js@2'

const TMDB_KEY = Deno.env.get('TMDB_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Same shape as fetchTMDBDetail() in mobile/lib/tmdb.js
async function fetchFromTMDB(tmdbId: number, mediaType: 'film' | 'tv') {
  const path = mediaType === 'film' ? 'movie' : 'tv'
  const qs = new URLSearchParams({ api_key: TMDB_KEY! })
  const res = await fetch(`https://api.themoviedb.org/3/${path}/${tmdbId}?${qs}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  const d = await res.json()
  const date: string = d.release_date || d.first_air_date || ''
  return {
    tmdb_id:       tmdbId,
    media_type:    mediaType,
    title:         d.title || d.name,
    year:          date ? parseInt(date.slice(0, 4)) : null,
    poster_path:   d.poster_path ?? '',
    backdrop_path: d.backdrop_path ?? '',
    overview:      d.overview ?? '',
    tagline:       d.tagline ?? '',
    genres:        (d.genres ?? []).map((g: { name: string }) => g.name),
    runtime:       d.runtime || (d.episode_run_time ?? [])[0] || null,
    tmdb_rating:   d.vote_average ? parseFloat(d.vote_average.toFixed(1)) : null,
    vote_count:    d.vote_count ?? null,
  }
}

async function findExisting(tmdbId: number, mediaType: 'film' | 'tv') {
  const variants = mediaType === 'film' ? ['film', 'movie'] : ['tv']
  const { data, error } = await admin
    .from('media').select('*')
    .eq('tmdb_id', tmdbId).in('media_type', variants)
    .order('id').limit(1)
  if (error) throw error
  return data?.[0] ?? null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!TMDB_KEY) return json({ error: 'Server is missing TMDB_API_KEY' }, 500)

  // Only signed-in users may add titles
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return json({ error: 'Not signed in' }, 401)

  let body: { tmdb_id?: unknown; media_type?: unknown }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

  const tmdbId = Number(body.tmdb_id)
  const rawType = body.media_type === 'movie' ? 'film' : body.media_type
  if (!Number.isInteger(tmdbId) || tmdbId <= 0 || (rawType !== 'film' && rawType !== 'tv')) {
    return json({ error: 'Expected { tmdb_id: positive integer, media_type: "film" | "tv" }' }, 400)
  }
  const mediaType = rawType as 'film' | 'tv'

  try {
    const existing = await findExisting(tmdbId, mediaType)
    if (existing) return json(existing)

    const detail = await fetchFromTMDB(tmdbId, mediaType)
    if (!detail) return json({ error: 'Title not found on TMDB' }, 404)

    const { data, error } = await admin.from('media').insert(detail).select().single()
    if (error?.code === '23505') {
      // Another request created it at the same moment
      return json(await findExisting(tmdbId, mediaType))
    }
    if (error) throw error
    return json(data)
  } catch (err) {
    console.error(err)
    return json({ error: 'Could not load this title. Please try again.' }, 502)
  }
})
