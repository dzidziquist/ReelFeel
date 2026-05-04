import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, Dimensions, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { getWatchlist, removeFromWatchlist } from '../../lib/queries'
import PosterCard from '../../components/PosterCard'
import FilterSortBar from '../../components/FilterSortBar'
import { useTheme } from '../../context/ThemeContext'

const NUM_COLS   = 3
const GAP        = 10
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - GAP * (NUM_COLS - 1)) / NUM_COLS

function applySort(items, sort) {
  const result = [...items]
  switch (sort) {
    case 'added_at_asc':  result.sort((a, b) => a.added_at < b.added_at ? -1 : 1); break
    case 'title_asc':     result.sort((a, b) => (a.media?.title ?? '') < (b.media?.title ?? '') ? -1 : 1); break
    default:              result.sort((a, b) => a.added_at < b.added_at ? 1 : -1)  // newest first
  }
  return result
}

export default function Watchlist() {
  const { theme }  = useTheme()
  const router     = useRouter()
  const insets     = useSafeAreaInsets()

  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [error,     setError]     = useState('')
  const [filters,   setFilters]   = useState({ genre: '' })
  const [sort,      setSort]      = useState('added_at_desc')

  const load = useCallback(async () => {
    setError('')
    try { setItems(await getWatchlist()) }
    catch (err) { setError(err.message) }
  }, [])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  async function handleRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  function confirmRemove(item) {
    Alert.alert('Remove from Watchlist?', `"${item.media.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await removeFromWatchlist(item.media.id)
          setItems(prev => prev.filter(i => i.id !== item.id))
        },
      },
    ])
  }

  const availableGenres = useMemo(() => {
    const g = new Set()
    items.forEach(i => (i.media?.genres ?? []).forEach(genre => g.add(genre)))
    return [...g].sort()
  }, [items])

  const displayed = useMemo(() => {
    let result = items
    if (filters.genre) result = result.filter(i => (i.media?.genres ?? []).includes(filters.genre))
    return applySort(result, sort)
  }, [items, filters, sort])

  if (loading) return <View style={[s.center, { backgroundColor: theme.bg0, paddingTop: insets.top }]}><ActivityIndicator size="large" color={theme.gold} /></View>

  // Pad for even columns
  const padded = [...displayed]
  while (padded.length % NUM_COLS !== 0) padded.push(null)

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <FlatList
        data={padded}
        keyExtractor={(item, i) => item ? String(item.id) : `pad-${i}`}
        numColumns={NUM_COLS}
        contentContainerStyle={[s.list, { paddingTop: insets.top + 16 }]}
        columnWrapperStyle={s.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <Text style={[s.title, { color: theme.text }]}>Watchlist</Text>
            <Text style={[s.subtitle, { color: theme.textMut }]}>{items.length} {items.length === 1 ? 'title' : 'titles'} saved · Long press to remove</Text>
            {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
            <View style={{ marginTop: 12 }}>
              <FilterSortBar
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                availableGenres={availableGenres}
                mode="watchlist"
                activeCount={filters.genre ? 1 : 0}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🔖</Text>
              <Text style={[s.emptyTitle, { color: theme.textSub }]}>
                {filters.genre ? 'No matches for this filter.' : 'Nothing saved yet.'}
              </Text>
              <Text style={[s.emptyBody, { color: theme.textMut }]}>
                Find a movie and tap "Save to Watchlist"
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={[s.searchBtn, { backgroundColor: theme.red }]}>
                <Text style={s.searchBtnText}>Browse Movies</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (!item) return <View style={{ width: ITEM_WIDTH }} />
          return (
            <View style={{ width: ITEM_WIDTH }}>
              <PosterCard
                item={item.media}
                width={ITEM_WIDTH}
                onPress={() => router.push(`/media/${item.media.tmdb_id}?type=${item.media.media_type}`)}
                onLongPress={() => confirmRemove(item)}
              />
              <TouchableOpacity
                onPress={() => router.push(`/log?tmdb_id=${item.media.tmdb_id}&type=${item.media.media_type}`)}
                style={[s.logBtn, { backgroundColor: theme.red }]}
              >
                <Text style={s.logBtnText}>+ Log</Text>
              </TouchableOpacity>
            </View>
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:        { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:        { paddingHorizontal: 16, paddingBottom: 48 },
  row:         { gap: GAP, marginBottom: GAP },
  headerBlock: { marginBottom: 12 },
  title:       { fontSize: 24, fontWeight: '800' },
  subtitle:    { fontSize: 11, marginTop: 4, marginBottom: 4 },
  errorBox:    { backgroundColor: '#3f0000', borderWidth: 2, borderColor: '#dc2626', borderRadius: 6, padding: 14 },
  errorText:   { color: '#fca5a5', fontSize: 13 },
  empty:       { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyEmoji:  { fontSize: 48, marginBottom: 16 },
  emptyTitle:  { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyBody:   { fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  searchBtn:   {
    borderRadius: 6, paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 3,
  },
  searchBtnText:{ color: '#fff', fontWeight: '800' },
  logBtn:      {
    borderRadius: 4, paddingVertical: 5, alignItems: 'center', marginTop: 5,
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.7, shadowRadius: 0, elevation: 2,
  },
  logBtnText:  { color: '#fff', fontSize: 10, fontWeight: '800' },
})
