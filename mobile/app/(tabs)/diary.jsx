import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getDiary, deleteEntry, getInsights, getEmotions } from '../../lib/queries'
import EntryCard from '../../components/EntryCard'
import SwipeableRow from '../../components/SwipeableRow'
import FilterSortBar from '../../components/FilterSortBar'
import CalendarHeatmap from '../../components/CalendarHeatmap'
import { useTheme } from '../../context/ThemeContext'

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
    // last token is dir, rest is field
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

function InsightsBlock({ insights, entries, showHeatmap, onToggleHeatmap, theme }) {
  if (!insights) return null
  const { totalMovies, totalTV, avgRating, thisMonth } = insights
  return (
    <View>
      {/* Stats bar */}
      <View style={[s.insightsBar, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
        <View style={s.stat}><Text style={[s.statVal, { color: theme.gold }]}>{totalMovies}</Text><Text style={[s.statLbl, { color: theme.textMut }]}>Films</Text></View>
        <View style={[s.divider, { backgroundColor: theme.border }]} />
        <View style={s.stat}><Text style={[s.statVal, { color: theme.gold }]}>{totalTV}</Text><Text style={[s.statLbl, { color: theme.textMut }]}>TV Shows</Text></View>
        <View style={[s.divider, { backgroundColor: theme.border }]} />
        <View style={s.stat}><Text style={[s.statVal, { color: theme.gold }]}>{avgRating ? avgRating.toFixed(1) : '—'}</Text><Text style={[s.statLbl, { color: theme.textMut }]}>Avg ★</Text></View>
        <View style={[s.divider, { backgroundColor: theme.border }]} />
        <View style={s.stat}><Text style={[s.statVal, { color: theme.gold }]}>{thisMonth}</Text><Text style={[s.statLbl, { color: theme.textMut }]}>This Month</Text></View>
      </View>

      {/* Heatmap toggle */}
      <TouchableOpacity onPress={onToggleHeatmap} style={[s.heatmapToggle, { borderColor: theme.border }]}>
        <Ionicons name="calendar-outline" size={14} color={theme.textMut} />
        <Text style={[s.heatmapToggleText, { color: theme.textMut }]}>
          {showHeatmap ? 'Hide Activity' : 'Show Activity Calendar'}
        </Text>
        <Ionicons name={showHeatmap ? 'chevron-up' : 'chevron-down'} size={13} color={theme.textMut} />
      </TouchableOpacity>

      {showHeatmap && (
        <View style={[s.heatmapBox, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <CalendarHeatmap entries={entries} />
        </View>
      )}
    </View>
  )
}

export default function Diary() {
  const { theme } = useTheme()
  const router    = useRouter()

  const [entries,    setEntries]    = useState([])
  const [insights,   setInsights]   = useState(null)
  const [emotions,   setEmotions]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState('')
  const [showHeatmap,setShowHeatmap]= useState(false)
  const [filters,    setFilters]    = useState({ genre: '', minRating: '', maxRating: '', emotionIds: [], startDate: '', endDate: '' })
  const [sort,       setSort]       = useState('watched_on_desc')

  const load = useCallback(async () => {
    setError('')
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

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function handleDelete(id) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteEntry(id)
          setEntries(prev => prev.filter(e => e.id !== id))
        },
      },
    ])
  }

  // Available genres from current entries
  const availableGenres = useMemo(() => {
    const genreSet = new Set()
    entries.forEach(e => (e.media?.genres ?? []).forEach(g => genreSet.add(g)))
    return [...genreSet].sort()
  }, [entries])

  // Active filter count
  const activeFilterCount = [
    filters.genre,
    filters.minRating,
    filters.maxRating,
    ...(filters.emotionIds ?? []),
  ].filter(Boolean).length + (filters.startDate || filters.endDate ? 1 : 0)

  // Filtered + sorted entries
  const displayed = useMemo(() => applyFiltersSort(entries, filters, sort), [entries, filters, sort])
  const groups     = groupByMonth(displayed)

  // Flat list data
  const listData = []
  for (const g of groups) {
    listData.push({ type: 'header', month: g.month, key: `h-${g.month}` })
    for (const e of g.entries) listData.push({ type: 'entry', entry: e, key: `e-${e.id}` })
  }

  if (loading) return <View style={[s.center, { backgroundColor: theme.bg0 }]}><ActivityIndicator size="large" color={theme.gold} /></View>

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <FlatList
        data={listData}
        keyExtractor={item => item.key}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <View style={s.titleRow}>
              <View>
                <Text style={[s.title, { color: theme.text }]}>My Diary</Text>
                <Text style={[s.subtitle, { color: theme.textMut }]}>Every watch session with date, rating & notes</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/log')} style={[s.logBtn, { backgroundColor: theme.red }]}>
                <Text style={s.logBtnText}>+ Log</Text>
              </TouchableOpacity>
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
              />
            )}

            <View style={{ marginTop: 12 }}>
              <FilterSortBar
                filters={filters}
                onFiltersChange={setFilters}
                sort={sort}
                onSortChange={setSort}
                emotions={emotions}
                availableGenres={availableGenres}
                mode="diary"
                activeCount={activeFilterCount}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          !error ? (
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
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={[s.monthHeader, { color: theme.textMut, borderBottomColor: theme.border }]}>{item.month}</Text>
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
    </View>
  )
}

const s = StyleSheet.create({
  flex:            { flex: 1 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:            { padding: 16, paddingBottom: 48 },
  headerBlock:     { marginBottom: 12 },
  titleRow:        { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  title:           { fontSize: 24, fontWeight: '800' },
  subtitle:        { fontSize: 11, marginTop: 3 },
  logBtn:          { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  logBtnText:      { color: '#fff', fontWeight: '700', fontSize: 13 },
  insightsBar:     { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  stat:            { flex: 1, alignItems: 'center' },
  statVal:         { fontSize: 18, fontWeight: '700' },
  statLbl:         { fontSize: 10, marginTop: 2 },
  divider:         { width: 1, height: 30 },
  heatmapToggle:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  heatmapToggleText:{ fontSize: 12, flex: 1 },
  heatmapBox:      { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  monthHeader:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 10, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  empty:           { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:      { fontSize: 17, marginBottom: 8 },
  emptyLink:       { fontSize: 14 },
  errorBox:        { backgroundColor: '#3f0000', borderWidth: 1, borderColor: '#dc2626', borderRadius: 12, padding: 14, marginBottom: 12 },
  errorText:       { color: '#fca5a5', fontSize: 13, lineHeight: 18 },
})
