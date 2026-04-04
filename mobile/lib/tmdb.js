const KEY  = process.env.EXPO_PUBLIC_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'

function extractYear(item) {
  const d = item.release_date || item.first_air_date || ''
  return d ? parseInt(d.slice(0, 4)) : null
}

export async function searchTMDB(query) {
  const res  = await fetch(`${BASE}/search/multi?api_key=${KEY}&query=${encodeURIComponent(query)}`)
  const json = await res.json()
  return (json.results ?? [])
    .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && !r.adult)
    .map(r => ({
      tmdb_id:     r.id,
      media_type:  r.media_type === 'movie' ? 'film' : 'tv',
      title:       r.title || r.name,
      year:        extractYear(r),
      poster_path: r.poster_path ?? '',
      poster_url:  r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
      overview:    r.overview ?? '',
      tmdb_rating: r.vote_average ?? null,
    }))
}

export async function fetchTMDBDetail(tmdbId, mediaType) {
  const path = mediaType === 'film' ? 'movie' : 'tv'
  const res  = await fetch(`${BASE}/${path}/${tmdbId}?api_key=${KEY}`)
  const d    = await res.json()
  return {
    tmdb_id:       tmdbId,
    media_type:    mediaType,
    title:         d.title || d.name,
    year:          extractYear(d),
    poster_path:   d.poster_path   ?? '',
    backdrop_path: d.backdrop_path ?? '',
    overview:      d.overview      ?? '',
    genres:        (d.genres ?? []).map(g => g.name),
    runtime:       d.runtime || (d.episode_run_time ?? [])[0] || null,
    tmdb_rating:   d.vote_average ?? null,
  }
}
