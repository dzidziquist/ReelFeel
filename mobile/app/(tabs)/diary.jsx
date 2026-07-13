import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, Dimensions, StyleSheet, Modal, Pressable,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { getDiary, deleteEntry, getInsights, getEmotions } from '../../lib/queries'
import { DEMO_MODE } from '../../constants/demo'
import { DEMO_ENTRIES, DEMO_INSIGHTS, DEMO_EMOTIONS } from '../../lib/demoData'
import EntryCard from '../../components/EntryCard'
import SwipeableRow from '../../components/SwipeableRow'
import { FilterPanel } from '../../components/FilterSortBar'
import CalendarHeatmap from '../../components/CalendarHeatmap'
import PosterCard from '../../components/PosterCard'
import { useTheme } from '../../context/ThemeContext'
import { useTabBar } from '../../context/TabBarContext'

const NUM_COLS   = 3
const GAP        = 10
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - GAP * (NUM_COLS - 1)) / NUM_COLS

const SORT_OPTIONS = [
  { key: 'watched_on_desc', label: 'Date (newest)' },
  { key: 'watched_on_asc',  label: 'Date (oldest)' },
  { key: 'rating_desc',     label: 'Rating (high)'  },
  { key: 'rating_asc',      label: 'Rating (low)'   },
  { key: 'title_asc',       label: 'Title A–Z'      },
  { key: 'title_desc',      label: 'Title Z–A'      },
]

function groupByMonth(entries) {
  const groups = []
  const map    = new Map()
  for (const e of entries) {
    const d = new Date(e.watched_on + 'T00:00:00')
    const key = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!map.has(key)) { map.set(key, []); groups.push(key) }
    map.get(key).push(e)
  }
  return groups.map(k => ({ month: k, entries: map.get(k) }))
}

function applyFiltersSort(entries, filters, sort) {
  let result = [...entries]

  if (filters.genre) {
    result = result.filter(e => {
      const genres = e.media?.genres ?? []
      return Array.isArray(genres) ? genres.includes(filters.genre) : false
    })
  }
  if (filters.minRating !== '' && filters.minRating != null) {
    const min = parseFloat(filters.minRating)
    if (!isNaN(min)) result = result.filter(e => Number(e.rating) >= min)
  }
  if (filters.maxRating !== '' && filters.maxRating != null) {
    const max = parseFloat(filters.maxRating)
    if (!isNaN(max)) result = result.filter(e => Number(e.rating) <= max)
  }
  if (filters.emotionIds?.length) {
    result = result.filter(e =>
      e.emotions?.some(em => filters.emotionIds.includes(em.id))
    )
  }
  if (filters.startDate) result = result.filter(e => e.watched_on >= filters.startDate)
  if (filters.endDate)   result = result.filter(e => e.watched_on <= filters.endDate)

  const [field, dir] = (sort ?? 'watched_on_desc').split('_').reduce((acc, part, i, arr) => {
    if (i === arr.length - 1) return [arr.slice(0, -1).join('_'), part]
    return acc
  }, ['watched_on', 'desc'])

  result.sort((a, b) => {
    let av, bv
    if (field === 'watched_on') { av = a.watched_on; bv = b.watched_on }
    else if (field === 'rating') { av = Number(a.rating); bv = Number(b.rating) }
    else if (field === 'title') { av = a.media?.title ?? ''; bv = b.media?.title ?? '' }
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })

  return result
}

function InsightsBlock({ insights, entries, showHeatmap, onToggleHeatmap, theme, calendarDate, onDateSelect }) {
  if (!insights) return null
  const { totalMovies, totalTV, avgRating, thisMonth } = insights
  return (
    <View>
      <View style={[s.insightsBar, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
        <View style={s.stat}><Text style={[s.statVal, { color: theme.gold }]}>{totalMovies}</Text><Text style={[s.statLbl, { color: theme.textMut }]}>Films</Text></View>
        <View style={[s.divider, { backgroundColor: theme.text }]} />
        <View style={s.stat}><Text style={[s.statVal, { color: theme.gold }]}>{totalTV}</Text><Text style={[s.statLbl, { color: theme.textMut }]}>TV Shows</Text></View>
        <View style={[s.divider, { backgroundColor: theme.text }]} />
        <View style={s.stat}><Text style={[s.statVal, { color: theme.gold }]}>{avgRating ? avgRating.toFixed(1) : '—'}</Text><Text style={[s.statLbl, { color: theme.textMut }]}>Avg ★</Text></View>
        <View style={[s.divider, { backgroundColor: theme.text }]} />
        <View style={s.stat}><Text style={[s.statVal, { color: theme.gold }]}>{thisMonth}</Text><Text style={[s.statLbl, { color: theme.textMut }]}>This Month</Text></View>
      </View>

      <TouchableOpacity onPress={onToggleHeatmap} style={[s.heatmapToggle, { borderBottomColor: theme.text }]}>
        <Ionicons name="calendar-outline" size={14} color={theme.textMut} />
        <Text style={[s.heatmapToggleText, { color: theme.textMut }]}>
          {showHeatmap ? 'Hide Activity' : 'Show Activity Calendar'}
        </Text>
        <Ionicons name={showHeatmap ? 'chevron-up' : 'chevron-down'} size={13} color={theme.textMut} />
      </TouchableOpacity>

      {showHeatmap && (
        <View style={[s.heatmapBox, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
          <CalendarHeatmap
            entries={entries}
            selectedDate={calendarDate}
            onDateSelect={onDateSelect}
          />
          {calendarDate && (
            <TouchableOpacity
              onPress={() => onDateSelect(null)}
              style={[s.calendarClearBtn, { backgroundColor: theme.gold }]}
            >
              <Text style={s.calendarClearText}>
                {new Date(calendarDate + 'T00:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })} · Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

export default function Diary() {
  const { theme, isDark }  = useTheme()
  const { onScroll, reset } = useTabBar()
  const router             = useRouter()
  const insets             = useSafeAreaInsets()

  const [entries,     setEntries]     = useState([])
  const [insights,    setInsights]    = useState(null)
  const [emotions,    setEmotions]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [error,       setError]       = useState('')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [viewMode,    setViewMode]    = useState('list')
  const [filters,     setFilters]     = useState({ genre: '', minRating: '', maxRating: '', emotionIds: [], startDate: '', endDate: '' })
  const [sort,        setSort]        = useState('watched_on_desc')
  const [filterOpen,    setFilterOpen]    = useState(false)
  const [sortOpen,      setSortOpen]      = useState(false)
  const [calendarDate,  setCalendarDate]  = useState(null)

  const load = useCallback(async () => {
    setError('')
    if (DEMO_MODE) {
      setEntries(DEMO_ENTRIES)
      setInsights(DEMO_INSIGHTS)
      setEmotions(DEMO_EMOTIONS)
      return
    }
    try {
      const [data, ins, emos] = await Promise.all([getDiary(), getInsights(), getEmotions()])
      setEntries(data)
      setInsights(ins)
      setEmotions(emos)
    } catch (err) {
      if (err?.code === 'PGRST205' || err?.message?.includes('schema cache')) {
        setError('Database tables not found. Run supabase/schema.sql in your Supabase SQL Editor.')
      } else {
        setError(err.message)
      }
    }
  }, [])

  useFocusEffect(useCallback(() => { reset(); load().catch(() => {}) }, [load]))
  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  async function handleRefresh() { setRefreshing(true); await load(); setRefreshing(false) }

  async function handleDelete(id) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(id)
            setEntries(prev => prev.filter(e => e.id !== id))
          } catch {
            Alert.alert('Error', 'Could not delete entry. Please try again.')
          }
        },
      },
    ])
  }

  const availableGenres = useMemo(() => {
    const genreSet = new Set()
    entries.forEach(e => (e.media?.genres ?? []).forEach(g => genreSet.add(g)))
    return [...genreSet].sort()
  }, [entries])

  const activeFilterCount = [
    filters.genre,
    filters.minRating,
    filters.maxRating,
    ...(filters.emotionIds ?? []),
  ].filter(Boolean).length + (filters.startDate || filters.endDate ? 1 : 0)

  const displayed = useMemo(() => {
    const base = applyFiltersSort(entries, filters, sort)
    if (!calendarDate) return base
    return base.filter(e => e.watched_on?.slice(0, 10) === calendarDate)
  }, [entries, filters, sort, calendarDate])
  const groups     = groupByMonth(displayed)

  const listData = []
  for (const g of groups) {
    listData.push({ type: 'header', month: g.month, key: `h-${g.month}` })
    for (const e of g.entries) listData.push({ type: 'entry', entry: e, key: `e-${e.id}` })
  }

  if (loading) return (
    <View style={[s.center, { backgroundColor: theme.bg0 }]}>
      <ActivityIndicator size="large" color={theme.gold} />
    </View>
  )

  const sharedHeader = (
    <View style={[s.headerBlock, { paddingTop: insets.top + 16 }]}>
      <View style={s.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: theme.text }]}>My Diary</Text>
          <Text style={[s.subtitle, { color: theme.textMut }]}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'} logged</Text>
        </View>
      </View>

      {error ? (
        <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
      ) : (
        <InsightsBlock
          insights={insights}
          entries={entries}
          showHeatmap={showHeatmap}
          onToggleHeatmap={() => setShowHeatmap(v => !v)}
          theme={theme}
          calendarDate={calendarDate}
          onDateSelect={setCalendarDate}
        />
      )}
    </View>
  )

  const emptyComponent = !error ? (
    <View style={s.empty}>
      <Text style={s.emptyEmoji}>📔</Text>
      <Text style={[s.emptyTitle, { color: theme.textSub }]}>
        {activeFilterCount > 0 ? 'No entries match your filters.' : 'No entries yet.'}
      </Text>
      {activeFilterCount > 0
        ? <TouchableOpacity onPress={() => setFilters({ genre: '', minRating: '', maxRating: '', emotionIds: [], startDate: '', endDate: '' })}>
            <Text style={[s.emptyLink, { color: theme.gold }]}>Clear filters</Text>
          </TouchableOpacity>
        : <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <Text style={[s.emptyLink, { color: theme.gold }]}>Search for something to watch</Text>
          </TouchableOpacity>
      }
    </View>
  ) : null

  const activeSortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>

      {/* ── Floating pill ── */}
      <View style={[s.floatingPillWrap, { top: insets.top + 8 }]}>
        <View style={s.floatingPill}>
          <BlurView intensity={isDark ? 72 : 88} tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, s.pillSpecular, { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)' }]} />

          <TouchableOpacity
            onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
            style={s.pillBtn}
          >
            <Ionicons name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} size={16} color={theme.text} />
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

          <View style={[s.pillDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)' }]} />

          <TouchableOpacity onPress={() => router.push('/log')} style={[s.pillBtn, s.pillLogBtn, { backgroundColor: theme.red }]}>
            <Text style={s.pillLogBtnText}>+ Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── List content ── */}
      {viewMode === 'grid' ? (() => {
        const seen = new Map()
        for (const e of displayed) {
          const mid = e.media?.id
          if (!mid) continue
          const prev = seen.get(mid)
          if (!prev || Number(e.rating) > Number(prev.rating)) seen.set(mid, e)
        }
        const deduped = [...seen.values()]
        const padded  = [...deduped]
        while (padded.length % NUM_COLS !== 0) padded.push(null)
        return (
          <FlatList
            key="grid"
            data={padded}
            keyExtractor={(item, i) => item ? `g-${item.id}` : `pad-${i}`}
            numColumns={NUM_COLS}
            contentContainerStyle={s.list}
            columnWrapperStyle={s.gridRow}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
            ListHeaderComponent={sharedHeader}
            ListEmptyComponent={emptyComponent}
            renderItem={({ item }) => {
              if (!item) return <View style={{ width: ITEM_WIDTH }} />
              return (
                <PosterCard
                  item={item.media}
                  width={ITEM_WIDTH}
                  watchState={{ watched: true, liked: Number(item.rating) >= 4, rated: true, inWatchlist: false }}
                  userRating={item.rating}
                  onPress={() => router.push(`/media/${item.media.tmdb_id}?type=${item.media.media_type}`)}
                  onLongPress={() => handleDelete(item.id)}
                />
              )
            }}
          />
        )
      })() : (
        <FlatList
          key="list"
          data={listData}
          keyExtractor={item => item.key}
          contentContainerStyle={s.list}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
          ListHeaderComponent={sharedHeader}
          ListEmptyComponent={emptyComponent}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={[s.monthHeader, { color: theme.textMut, borderBottomColor: theme.text }]}>{item.month}</Text>
            }
            return (
              <View style={{ marginBottom: 10 }}>
                <SwipeableRow onDelete={() => handleDelete(item.entry.id)}>
                  <EntryCard entry={item.entry} onDelete={handleDelete} />
                </SwipeableRow>
              </View>
            )
          }}
        />
      )}

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
          emotions={emotions}
          availableGenres={availableGenres}
          mode="diary"
        />
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  flex:         { flex: 1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:         { paddingHorizontal: 16, paddingBottom: 140 },
  headerBlock:  { paddingHorizontal: 0, marginBottom: 12 },
  titleRow:     { marginBottom: 14 },
  title:        { fontSize: 24, fontWeight: '800' },
  subtitle:     { fontSize: 11, marginTop: 3 },
  gridRow:      { gap: GAP, marginBottom: GAP },
  insightsBar:  {
    flexDirection: 'row', alignItems: 'center', borderRadius: 6, padding: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  stat:         { flex: 1, alignItems: 'center' },
  statVal:      { fontSize: 18, fontWeight: '800' },
  statLbl:      { fontSize: 10, marginTop: 2 },
  divider:      { width: StyleSheet.hairlineWidth, height: 30 },
  heatmapToggle:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  heatmapToggleText:{ fontSize: 12, flex: 1 },
  heatmapBox:        { borderRadius: 6, padding: 14, borderWidth: StyleSheet.hairlineWidth, marginBottom: 10, overflow: 'hidden' },
  calendarClearBtn:  { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  calendarClearText: { fontSize: 12, fontWeight: '700', color: '#000' },
  monthHeader:  { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  empty:        { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:   { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { fontSize: 17, marginBottom: 8 },
  emptyLink:    { fontSize: 14 },
  errorBox:     { backgroundColor: '#3f0000', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dc2626', borderRadius: 6, padding: 14, marginBottom: 12 },
  errorText:    { color: '#fca5a5', fontSize: 13, lineHeight: 18 },

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
  pillLogBtn:     { paddingHorizontal: 14 },
  pillLogBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  pillDivider:    { width: 1, height: 16 },
  pillBadge:      { backgroundColor: '#dc2626', borderRadius: 8, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  pillBadgeText:  { color: '#fff', fontSize: 8, fontWeight: '800' },

  // Sort sheet
  sortBackdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortSheet:       { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingBottom: 32 },
  sortTitle:       { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sortOption:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sortOptionText:  { fontSize: 15 },
})
