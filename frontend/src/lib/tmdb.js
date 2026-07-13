const KEY  = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'
const IMG  = 'https://image.tmdb.org/t/p'

export function posterUrl(path)   { return path ? `${IMG}/w500${path}`    : null }
export function backdropUrl(path) { return path ? `${IMG}/w1280${path}`   : null }

export async function fetchMedia(tmdbId, type = 'movie') {
  const endpoint = type === 'tv' ? 'tv' : 'movie'
  const res = await fetch(`${BASE}/${endpoint}/${tmdbId}?api_key=${KEY}`)
  if (!res.ok) throw new Error(`TMDB ${res.status}`)
  const d = await res.json()

  return {
    tmdb_id:     tmdbId,
    media_type:  type === 'tv' ? 'tv' : 'film',
    title:       d.title ?? d.name,
    year:        (d.release_date ?? d.first_air_date ?? '').slice(0, 4),
    overview:    d.overview,
    tmdb_rating: d.vote_average,
    genres:      d.genres?.map(g => g.name) ?? [],
    runtime:     d.runtime ?? d.episode_run_time?.[0] ?? null,
    poster_url:  posterUrl(d.poster_path),
    backdrop_url: backdropUrl(d.backdrop_path),
  }
}
