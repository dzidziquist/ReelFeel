import { NativeModules, Platform } from 'react-native'

const { WidgetDataBridge } = NativeModules

let cached = { lastEntry: null, watchlist: [], stats: null, recentEntries: [] }

function mapEntry(e) {
  if (!e) return null
  return {
    id: e.id,
    title: e.media?.title ?? '',
    mediaType: e.media?.media_type ?? 'film',
    rating: e.rating ?? 0,
    watchedOn: e.watched_on ?? '',
    posterURL: e.media?.poster_url ?? null,
  }
}

function mapWatchlistItem(item) {
  return {
    id: item.id,
    title: item.media?.title ?? '',
    mediaType: item.media?.media_type ?? 'film',
    posterURL: item.media?.poster_url ?? null,
  }
}

function mapStats(s) {
  if (!s) return null
  return {
    totalMovies: s.totalMovies ?? 0,
    totalTV: s.totalTV ?? 0,
    totalEntries: s.totalEntries ?? 0,
    thisMonth: s.thisMonth ?? 0,
    streak: s.streak ?? 0,
    avgRating: s.avgRating ?? null,
  }
}

function flush() {
  if (Platform.OS !== 'ios' || !WidgetDataBridge || typeof WidgetDataBridge.setData !== 'function') return
  WidgetDataBridge.setData(JSON.stringify(cached)).catch(() => {})
}

export function updateWidgetEntry(entries = []) {
  cached = {
    ...cached,
    lastEntry: mapEntry(entries[0] ?? null),
    recentEntries: entries.slice(0, 6).map(mapEntry).filter(Boolean),
  }
  flush()
}

export function updateWidgetWatchlist(watchlist = []) {
  cached = { ...cached, watchlist: watchlist.slice(0, 4).map(mapWatchlistItem) }
  flush()
}

export function updateWidgetStats(stats) {
  cached = { ...cached, stats: mapStats(stats) }
  flush()
}
