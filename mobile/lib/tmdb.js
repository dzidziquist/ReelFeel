const KEY  = process.env.EXPO_PUBLIC_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'
export const TMDB_IMG = 'https://image.tmdb.org/t/p'
const IMG = TMDB_IMG

function extractYear(item) {
  const d = item.release_date || item.first_air_date || ''
  return d ? parseInt(d.slice(0, 4)) : null
}

function normalizeType(raw) {
  // TMDB returns 'movie' or 'tv'; we store as 'film' or 'tv'
  if (raw === 'movie') return 'film'
  if (raw === 'tv')    return 'tv'
  return raw  // already 'film' or 'tv'
}

function mapResult(r, fallbackType = null) {
  const mediaType = normalizeType(r.media_type || fallbackType || 'movie')
  return {
    tmdb_id:      r.id,
    media_type:   mediaType,
    title:        r.title || r.name,
    year:         extractYear(r),
    poster_path:  r.poster_path  ?? '',
    poster_url:   r.poster_path  ? `${IMG}/w500${r.poster_path}`    : null,
    backdrop_url: r.backdrop_path ? `${IMG}/original${r.backdrop_path}` : null,
    overview:     r.overview ?? '',
    tmdb_rating:  r.vote_average ? parseFloat(r.vote_average.toFixed(1)) : null,
    vote_count:   r.vote_count ?? null,
    genres:       (r.genre_ids ?? []),  // only IDs at list level
  }
}

async function get(path, params = {}) {
  const qs = new URLSearchParams({ api_key: KEY, ...params }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`)
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

// ── Search ───────────────────────────────────────────────────
export async function searchTMDB(query) {
  const json = await get('/search/multi', { query, include_adult: false })
  return (json.results ?? [])
    .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && !r.adult)
    .map(r => mapResult(r))
}

// ── Discovery ────────────────────────────────────────────────
/**
 * Trending movies/TV this week or today.
 * @param {string} mediaType  'all' | 'movie' | 'tv' | 'person'
 * @param {string} timeWindow 'week' | 'day'
 */
export async function getTrending(mediaType = 'all', timeWindow = 'week') {
  const json = await get(`/trending/${mediaType}/${timeWindow}`)
  return (json.results ?? [])
    .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
    .map(r => mapResult(r))
}

/**
 * Movies currently playing in theatres.
 */
export async function getNowPlaying() {
  const json = await get('/movie/now_playing')
  return (json.results ?? []).map(r => mapResult(r, 'movie'))
}

/**
 * Popular TV shows.
 */
export async function getPopularTV() {
  const json = await get('/tv/popular')
  return (json.results ?? []).map(r => mapResult(r, 'tv'))
}

// ── Detail ───────────────────────────────────────────────────
/**
 * Fetch full details + credits for a movie or TV show.
 */
export async function fetchTMDBDetail(tmdbId, mediaType) {
  const path = (mediaType === 'film' || mediaType === 'movie') ? 'movie' : 'tv'
  const d    = await get(`/${path}/${tmdbId}`, { append_to_response: 'credits' })

  const cast = (d.credits?.cast ?? [])
    .slice(0, 8)
    .map(c => ({ id: c.id, name: c.name, character: c.character, profile_path: c.profile_path }))

  return {
    tmdb_id:       tmdbId,
    media_type:    mediaType === 'movie' ? 'film' : mediaType,
    title:         d.title || d.name,
    year:          extractYear(d),
    poster_path:   d.poster_path   ?? '',
    backdrop_path: d.backdrop_path ?? '',
    overview:      d.overview      ?? '',
    tagline:       d.tagline       ?? '',
    genres:        (d.genres ?? []).map(g => g.name),
    runtime:       d.runtime || (d.episode_run_time ?? [])[0] || null,
    tmdb_rating:   d.vote_average ? parseFloat(d.vote_average.toFixed(1)) : null,
    vote_count:    d.vote_count ?? null,
    cast,
  }
}

// ── TV Season / Episode Browser ──────────────────────────────
/**
 * Returns the season list for a TV show (season_number > 0 only).
 */
export async function getTVSeasons(tmdbId) {
  const d = await get(`/tv/${tmdbId}`)
  return (d.seasons ?? [])
    .filter(s => s.season_number > 0)
    .map(s => ({
      season_number: s.season_number,
      name:          s.name || `Season ${s.season_number}`,
      episode_count: s.episode_count,
      poster_url:    s.poster_path ? `${IMG}/w185${s.poster_path}` : null,
      air_date:      s.air_date ?? null,
    }))
}

/**
 * Returns episodes for one season of a TV show.
 */
export async function getTVEpisodes(tmdbId, seasonNumber) {
  const d = await get(`/tv/${tmdbId}/season/${seasonNumber}`)
  return (d.episodes ?? []).map(e => ({
    episode_number: e.episode_number,
    name:           e.name,
    overview:       e.overview ?? '',
    still_url:      e.still_path ? `${IMG}/w300${e.still_path}` : null,
    runtime:        e.runtime ?? null,
    vote_average:   e.vote_average ?? null,
    air_date:       e.air_date ?? null,
  }))
}

// ── Recommendations ──────────────────────────────────────────
/**
 * Fetch TMDB recommendations for a single title.
 * Used to build the "For You" feed from the user's watch history.
 */
export async function getRecommendations(tmdbId, mediaType) {
  const path = (mediaType === 'film' || mediaType === 'movie') ? 'movie' : 'tv'
  try {
    const json = await get(`/${path}/${tmdbId}/recommendations`)
    return (json.results ?? []).map(r => mapResult(r, mediaType === 'tv' ? 'tv' : 'movie'))
  } catch {
    return []
  }
}

// ── Theatrical Status ────────────────────────────────────────
/**
 * Returns true if the movie has a theatrical release (type 3) in the given
 * country within the past 90 days (still in theatres window).
 */
export async function checkInTheatres(tmdbId, country = 'US') {
  try {
    const data = await get(`/movie/${tmdbId}/release_dates`)
    const region = (data.results ?? []).find(r => r.iso_3166_1 === country)
      ?? (data.results ?? []).find(r => r.iso_3166_1 === 'US')
    if (!region) return false
    const today  = new Date()
    const cutoff = new Date(today - 90 * 24 * 60 * 60 * 1000)
    return (region.release_dates ?? []).some(rd =>
      rd.type === 3 && new Date(rd.release_date) <= today && new Date(rd.release_date) >= cutoff
    )
  } catch {
    return false
  }
}

// ── Watch Providers ──────────────────────────────────────────
/**
 * Fetch streaming / buy / rent providers for a title.
 * @param {number}  tmdbId
 * @param {string}  mediaType  'film' | 'tv' | 'movie'
 * @param {string}  country    ISO 3166-1 alpha-2 (default 'US')
 */
export async function getWatchProviders(tmdbId, mediaType, country = 'US') {
  const path = (mediaType === 'film' || mediaType === 'movie') ? 'movie' : 'tv'
  try {
    const data = await get(`/${path}/${tmdbId}/watch/providers`)
    const region = (data.results ?? {})[country] ?? {}
    const toProvider = p => ({
      id:       p.provider_id,
      name:     p.provider_name,
      logo_url: p.logo_path ? `${IMG}/w92${p.logo_path}` : null,
    })
    return {
      streaming: (region.flatrate ?? []).map(toProvider),
      rent:      (region.rent     ?? []).map(toProvider),
      buy:       (region.buy      ?? []).map(toProvider),
    }
  } catch {
    return { streaming: [], rent: [], buy: [] }
  }
}
