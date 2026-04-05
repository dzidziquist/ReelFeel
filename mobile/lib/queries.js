import { supabase } from './supabase'
import { fetchTMDBDetail } from './tmdb'

const IMG        = 'https://image.tmdb.org/t/p'
const toURL      = p => p ? `${IMG}/w500${p}`      : null
const toBackdrop = p => p ? `${IMG}/original${p}`  : null

function fmtMedia(m) {
  return { ...m, poster_url: toURL(m.poster_path), backdrop_url: toBackdrop(m.backdrop_path) }
}

function fmtEntry(e) {
  return {
    ...e,
    media:    fmtMedia(e.media),
    emotions: (e.diary_entry_emotions ?? []).map(x => x.emotions),
  }
}

// ── Emotions ──────────────────────────────────────────────────
export async function getEmotions() {
  const { data, error } = await supabase.from('emotions').select('*').order('name')
  if (error) throw error
  return data
}

// ── Diary ─────────────────────────────────────────────────────
export async function getDiary() {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, watched_on, rating, review, rewatch, created_at, media(*), diary_entry_emotions(emotions(*))')
    .order('watched_on', { ascending: false })
  if (error) throw error
  return data.map(fmtEntry)
}

export async function createEntry({ tmdb_id, media_type, rating, watched_on, review, rewatch, emotion_ids = [] }) {
  const { data: { user } } = await supabase.auth.getUser()
  const media = await getOrCreateMedia(tmdb_id, media_type)
  const { data: entry, error } = await supabase
    .from('diary_entries')
    .insert({ user_id: user.id, media_id: media.id, rating, watched_on, review, rewatch })
    .select().single()
  if (error) throw error
  if (emotion_ids.length) {
    const { error: eErr } = await supabase
      .from('diary_entry_emotions')
      .insert(emotion_ids.map(id => ({ entry_id: entry.id, emotion_id: id })))
    if (eErr) throw eErr
  }
  return entry
}

export async function updateEntry(id, { rating, watched_on, review, rewatch, emotion_ids = [] }) {
  const { error } = await supabase
    .from('diary_entries').update({ rating, watched_on, review, rewatch }).eq('id', id)
  if (error) throw error
  await supabase.from('diary_entry_emotions').delete().eq('entry_id', id)
  if (emotion_ids.length)
    await supabase.from('diary_entry_emotions')
      .insert(emotion_ids.map(eid => ({ entry_id: id, emotion_id: eid })))
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('diary_entries').delete().eq('id', id)
  if (error) throw error
}

// ── Insights ──────────────────────────────────────────────────
export async function getInsights() {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: entries, error } = await supabase
    .from('diary_entries')
    .select('rating, watched_on, media(media_type, runtime)')
    .eq('user_id', user.id)
  if (error) throw error

  const now    = new Date()
  const month  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let totalMovies = 0, totalTV = 0, ratingSum = 0, ratingCount = 0
  let thisMonth = 0, totalRuntime = 0

  for (const e of entries) {
    const type = e.media?.media_type
    if (type === 'film' || type === 'movie') totalMovies++
    else if (type === 'tv') totalTV++

    if (e.rating) { ratingSum += Number(e.rating); ratingCount++ }
    if (e.watched_on?.startsWith(month)) thisMonth++
    if (e.media?.runtime) totalRuntime += e.media.runtime
  }

  return {
    totalMovies,
    totalTV,
    totalEntries: entries.length,
    avgRating:    ratingCount ? (ratingSum / ratingCount) : null,
    thisMonth,
    totalRuntime,   // minutes
  }
}

// ── Library ───────────────────────────────────────────────────
export async function getLibrary(type) {
  const { data: rows, error } = await supabase.from('diary_entries').select('media_id')
  if (error) throw error
  const ids = [...new Set(rows.map(r => r.media_id))]
  if (!ids.length) return []
  let q = supabase.from('media').select('*').in('id', ids)
  if (type) q = q.eq('media_type', type)
  const { data, error: e2 } = await q
  if (e2) throw e2
  return data.map(fmtMedia)
}

// ── Media (detail) ────────────────────────────────────────────
export async function getOrCreateMedia(tmdbId, mediaType) {
  const { data: existing } = await supabase
    .from('media').select('*')
    .eq('tmdb_id', tmdbId).eq('media_type', mediaType).maybeSingle()
  if (existing) return existing

  const detail = await fetchTMDBDetail(tmdbId, mediaType)
  const { data, error } = await supabase.from('media').insert({
    tmdb_id:       detail.tmdb_id,
    media_type:    detail.media_type,
    title:         detail.title,
    year:          detail.year,
    poster_path:   detail.poster_path,
    backdrop_path: detail.backdrop_path,
    overview:      detail.overview,
    tagline:       detail.tagline,
    genres:        detail.genres,
    runtime:       detail.runtime,
    tmdb_rating:   detail.tmdb_rating,
    vote_count:    detail.vote_count,
  }).select().single()
  if (error) throw error
  return data
}

export async function getMedia(tmdbId, fallbackType = 'film') {
  const { data: { user } } = await supabase.auth.getUser()

  // Try to find media in DB first
  const { data: media } = await supabase
    .from('media').select('*').eq('tmdb_id', Number(tmdbId)).maybeSingle()

  let mediaRow
  if (media) {
    mediaRow = fmtMedia(media)
  } else {
    // Not in DB yet — fetch from TMDB directly and return without storing
    const detail = await fetchTMDBDetail(Number(tmdbId), fallbackType)
    mediaRow = {
      ...detail,
      id:           null,
      poster_url:   toURL(detail.poster_path),
      backdrop_url: toBackdrop(detail.backdrop_path),
    }
    return { media: mediaRow, entries: [], avg_rating: null }
  }

  const { data: entries, error: eErr } = await supabase
    .from('diary_entries')
    .select('id, watched_on, rating, review, rewatch, created_at, diary_entry_emotions(emotions(*))')
    .eq('user_id', user.id).eq('media_id', media.id)
    .order('watched_on', { ascending: false })
  if (eErr) throw eErr

  const mappedEntries = entries.map(e => ({
    ...e,
    emotions: (e.diary_entry_emotions ?? []).map(x => x.emotions),
  }))
  const avg = entries.length
    ? entries.reduce((s, e) => s + Number(e.rating), 0) / entries.length
    : null

  return { media: mediaRow, entries: mappedEntries, avg_rating: avg }
}

// ── Watchlist ─────────────────────────────────────────────────
export async function getWatchlist() {
  const { data, error } = await supabase
    .from('watchlist')
    .select('id, added_at, media(*)')
    .order('added_at', { ascending: false })
  if (error) throw error
  return data.map(row => ({ ...row, media: fmtMedia(row.media) }))
}

export async function addToWatchlist(tmdbId, mediaType) {
  const { data: { user } } = await supabase.auth.getUser()
  const media = await getOrCreateMedia(tmdbId, mediaType)
  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: user.id, media_id: media.id })
  // Ignore duplicate error (already in watchlist)
  if (error && error.code !== '23505') throw error
}

export async function removeFromWatchlist(mediaId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('watchlist').delete()
    .eq('user_id', user.id).eq('media_id', mediaId)
  if (error) throw error
}

export async function isInWatchlist(mediaId) {
  if (!mediaId) return false
  const { count, error } = await supabase
    .from('watchlist').select('id', { count: 'exact', head: true })
    .eq('media_id', mediaId)
  if (error) return false
  return (count ?? 0) > 0
}

// Remove by tmdb_id (convenience — when we only have tmdb_id, not DB media_id)
export async function removeFromWatchlistByTmdbId(tmdbId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: media } = await supabase
    .from('media').select('id').eq('tmdb_id', tmdbId).maybeSingle()
  if (!media) return
  await removeFromWatchlist(media.id)
}

// ── Profile ───────────────────────────────────────────────────
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  // Return profile merged with auth user metadata
  return {
    id:           user.id,
    email:        user.email,
    username:     data?.username || user.user_metadata?.username || '',
    display_name: data?.display_name || '',
    bio:          data?.bio || '',
    avatar_url:   data?.avatar_url || null,
    created_at:   user.created_at,
  }
}

export async function upsertProfile({ display_name, bio }) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    display_name,
    bio,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (error) throw error
}

// ── Watch States (batch, for home feed badges) ────────────────
/**
 * For a list of tmdb_ids, return a Map<tmdb_id, { watched, liked, rated, inWatchlist }>
 * Used by the Home screen to decorate poster cards.
 */
export async function getWatchStatesForTmdbIds(tmdbIds) {
  const result = new Map()
  if (!tmdbIds?.length) return result

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return result

  // Get all media IDs for these tmdb_ids
  const { data: mediaRows } = await supabase
    .from('media').select('id, tmdb_id').in('tmdb_id', tmdbIds)
  if (!mediaRows?.length) return result

  const mediaIdToTmdbId = new Map(mediaRows.map(m => [m.id, m.tmdb_id]))
  const mediaIds = mediaRows.map(m => m.id)

  // Get diary entries for these media
  const { data: diaryRows } = await supabase
    .from('diary_entries').select('media_id, rating')
    .eq('user_id', user.id).in('media_id', mediaIds)

  // Get watchlist entries for these media
  const { data: wlRows } = await supabase
    .from('watchlist').select('media_id')
    .eq('user_id', user.id).in('media_id', mediaIds)

  const watchlistSet = new Set((wlRows ?? []).map(r => r.media_id))

  // Build per-tmdb_id aggregates
  const diaryByMedia = new Map()
  for (const row of (diaryRows ?? [])) {
    if (!diaryByMedia.has(row.media_id)) diaryByMedia.set(row.media_id, [])
    diaryByMedia.get(row.media_id).push(row)
  }

  for (const { id: mediaId, tmdb_id } of mediaRows) {
    const entries = diaryByMedia.get(mediaId) ?? []
    const ratings = entries.map(e => Number(e.rating)).filter(Boolean)
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
    result.set(tmdb_id, {
      watched:     entries.length > 0,
      liked:       avgRating != null && avgRating >= 4,
      rated:       ratings.length > 0,
      inWatchlist: watchlistSet.has(mediaId),
    })
  }

  return result
}

// ── Account deletion ──────────────────────────────────────────
export async function deleteAllMyData() {
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user.id

  // Delete in dependency order
  const entries = await supabase.from('diary_entries').select('id').eq('user_id', uid)
  if (entries.data?.length) {
    await supabase.from('diary_entry_emotions')
      .delete().in('entry_id', entries.data.map(e => e.id))
  }
  await supabase.from('diary_entries').delete().eq('user_id', uid)
  await supabase.from('watchlist').delete().eq('user_id', uid)
}

export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
  await supabase.auth.signOut()
}
