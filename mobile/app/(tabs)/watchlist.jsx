import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, Dimensions, StyleSheet, Pressable, Modal,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { useRouter, useFocusEffect } from 'expo-router'
import { getWatchlist, removeFromWatchlist } from '../../lib/queries'
import { DEMO_MODE } from '../../constants/demo'
import { DEMO_WATCHLIST } from '../../lib/demoData'
import PosterCard from '../../components/PosterCard'
import { FilterPanel } from '../../components/FilterSortBar'
import { useTheme } from '../../context/ThemeContext'
import { useTabBar } from '../../context/TabBarContext'

const NUM_COLS   = 3
const GAP        = 10
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - GAP * (NUM_COLS - 1)) / NUM_COLS

const SORT_OPTIONS = [
  { key: 'added_at_desc', label: 'Added (newest)' },
  { key: 'added_at_asc',  label: 'Added (oldest)' },
  { key: 'title_asc',     label: 'Title A–Z'      },
  { key: 'coming_soon',   label: 'Coming Soon'    },
]

const CURRENT_YEAR = new Date().getFullYear()

function isComingSoon(item) {
  if (item.media.media_type === 'tv') return false
  return item.media.year != null && item.media.year >= CURRENT_YEAR
}

function applySort(items, sort) {
  const result = [...items]
  if (sort === 'coming_soon') {
    return result.sort((a, b) => {
      const acs = isComingSoon(a) ? 0 : 1
      const bcs = isComingSoon(b) ? 0 : 1
      if (acs !== bcs) return acs - bcs
      return (a.media?.title ?? '') < (b.media?.title ?? '') ? -1 : 1
    })
  }
  switch (sort) {
    case 'added_at_asc': result.sort((a, b) => a.added_at < b.added_at ? -1 : 1); break
    case 'title_asc':    result.sort((a, b) => (a.media?.title ?? '') < (b.media?.title ?? '') ? -1 : 1); break
    default:             result.sort((a, b) => a.added_at < b.added_at ? 1 : -1)
  }
  return result
}

function WatchlistListItem({ item, onPress, onLog, onRemove, theme }) {
  const isFilm = item.media.media_type === 'film' || item.media.media_type === 'movie'
  const genres = (item.media?.genres ?? []).slice(0, 2)
  const addedDate = item.added_at
    ? new Date(item.added_at).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.listItem, {
        backgroundColor: pressed ? theme.bg2 : theme.bg1,
        borderColor: theme.text,
        shadowColor: '#000',
      }]}
    >
      <View style={[s.listPoster, { backgroundColor: theme.bg2, overflow: 'hidden' }]}>
        {item.media.poster_url ? (
          <Image source={item.media.poster_url} style={s.listPoster} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[s.listPoster, { alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 20 }}>🎬</Text>
          </View>
        )}
      </View>

      <View style={s.listInfo}>
        <Text style={[s.listTitle, { color: theme.text }]} numberOfLines={2}>{item.media.title}</Text>

        <View style={s.listMeta}>
          {item.media.year ? <Text style={[s.listMetaText, { color: theme.textMut }]}>{item.media.year}</Text> : null}
          {item.media.year ? <Text style={[s.listMetaText, { color: theme.textMut }]}>·</Text> : null}
          <View style={[s.typeBadge, { backgroundColor: isFilm ? 'rgba(140,15,15,0.85)' : 'rgba(100,70,0,0.85)' }]}>
            <Text style={s.typeBadgeText}>{isFilm ? 'Film' : 'TV'}</Text>
          </View>
        </View>

        {genres.length > 0 && (
          <Text style={[s.listGenres, { color: theme.textMut }]} numberOfLines={1}>{genres.join(' · ')}</Text>
        )}
        {addedDate && <Text style={[s.listAdded, { color: theme.textMut }]}>Added: {addedDate}</Text>}

        <View style={s.listActions}>
          <TouchableOpacity
            onPress={onLog}
            style={[s.listLogBtn, { backgroundColor: theme.red }]}
          >
            <Text style={s.listLogBtnText}>+ Log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRemove}
            style={[s.listRemoveBtn, { backgroundColor: 'transparent', borderColor: theme.text }]}
          >
            <Text style={[s.listRemoveBtnText, { color: theme.text }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  )
}

export default function Watchlist() {
  const { theme, isDark }   = useTheme()
  const { onScroll, reset } = useTabBar()
  const router              = useRouter()
  const insets              = useSafeAreaInsets()

  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState('')
  const [filters,    setFilters]    = useState({ genre: '' })
  const [sort,       setSort]       = useState('added_at_desc')
  const [viewMode,   setViewMode]   = useState('grid')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen,   setSortOpen]   = useState(false)

  const load = useCallback(async () => {
    setError('')
    if (DEMO_MODE) { setItems(DEMO_WATCHLIST); return }
    try { setItems(await getWatchlist()) }
    catch (err) { setError(err.message) }
  }, [])

  useFocusEffect(useCallback(() => { reset(); load().catch(() => {}) }, [load]))
  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  async function handleRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  function confirmRemove(item) {
    Alert.alert('Remove from Watchlist?', `"${item.media.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setItems(prev => prev.filter(i => i.id !== item.id))
          try {
            await removeFromWatchlist(item.media.id)
          } catch {
            setItems(prev => [...prev, item])
            Alert.alert('Error', 'Could not remove from watchlist. Please try again.')
          }
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

  const activeFilterCount = filters.genre ? 1 : 0

  if (loading) return (
    <View style={[s.center, { backgroundColor: theme.bg0, paddingTop: insets.top }]}>
      <ActivityIndicator size="large" color={theme.gold} />
    </View>
  )

  const sharedHeader = (
    <View style={[s.headerBlock, { paddingTop: insets.top + 16 }]}>
      <Text style={[s.title, { color: theme.text }]}>Watchlist</Text>
      <Text style={[s.subtitle, { color: theme.textMut }]}>
        {items.length} {items.length === 1 ? 'title' : 'titles'} saved
        {items.filter(isComingSoon).length > 0 ? ` · ${items.filter(isComingSoon).length} coming soon` : ''}
        {viewMode === 'grid' ? ' · Long press to remove' : ''}
      </Text>
      {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
    </View>
  )

  const emptyComponent = !error ? (
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

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>

      {/* ── Floating pill ── */}
      <View style={[s.floatingPillWrap, { top: insets.top + 8 }]}>
        <View style={s.floatingPill}>
          <BlurView intensity={isDark ? 72 : 88} tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, s.pillSpecular, { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)' }]} />

          <TouchableOpacity
            onPress={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            style={s.pillBtn}
          >
            <Ionicons name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} size={16} color={theme.text} />
          </TouchableOpacity>

          <View style={[s.pillDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)' }]} />

          <TouchableOpacity onPress={() => setSortOpen(true)} style={s.pillBtn}>
            <Ionicons name="swap-vertical-outline" size={16} color={theme.text} />
          </TouchableOpacity>

          <View style={[s.pillDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)' }]} />

          <TouchableOpacity onPress={() => setFilterOpen(true)} style={s.pillBtn}>
            <Ionicons
              name="options-outline"
              size={16}
              color={activeFilterCount > 0 ? theme.gold : theme.text}
            />
            {activeFilterCount > 0 && (
              <View style={s.pillBadge}>
                <Text style={s.pillBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── List content ── */}
      {viewMode === 'list' ? (
        <FlatList
          key="list"
          data={displayed}
          keyExtractor={(item) => String(item.id)}
          numColumns={1}
          contentContainerStyle={s.list}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
          ListHeaderComponent={sharedHeader}
          ListEmptyComponent={emptyComponent}
          renderItem={({ item }) => (
            <WatchlistListItem
              item={item}
              theme={theme}
              onPress={() => router.push(`/media/${item.media.tmdb_id}?type=${item.media.media_type}`)}
              onLog={() => router.push(`/log?tmdb_id=${item.media.tmdb_id}&type=${item.media.media_type}`)}
              onRemove={() => confirmRemove(item)}
            />
          )}
        />
      ) : (() => {
        const padded = [...displayed]
        while (padded.length % NUM_COLS !== 0) padded.push(null)
        return (
          <FlatList
            key="grid"
            data={padded}
            keyExtractor={(item, i) => item ? String(item.id) : `pad-${i}`}
            numColumns={NUM_COLS}
            contentContainerStyle={s.list}
            columnWrapperStyle={s.row}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
            ListHeaderComponent={sharedHeader}
            ListEmptyComponent={emptyComponent}
            renderItem={({ item }) => {
              if (!item) return <View style={{ width: ITEM_WIDTH }} />
              return (
                <View style={{ width: ITEM_WIDTH }}>
                  <PosterCard
                    item={item.media}
                    width={ITEM_WIDTH}
                    onPress={() => router.push(`/media/${item.media.tmdb_id}?type=${item.media.media_type}`)}
                    onLongPress={() => confirmRemove(item)}
                    comingSoon={isComingSoon(item)}
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
        )
      })()}

      {/* ── Sort sheet ── */}
      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={s.sortBackdrop} onPress={() => setSortOpen(false)}>
          <Pressable onPress={() => {}} style={[s.sortSheet, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
            <Text style={[s.sortTitle, { color: theme.textMut }]}>SORT BY</Text>
            {SORT_OPTIONS.map(opt => {
              const active = sort === opt.key
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => { setSort(opt.key); setSortOpen(false) }}
                  style={[s.sortOption, { borderBottomColor: theme.border }, active && { backgroundColor: theme.bg2 }]}
                >
                  <Text style={[s.sortOptionText, { color: active ? theme.gold : theme.text, fontWeight: active ? '800' : '500' }]}>
                    {opt.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color={theme.gold} />}
                </TouchableOpacity>
              )
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Filter sheet ── */}
      <Modal visible={filterOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFilterOpen(false)}>
        <FilterPanel
          theme={theme}
          filters={filters}
          onFiltersChange={(f) => { setFilters(f); setFilterOpen(false) }}
          onClose={() => setFilterOpen(false)}
          availableGenres={availableGenres}
          mode="watchlist"
        />
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  flex:         { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:         { paddingHorizontal: 16, paddingBottom: 140 },
  row:          { gap: GAP, marginBottom: GAP },
  headerBlock:  { marginBottom: 12 },
  title:        { fontSize: 24, fontWeight: '800' },
  subtitle:     { fontSize: 11, marginTop: 4, marginBottom: 4 },
  errorBox:     { backgroundColor: '#3f0000', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dc2626', borderRadius: 6, padding: 14 },
  errorText:    { color: '#fca5a5', fontSize: 13 },
  empty:        { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyEmoji:   { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyBody:    { fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  searchBtn:    {
    borderRadius: 6, paddingHorizontal: 24, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  searchBtnText: { color: '#fff', fontWeight: '800' },
  logBtn:        {
    borderRadius: 4, paddingVertical: 5, alignItems: 'center', marginTop: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  logBtnText:    { color: '#fff', fontSize: 10, fontWeight: '800' },

  // List view
  listItem:         {
    flexDirection: 'row', gap: 12, padding: 12,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  listPoster:       { width: 56, height: 80, borderRadius: 4 },
  listInfo:         { flex: 1, gap: 4 },
  listTitle:        { fontWeight: '800', fontSize: 14 },
  listMeta:         { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  listMetaText:     { fontSize: 12 },
  typeBadge:        { borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  typeBadgeText:    { fontSize: 10, fontWeight: '800', color: '#fff' },
  listGenres:       { fontSize: 10 },
  listAdded:        { fontSize: 10 },
  listActions:      { flexDirection: 'row', gap: 8, marginTop: 4 },
  listLogBtn:       { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 },
  listLogBtnText:   { color: '#fff', fontSize: 11, fontWeight: '800' },
  listRemoveBtn:    { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5, borderWidth: StyleSheet.hairlineWidth },
  listRemoveBtnText:{ fontSize: 11, fontWeight: '700' },

  // Floating pill
  floatingPillWrap: {
    position: 'absolute', right: 16, zIndex: 100,
    borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 18, elevation: 8,
  },
  floatingPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 28, overflow: 'hidden',
  },
  pillSpecular:   { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth },
  pillBtn:        { paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillDivider:    { width: 1, height: 16 },
  pillBadge:      { backgroundColor: '#dc2626', borderRadius: 8, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  pillBadgeText:  { color: '#fff', fontSize: 8, fontWeight: '800' },

  // Sort sheet
  sortBackdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortSheet:      { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingBottom: 32 },
  sortTitle:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sortOption:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sortOptionText: { fontSize: 15 },
})
