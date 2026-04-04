import { supabase } from './supabase'
import { fetchTMDBDetail } from './tmdb'

const IMG = 'https://image.tmdb.org/t/p'
const toURL     = p => p ? `${IMG}/w500${p}`     : null
const toBackdrop = p => p ? `${IMG}/original${p}` : null

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

export async function getEmotions() {
  const { data, error } = await supabase.from('emotions').select('*').order('name')
  if (error) throw error
  return data
}

export async function getDiary() {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, watched_on, rating, review, rewatch, created_at, media(*), diary_entry_emotions(emotions(*))')
    .order('watched_on', { ascending: false })
  if (error) throw error
  return data.map(fmtEntry)
}

export async function getOrCreateMedia(tmdbId, mediaType) {
  const { data: existing } = await supabase
    .from('media').select('*').eq('tmdb_id', tmdbId).eq('media_type', mediaType).maybeSingle()
  if (existing) return existing
  const detail = await fetchTMDBDetail(tmdbId, mediaType)
  const { data, error } = await supabase.from('media').insert(detail).select().single()
  if (error) throw error
  return data
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

export async function getMedia(tmdbId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data: media, error: mErr } = await supabase
    .from('media').select('*').eq('tmdb_id', Number(tmdbId)).single()
  if (mErr) throw mErr
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
  return { media: fmtMedia(media), entries: mappedEntries, avg_rating: avg }
}
