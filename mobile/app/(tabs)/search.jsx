import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, Modal, Pressable,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { searchTMDB, getRecommendations } from '../../lib/tmdb'
import { addToWatchlist, getRecommendationSeeds, getUserGenreAffinity, getWatchStatesForTmdbIds } from '../../lib/queries'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../context/ThemeContext'
import { useTabBar } from '../../context/TabBarContext'

const isFilm = r => r.media_type === 'film' || r.media_type === 'movie'

const ResultCard = memo(function ResultCard({ r, saving, onWatchlist, onLog, onPress, theme, isRec }) {
  const posterUri = r.poster_url ?? (r.poster_path ? `https://image.tmdb.org/t/p/w200${r.poster_path}` : null)

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[s.resultCard, { backgroundColor: theme.bg1, borderColor: theme.text, shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity }]}
    >
      <View>
        {posterUri
          ? <Image source={posterUri} style={s.poster} contentFit="cover" cachePolicy="memory-disk" />
          : <View style={[s.poster, { backgroundColor: theme.bg2, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 24 }}>🎬</Text>
            </View>
        }
        {r.tmdb_rating != null && (
          <View style={s.ratingBadge}>
            <Ionicons name="star" size={9} color={theme.gold} />
            <Text style={[s.ratingBadgeText, { color: theme.gold }]}>{Number(r.tmdb_rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={s.resultInfo}>
        <View>
          <Text style={[s.resultTitle, { color: theme.text }]} numberOfLines={2}>{r.title}</Text>
          <View style={s.resultMeta}>
            {r.year ? <Text style={[s.metaYear, { color: theme.textMut }]}>{r.year}</Text> : null}
            <View style={[s.typeBadge, { borderColor: isFilm(r) ? theme.red : theme.gold }]}>
              <Text style={[s.typeText, { color: isFilm(r) ? theme.redL : theme.goldL }]}>
                {isFilm(r) ? 'Film' : 'TV Show'}
              </Text>
            </View>
            {!isRec && isFilm(r) && r.comingSoon && (
              <View style={[s.comingSoonChip, { borderColor: theme.info ?? '#3b82f6', backgroundColor: (theme.info ?? '#3b82f6') + '22' }]}>
                <Text style={[s.comingSoonChipLabel, { color: theme.info ?? '#3b82f6' }]}>
                  {'Coming Soon'}
                  {r.release_date ? ` · ${new Date(r.release_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                </Text>
              </View>
            )}
          </View>
          {isRec && r._reason ? <Text style={[s.recReason, { color: theme.textMut }]}>{r._reason}</Text> : null}
          {r.overview ? <Text style={[s.overview, { color: theme.textMut }]} numberOfLines={2}>{r.overview}</Text> : null}
        </View>

        <View style={s.actionRow}>
          <TouchableOpacity onPress={onLog} style={[s.logBtn, { backgroundColor: theme.red }]}>
            <Text style={s.logBtnText}>+ Log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onWatchlist}
            disabled={!!saving}
            style={[
              s.watchlistBtn,
              saving === 'saved'
                ? { backgroundColor: theme.gold + '22', borderColor: theme.gold }
                : { backgroundColor: theme.bg2, borderColor: theme.text },
            ]}
          >
            {saving === 'saving' ? (
              <ActivityIndicator size="small" color={theme.gold} />
            ) : saving === 'saved' ? (
              <>
                <Ionicons name="bookmark" size={13} color={theme.gold} />
                <Text style={[s.watchlistBtnText, { color: theme.gold }]}>Saved</Text>
              </>
            ) : (
              <>
                <Ionicons name="bookmark-outline" size={13} color={theme.gold} />
                <Text style={[s.watchlistBtnText, { color: theme.gold }]}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
})

export default function Search() {
  const { theme, isDark } = useTheme()
  const { onScroll, reset } = useTabBar()
  const insets = useSafeAreaInsets()
  const [query,       setQuery]       = useState('')
  const [results,     setResults]     = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState({})
  const [recs,        setRecs]        = useState([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [typeFilter,  setTypeFilter]  = useState('all')
  const [filterOpen,  setFilterOpen]  = useState(false)
  const debounce = useRef(null)
  const router   = useRouter()

  const loadRecs = useCallback(async () => {
    setRecsLoading(true)
    try {
      const [seeds, affinityGenres] = await Promise.all([
        getRecommendationSeeds(),
        getUserGenreAffinity().catch(() => []),
      ])
      if (!seeds.length) return

      const batches = await Promise.all(
        seeds.map(s => getRecommendations(s.tmdb_id, s.media_type))
      )

      const seen  = new Set()
      const items = []
      const maxLen = Math.max(...batches.map(b => b.length))
      for (let i = 0; i < maxLen; i++) {
        for (let j = 0; j < batches.length; j++) {
          const item = batches[j][i]
          if (!item || seen.has(item.tmdb_id) || !item.poster_path) continue
          seen.add(item.tmdb_id)
          const seed = seeds[j]
          items.push({
            ...item,
            _reason: seed.tier === 'watchlist' ? `Watchlist: ${seed.title}` : `Loved: ${seed.title}`,
          })
        }
      }

      let filtered = items
      if (affinityGenres.length) {
        const genreFiltered = items.filter(item =>
          (item.genres ?? []).some(g => affinityGenres.includes(g))
        )
        if (genreFiltered.length >= 10) filtered = genreFiltered
      }

      const allIds     = filtered.map(i => i.tmdb_id)
      const watchStates = await getWatchStatesForTmdbIds(allIds).catch(() => new Map())
      setRecs(filtered.filter(i => !watchStates.get(i.tmdb_id)?.watched).slice(0, 20))
    } catch (_) {}
    finally { setRecsLoading(false) }
  }, [])

  useEffect(() => { loadRecs() }, [loadRecs])

  const recsRef = useRef([])
  useEffect(() => { recsRef.current = recs }, [recs])

  useFocusEffect(useCallback(() => {
    reset()
    const current = recsRef.current
    if (!current.length) return
    getWatchStatesForTmdbIds(current.map(r => r.tmdb_id))
      .then(states => setRecs(prev => prev.filter(r => !states.get(r.tmdb_id)?.watched)))
      .catch(() => {})
  }, []))

  function handleInput(val) {
    setQuery(val)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      if (val.trim()) doSearch(val.trim())
      else setResults([])
    }, 300)
  }

  async function doSearch(q) {
    setLoading(true)
    setError('')
    try {
      setResults(await searchTMDB(q))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleWatchlist(r) {
    setSaving(prev => ({ ...prev, [r.tmdb_id]: 'saving' }))
    try {
      await addToWatchlist(r.tmdb_id, r.media_type)
      setSaving(prev => ({ ...prev, [r.tmdb_id]: 'saved' }))
      setTimeout(() => setSaving(prev => ({ ...prev, [r.tmdb_id]: false })), 2000)
    } catch {
      setSaving(prev => ({ ...prev, [r.tmdb_id]: false }))
      Alert.alert('Error', 'Could not save to watchlist. Please try again.')
    }
  }

  const showRecs = !query && recs.length > 0
  const rawData  = query ? results : recs
  const data     = useMemo(() => {
    if (typeFilter === 'all') return rawData
    const wantFilm = typeFilter === 'film'
    return rawData.filter(r => wantFilm ? isFilm(r) : !isFilm(r))
  }, [rawData, typeFilter])

  const renderItem = useCallback(({ item: r }) => (
    <ResultCard
      r={r}
      isRec={!query}
      saving={saving[r.tmdb_id]}
      theme={theme}
      onPress={() => router.push(`/media/${r.tmdb_id}?type=${r.media_type}`)}
      onLog={() => router.push(`/log?tmdb_id=${r.tmdb_id}&type=${r.media_type}`)}
      onWatchlist={() => handleWatchlist(r)}
    />
  ), [saving, theme, query])

  const tint      = isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'
  const dividerBg = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'
  const specular  = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'
  const isFiltered = typeFilter !== 'all'

  const FILTER_OPTIONS = [
    { key: 'all',  label: 'All' },
    { key: 'film', label: 'Films' },
    { key: 'tv',   label: 'TV Shows' },
  ]

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <FlatList
        data={data}
        keyExtractor={r => `${r.tmdb_id}-${r.media_type}`}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={[s.headerBlock, { paddingTop: insets.top + 16 }]}>
            <Text style={[s.title, { color: theme.text }]}>Search</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.input, { backgroundColor: theme.bg2, borderColor: theme.text, color: theme.text, shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity }]}
                placeholder="Search films and TV shows…"
                placeholderTextColor={theme.textMut}
                value={query}
                onChangeText={handleInput}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => { setQuery(''); setResults([]); clearTimeout(debounce.current) }}
                  style={[s.clearBtn, { backgroundColor: theme.bg3, borderColor: theme.text }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={16} color={theme.textMut} />
                </TouchableOpacity>
              )}
            </View>

            {error ? (
              <View style={[s.errorBox, { borderColor: theme.red }]}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
            {loading ? <ActivityIndicator color={theme.gold} style={{ marginTop: 20 }} /> : null}
            {!loading && query && data.length === 0 && !error
              ? <Text style={[s.noResults, { color: theme.textMut }]}>
                  {results.length > 0 ? `No ${typeFilter === 'film' ? 'films' : 'TV shows'} for "${query}"` : `No results for "${query}"`}
                </Text>
              : null}
            {showRecs && (
              recsLoading
                ? <ActivityIndicator color={theme.gold} style={{ marginTop: 28 }} />
                : (
                  <View style={s.recsHeader}>
                    <Ionicons name="sparkles" size={15} color={theme.gold} />
                    <Text style={[s.recsTitle, { color: theme.text }]}>Picks for You</Text>
                  </View>
                )
            )}
          </View>
        }
      />

      {/* ── Floating filter pill ── */}
      <View style={[s.pillWrap, { top: insets.top + 8 }]}>
        <View style={s.pill}>
          <BlurView intensity={isDark ? 72 : 88} tint={tint} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, s.pillSpecular, { borderColor: specular }]} />
          <TouchableOpacity onPress={() => setFilterOpen(true)} style={s.filterBtn} activeOpacity={0.75}>
            <Ionicons name="options-outline" size={18} color={isFiltered ? theme.gold : theme.textMut} />
            {isFiltered && <View style={s.badge} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter sheet ── */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setFilterOpen(false)}>
          <Pressable onPress={() => {}} style={[s.sheet, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[s.sheetTitle, { color: theme.textMut }]}>SHOW</Text>
            {FILTER_OPTIONS.map(f => {
              const active = typeFilter === f.key
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => { setTypeFilter(f.key); setFilterOpen(false) }}
                  style={[s.sheetOption, { borderBottomColor: theme.border }, active && { backgroundColor: theme.bg2 }]}
                >
                  <Text style={[s.sheetOptionText, { color: active ? theme.gold : theme.text, fontWeight: active ? '800' : '500' }]}>
                    {f.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color={theme.gold} />}
                </TouchableOpacity>
              )
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  flex:             { flex: 1 },
  list:             { padding: 16, paddingBottom: 140 },
  headerBlock:      { marginBottom: 12 },
  title:            { fontSize: 22, fontWeight: '900', marginBottom: 16 },
  inputRow:         { position: 'relative' },
  input:            {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12, paddingRight: 44, fontSize: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  clearBtn:         {
    position: 'absolute', right: 10, top: '50%', marginTop: -15,
    width: 30, height: 30, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
  },
  pillWrap: {
    position: 'absolute', right: 16, zIndex: 100,
    borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 18, elevation: 8,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 28, overflow: 'hidden',
  },
  pillSpecular: { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 4,
  },
  badge: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#dc2626',
    position: 'absolute', top: 6, right: 6,
  },
  backdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:           { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingBottom: 32 },
  sheetTitle:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sheetOption:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionText: { fontSize: 15 },
  recsHeader:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 28, marginBottom: 4 },
  recsTitle:        { fontSize: 17, fontWeight: '800' },
  errorBox:         { backgroundColor: '#3f0000', borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12, marginTop: 12 },
  errorText:        { color: '#fca5a5', fontSize: 13 },
  noResults:        { textAlign: 'center', marginTop: 40 },
  recReason:        { fontSize: 10, fontStyle: 'italic', marginTop: 2 },
  resultCard:       {
    borderRadius: 6, flexDirection: 'row', gap: 12, padding: 12, marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  poster:           { width: 64, height: 96, borderRadius: 4 },
  ratingBadge:      { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingBadgeText:  { fontSize: 9, fontWeight: '700' },
  resultInfo:       { flex: 1, justifyContent: 'space-between' },
  resultTitle:      { fontWeight: '600', fontSize: 13, lineHeight: 18 },
  resultMeta:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  metaYear:         { fontSize: 12 },
  typeBadge:        { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText:         { fontSize: 11 },
  overview:         { fontSize: 11, marginTop: 4, lineHeight: 16 },
  actionRow:        { flexDirection: 'row', gap: 8, marginTop: 8 },
  logBtn:           {
    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, flex: 1, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  logBtnText:           { color: '#fff', fontSize: 12, fontWeight: '700' },
  watchlistBtn:         { borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4, borderWidth: StyleSheet.hairlineWidth },
  watchlistBtnText:     { fontSize: 12, fontWeight: '600' },
  comingSoonChip:       { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  comingSoonChipLabel:  { fontSize: 11, fontWeight: '700' },
})
