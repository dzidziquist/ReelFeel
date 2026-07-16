import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  Modal, ActivityIndicator, StatusBar, StyleSheet, Dimensions,
  Alert,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getTrending, getNowPlaying, getPopularTV, getUpcoming, getAiringToday, getRecommendations, discoverByGenre } from '../../lib/tmdb'
import { addToWatchlist, createEntry, deleteEntry, getWatchStatesForTmdbIds, getRecommendationSeeds, getUserGenreAffinity } from '../../lib/queries'
import { DEMO_MODE } from '../../constants/demo'
import { DEMO_HOME } from '../../lib/demoData'
import { StarPicker } from '../../components/StarRating'
import PosterCard from '../../components/PosterCard'
import ActionSheet from '../../components/ActionSheet'
import { useTheme } from '../../context/ThemeContext'
import { useTabBar } from '../../context/TabBarContext'

const CARD_WIDTH = 120
const CARD_GAP   = 12

const GENRES = [
  { ids: [28, 10759], label: 'Action' },
  { ids: [35],        label: 'Comedy' },
  { ids: [18],        label: 'Drama' },
  { ids: [27],        label: 'Horror' },
  { ids: [878, 10765],label: 'Sci-Fi' },
  { ids: [53],        label: 'Thriller' },
  { ids: [16],        label: 'Animation' },
  { ids: [80],        label: 'Crime' },
  { ids: [12],        label: 'Adventure' },
  { ids: [10749],     label: 'Romance' },
]

function filterByGenre(items, genre) {
  if (!genre) return items
  const g = GENRES.find(x => x.label === genre)
  if (!g) return items
  return items.filter(item => (item.genres ?? []).some(id => g.ids.includes(id)))
}

function HeroCard({ item, onPress, onLongPress, onSave, theme, dotIndex, dotTotal, watchState }) {
  if (!item) return null
  const isFilm      = item.media_type === 'film' || item.media_type === 'movie'
  const inWatchlist = watchState?.inWatchlist
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.92} style={s.heroCard}>
      {item.backdrop_url ? (
        <Image
          source={item.backdrop_url}
          style={s.heroImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={500}
        />
      ) : (
        <View style={[s.heroImage, { backgroundColor: theme.bg2 }]} />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.12)' }]} />
      <View style={s.heroBottom}>
        <View style={[s.heroBadge, { backgroundColor: isFilm ? 'rgba(140,15,15,0.9)' : 'rgba(100,70,0,0.9)' }]}>
          <Text style={s.heroBadgeText}>{isFilm ? 'FILM' : 'TV'}</Text>
        </View>
        <Text style={s.heroTitle} numberOfLines={2}>{item.title}</Text>
        <View style={s.heroMeta}>
          {item.tmdb_rating != null && (
            <View style={s.heroRatingRow}>
              <Ionicons name="star" size={11} color={theme.gold} />
              <Text style={[s.heroRatingText, { color: theme.gold }]}>{item.tmdb_rating.toFixed(1)}</Text>
            </View>
          )}
          {item.year ? <Text style={s.heroYear}>{item.year}</Text> : null}
        </View>
        <View style={s.heroActions}>
          <TouchableOpacity onPress={onPress} style={s.heroViewBtn}>
            <Text style={s.heroViewBtnText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => !inWatchlist && onSave(item)}
            style={[s.heroSaveBtn, { backgroundColor: inWatchlist ? theme.bg3 : theme.gold }]}
          >
            <Ionicons name={inWatchlist ? 'bookmark' : 'bookmark-outline'} size={13} color={inWatchlist ? theme.textSub : '#000'} />
            <Text style={[s.heroSaveBtnText, { color: inWatchlist ? theme.textSub : '#000' }]}>
              {inWatchlist ? 'Saved' : 'Watchlist'}
            </Text>
          </TouchableOpacity>
        </View>
        {dotTotal > 1 && (
          <View style={s.heroDots}>
            {Array.from({ length: dotTotal }).map((_, i) => (
              <View key={i} style={[s.heroDot, i === dotIndex && s.heroDotActive]} />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

function GenreChips({ genres, selected, onSelect, theme }) {
  const all = [{ label: 'All', ids: null }, ...genres]
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.chipsScroll}
      contentContainerStyle={s.chipsRow}
    >
      {all.map(g => {
        const active = g.ids === null ? !selected : selected === g.label
        return (
          <TouchableOpacity
            key={g.label}
            onPress={() => onSelect(g.ids === null ? null : (active ? null : g.label))}
            style={[
              s.chip,
              active
                ? { backgroundColor: theme.gold, borderColor: theme.gold }
                : { backgroundColor: 'transparent', borderColor: theme.border },
            ]}
            activeOpacity={0.75}
          >
            {active && <Ionicons name="checkmark" size={11} color="#000" />}
            <Text style={[s.chipText, { color: active ? '#000' : theme.textSub, fontWeight: active ? '800' : '600' }]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const Section = memo(function Section({ title, emoji, data, onItemPress, onItemLongPress, watchStates, showReason = false, onSeeAll }) {
  const { theme } = useTheme()
  if (!data?.length) return null
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: theme.text }]}>{emoji}  {title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {data.map(item => (
          <PosterCard
            key={`${item.tmdb_id}-${item.media_type}`}
            item={item}
            width={CARD_WIDTH}
            onPress={() => onItemPress(item)}
            onLongPress={() => onItemLongPress(item)}
            watchState={watchStates?.get(item.tmdb_id)}
            comingSoon={item.comingSoon}
            reason={showReason ? item._reason : null}
            style={{ marginRight: CARD_GAP }}
          />
        ))}
        {onSeeAll && (
          <TouchableOpacity
            onPress={onSeeAll}
            style={[s.seeAllCard, { backgroundColor: theme.bg2, borderColor: theme.border }]}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-forward-circle-outline" size={30} color={theme.textMut} />
            <Text style={[s.seeAllCardText, { color: theme.textMut }]}>See all</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
})

function EmptyForYou({ onPress, theme }) {
  return (
    <View style={[s.emptyCard, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
      <Text style={s.emptyEmoji}>🎯</Text>
      <Text style={[s.emptyTitle, { color: theme.text }]}>No picks yet</Text>
      <Text style={[s.emptyDesc, { color: theme.textMut }]}>Log a film to get personalised recommendations</Text>
      <TouchableOpacity onPress={onPress} style={[s.emptyBtn, { backgroundColor: theme.red }]}>
        <Text style={s.emptyBtnText}>Find something to watch</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function Home() {
  const { theme, isDark } = useTheme()
  const { onScroll, reset } = useTabBar()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [nowPlaying,   setNowPlaying]   = useState([])
  const [trending,     setTrending]     = useState([])
  const [popularTV,    setPopularTV]    = useState([])
  const [upcoming,     setUpcoming]     = useState([])
  const [airingToday,  setAiringToday]  = useState([])
  const [forYou,       setForYou]       = useState([])
  const [watchStates,    setWatchStates]    = useState(new Map())
  const [selectedGenre,  setSelectedGenre]  = useState(null)
  const [affinityGenreIds, setAffinityGenreIds] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)
  const [error,        setError]        = useState('')

  const lastLoadRef = useRef(0)

  const [genreData,    setGenreData]    = useState({ films: [], tv: [] })
  const [genreLoading, setGenreLoading] = useState(false)

  const [sheet,      setSheet]      = useState({ visible: false, item: null })
  const [rateModal,  setRateModal]  = useState({ visible: false, item: null, value: 3 })
  const [rateLoading,setRateLoading]= useState(false)

  const load = useCallback(async () => {
    setError('')
    if (DEMO_MODE) {
      setNowPlaying(DEMO_HOME.nowPlaying)
      setTrending(DEMO_HOME.trending)
      setPopularTV(DEMO_HOME.popularTV)
      setUpcoming(DEMO_HOME.upcoming)
      setAiringToday(DEMO_HOME.airingToday)
      setForYou(DEMO_HOME.forYou)
      lastLoadRef.current = Date.now()
      return
    }
    try {
      const [np, tr, tv, up, at] = await Promise.all([
        getNowPlaying(),
        getTrending('all', 'week'),
        getPopularTV(),
        getUpcoming(),
        getAiringToday(),
      ])
      const npIds = new Set(np.map(m => m.id))
      setNowPlaying(np)
      setTrending(tr)
      setPopularTV(tv)
      setUpcoming(up.filter(m => !npIds.has(m.id)))
      setAiringToday(at)
      lastLoadRef.current = Date.now()

      const allIds = [...new Set([...np, ...tr, ...tv, ...up, ...at].map(m => m.tmdb_id))]
      try {
        const states = await getWatchStatesForTmdbIds(allIds)
        setWatchStates(states)
      } catch (_) {}

      loadForYou().catch(() => {})
    } catch (err) {
      setError('Failed to load. Check your connection.')
    }
  }, [])

  async function loadForYou() {
    const [seeds, affinityGenres] = await Promise.all([
      getRecommendationSeeds(),
      getUserGenreAffinity().catch(() => []),
    ])
    if (!seeds.length) return

    const batches = await Promise.all(
      seeds.map(s => getRecommendations(s.tmdb_id, s.media_type))
    )

    const seen = new Map()
    for (let j = 0; j < batches.length; j++) {
      const seed   = seeds[j]
      const reason = seed.tier === 'watchlist'
        ? `On your watchlist: ${seed.title}`
        : `Because you liked ${seed.title}${seed.rating != null ? ` (${seed.rating.toFixed(1)}★)` : ''}`
      for (const item of batches[j]) {
        if (!item.poster_path) continue
        if ((item.vote_count ?? 0) < 20) continue
        if (!seen.has(item.tmdb_id)) {
          seen.set(item.tmdb_id, { item, seedScore: seed.score, reason })
        } else if (seed.score > seen.get(item.tmdb_id).seedScore) {
          seen.get(item.tmdb_id).seedScore = seed.score
          seen.get(item.tmdb_id).reason    = reason
        }
      }
    }

    let items = [...seen.values()]
      .map(({ item, seedScore, reason }) => ({
        ...item,
        _reason:     reason,
        _blendScore: seedScore * ((item.tmdb_rating ?? 5) / 10),
      }))
      .sort((a, b) => b._blendScore - a._blendScore)

    if (affinityGenres.length) {
      const genreFiltered = items.filter(item =>
        (item.genres ?? []).some(g => affinityGenres.includes(g))
      )
      if (genreFiltered.length >= 8) items = genreFiltered
    }

    setForYou(items.slice(0, 30))
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
    if (!DEMO_MODE) {
      getUserGenreAffinity().then(ids => setAffinityGenreIds(ids)).catch(() => {})
    }
  }, [load])

  const forYouRef     = useRef([])
  const nowPlayingRef = useRef([])
  const trendingRef   = useRef([])
  const popularTVRef  = useRef([])
  const upcomingRef   = useRef([])
  const airingRef     = useRef([])

  useEffect(() => { forYouRef.current    = forYou     }, [forYou])
  useEffect(() => { nowPlayingRef.current= nowPlaying  }, [nowPlaying])
  useEffect(() => { trendingRef.current  = trending    }, [trending])
  useEffect(() => { popularTVRef.current = popularTV   }, [popularTV])
  useEffect(() => { upcomingRef.current  = upcoming    }, [upcoming])
  useEffect(() => { airingRef.current    = airingToday }, [airingToday])

  useFocusEffect(
    useCallback(() => {
      reset()
      const FIVE_MIN = 5 * 60 * 1000
      if (Date.now() - lastLoadRef.current > FIVE_MIN) {
        load()
        return
      }
      const allItems = [
        ...forYouRef.current,
        ...nowPlayingRef.current,
        ...trendingRef.current,
        ...popularTVRef.current,
        ...upcomingRef.current,
        ...airingRef.current,
      ]
      const ids = [...new Set(allItems.map(i => i.tmdb_id))]
      if (!ids.length) return
      getWatchStatesForTmdbIds(ids)
        .then(states => setWatchStates(states))
        .catch(() => {})
    }, [load])
  )

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([load(), loadForYou().catch(() => {})])
    setRefreshing(false)
  }

  const openSheet = useCallback((item) => setSheet({ visible: true, item }), [])
  const openMovie = useCallback((item) => router.push(`/media/${item.tmdb_id}?type=${item.media_type}`), [router])

  async function handleWatchlist(item) {
    try {
      await addToWatchlist(item.tmdb_id, item.media_type)
      setWatchStates(prev => {
        const map = new Map(prev)
        const cur = prev.get(item.tmdb_id) ?? {}
        map.set(item.tmdb_id, { ...cur, inWatchlist: true })
        return map
      })
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }

  async function quickLog(item) {
    try {
      const entry = await createEntry({
        tmdb_id:     item.tmdb_id,
        media_type:  item.media_type,
        rating:      3,
        watched_on:  new Date().toISOString().split('T')[0],
        review:      '',
        rewatch:     false,
        emotion_ids: [],
      })
      setWatchStates(prev => {
        const map = new Map(prev)
        map.set(item.tmdb_id, { watched: true, liked: false, rated: true, inWatchlist: false })
        return map
      })
      Alert.alert(
        'Logged with 3★',
        `"${item.title}" added to your diary.`,
        [
          {
            text: 'Undo', style: 'destructive',
            onPress: async () => {
              try {
                await deleteEntry(entry.id)
                setWatchStates(prev => { const m = new Map(prev); m.delete(item.tmdb_id); return m })
              } catch (_) {}
            },
          },
          { text: 'OK', style: 'cancel' },
        ]
      )
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }

  async function handleQuickRate() {
    const { item, value } = rateModal
    if (!item) return
    setRateLoading(true)
    try {
      await createEntry({
        tmdb_id:     item.tmdb_id,
        media_type:  item.media_type,
        rating:      value,
        watched_on:  new Date().toISOString().split('T')[0],
        review:      '',
        rewatch:     false,
        emotion_ids: [],
      })
      setWatchStates(prev => {
        const map = new Map(prev)
        map.set(item.tmdb_id, { watched: true, liked: value >= 4, rated: true, inWatchlist: prev.get(item.tmdb_id)?.inWatchlist ?? false })
        return map
      })
      setRateModal({ visible: false, item: null, value: 3 })
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setRateLoading(false)
    }
  }

  const sheetItems = sheet.item ? [
    { icon: 'book-outline',           label: 'Add to Diary',          onPress: () => router.push(`/log?tmdb_id=${sheet.item.tmdb_id}&type=${sheet.item.media_type}`) },
    { icon: 'bookmark-outline',       label: 'Add to Watchlist',      onPress: () => handleWatchlist(sheet.item) },
    { icon: 'star-outline',           label: 'Quick Rate',            onPress: () => setRateModal({ visible: true, item: sheet.item, value: 3 }) },
    { icon: 'checkmark-circle-outline',label: 'Mark as Watched (3★)', onPress: () => quickLog(sheet.item) },
  ] : []

  const heroItems = useMemo(
    () => trending.filter(i => i.backdrop_url).slice(0, 6),
    [trending]
  )
  const [heroIndex, setHeroIndex] = useState(0)
  useEffect(() => { setHeroIndex(0) }, [heroItems])
  useEffect(() => {
    if (heroItems.length <= 1) return
    const id = setInterval(() => setHeroIndex(prev => (prev + 1) % heroItems.length), 4000)
    return () => clearInterval(id)
  }, [heroItems])

  useEffect(() => {
    if (!selectedGenre || DEMO_MODE) { setGenreData({ films: [], tv: [] }); return }
    const g = GENRES.find(x => x.label === selectedGenre)
    if (!g) return
    setGenreLoading(true)
    Promise.all([discoverByGenre(g.ids, 'movie'), discoverByGenre(g.ids, 'tv')])
      .then(([films, tv]) => setGenreData({ films, tv }))
      .catch(() => {})
      .finally(() => setGenreLoading(false))
  }, [selectedGenre])

  const heroItem    = heroItems[heroIndex] ?? nowPlaying[0] ?? null
  const forYouShown = filterByGenre(forYou.filter(i => !watchStates.get(i.tmdb_id)?.watched), selectedGenre)

  const sortedGenres = useMemo(() => {
    if (!affinityGenreIds.length) return GENRES
    return [...GENRES].sort((a, b) => {
      const aWatched = a.ids.some(id => affinityGenreIds.includes(id))
      const bWatched = b.ids.some(id => affinityGenreIds.includes(id))
      if (aWatched && !bWatched) return -1
      if (!aWatched && bWatched) return 1
      return 0
    })
  }, [affinityGenreIds])

  function seeAll(type) { router.push(`/section/${type}`) }

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <StatusBar barStyle={theme.statusBar ?? 'light-content'} backgroundColor={theme.bg0} />

      {/* Safe-area wrapper so stickyHeaderIndices stick below the Dynamic Island */}
      <View style={[s.flex, { paddingTop: insets.top }]}>
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
        alwaysBounceVertical
        stickyHeaderIndices={loading ? [] : [1]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.red} colors={[theme.red]} />}
      >
        {/* Child 0 — scrolls away */}
        <View>
          <View style={[s.header, { paddingTop: 8 }]}>
            <Text style={s.logo}>🎞️</Text>
            <View>
              <Text style={[s.appName, { color: theme.text }]}>ReelFeel</Text>
              <Text style={[s.subtitle, { color: theme.redL }]}>what are we watching? 👀</Text>
            </View>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
              <TouchableOpacity onPress={load} style={s.retryBtn}>
                <Text style={s.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {loading ? (
            <View style={s.loadingBlock}>
              <ActivityIndicator size="large" color={theme.red} />
              <Text style={[s.loadingText, { color: theme.textMut }]}>fetching the good stuff 🍿</Text>
            </View>
          ) : (
            <HeroCard
              item={heroItem}
              theme={theme}
              onPress={() => heroItem && openMovie(heroItem)}
              onLongPress={() => heroItem && openSheet(heroItem)}
              onSave={handleWatchlist}
              watchState={watchStates.get(heroItem?.tmdb_id)}
              dotIndex={heroIndex}
              dotTotal={heroItems.length}
            />
          )}
        </View>

        {/* Child 1 — sticky genre chips */}
        <View style={{ backgroundColor: theme.bg0 }}>
          <GenreChips genres={sortedGenres} selected={selectedGenre} onSelect={setSelectedGenre} theme={theme} />
        </View>

        {/* Child 2 — sections */}
        <View>
          {!loading && (
            <>
              {!selectedGenre && forYouShown.length > 0 && (
                <Section
                  title="For You"
                  emoji="🎯"
                  data={forYouShown}
                  onItemPress={openMovie}
                  onItemLongPress={openSheet}
                  watchStates={watchStates}
                  showReason
                />
              )}
              {!selectedGenre && forYou.length === 0 && (
                <EmptyForYou onPress={() => router.push('/(tabs)/search')} theme={theme} />
              )}

              {selectedGenre ? (
                genreLoading ? (
                  <View style={s.loadingBlock}>
                    <ActivityIndicator size="large" color={theme.red} />
                    <Text style={[s.loadingText, { color: theme.textMut }]}>loading {selectedGenre.toLowerCase()}…</Text>
                  </View>
                ) : (
                  <>
                    <Section
                      title={`${selectedGenre} Films`}
                      emoji="🎬"
                      data={genreData.films}
                      onItemPress={openMovie}
                      onItemLongPress={openSheet}
                      watchStates={watchStates}
                    />
                    <Section
                      title={`${selectedGenre} TV`}
                      emoji="📺"
                      data={genreData.tv}
                      onItemPress={openMovie}
                      onItemLongPress={openSheet}
                      watchStates={watchStates}
                    />
                  </>
                )
              ) : (
                <>
                  <Section
                    title="Now Playing"
                    emoji="🎟"
                    data={nowPlaying}
                    onItemPress={openMovie}
                    onItemLongPress={openSheet}
                    watchStates={watchStates}
                    onSeeAll={() => seeAll('nowPlaying')}
                  />
                  <Section
                    title="Coming Soon"
                    emoji="🗓"
                    data={upcoming}
                    onItemPress={openMovie}
                    onItemLongPress={openSheet}
                    watchStates={watchStates}
                    onSeeAll={() => seeAll('upcoming')}
                  />
                  <Section
                    title="Trending This Week"
                    emoji="🔥"
                    data={trending}
                    onItemPress={openMovie}
                    onItemLongPress={openSheet}
                    watchStates={watchStates}
                    onSeeAll={() => seeAll('trending')}
                  />
                  <Section
                    title="New Episodes Today"
                    emoji="📡"
                    data={airingToday}
                    onItemPress={openMovie}
                    onItemLongPress={openSheet}
                    watchStates={watchStates}
                    onSeeAll={() => seeAll('airingToday')}
                  />
                  <Section
                    title="Popular TV Shows"
                    emoji="📺"
                    data={popularTV}
                    onItemPress={openMovie}
                    onItemLongPress={openSheet}
                    watchStates={watchStates}
                    onSeeAll={() => seeAll('popularTV')}
                  />
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <ActionSheet
        visible={sheet.visible}
        onClose={() => setSheet({ visible: false, item: null })}
        title={sheet.item?.title}
        items={sheetItems}
      />

      <Modal visible={rateModal.visible} transparent animationType="fade">
        <View style={s.rateBackdrop}>
          <View style={[s.rateCard, { backgroundColor: theme.bg1, borderColor: theme.text, shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity }]}>
            <Text style={[s.rateTitle, { color: theme.text }]}>Rate "{rateModal.item?.title}"</Text>
            <StarPicker value={rateModal.value} onChange={v => setRateModal(prev => ({ ...prev, value: v }))} />
            <View style={s.rateBtns}>
              <TouchableOpacity onPress={() => setRateModal({ visible: false, item: null, value: 3 })} style={[s.rateCancelBtn, { borderColor: theme.text }]}>
                <Text style={[s.rateCancelText, { color: theme.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleQuickRate} disabled={rateLoading} style={[s.rateConfirmBtn, { backgroundColor: theme.red }]}>
                {rateLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.rateConfirmText}>Log Rating</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  flex:    { flex: 1 },
  content: { paddingBottom: 140, minHeight: Dimensions.get('window').height },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  logo:    { fontSize: 24 },
  appName: { fontSize: 28, fontWeight: '900' },
  subtitle:{ fontSize: 12, marginTop: 2 },

  // Hero
  heroCard:     { marginHorizontal: 16, marginBottom: 16, borderRadius: 10, overflow: 'hidden', height: 210 },
  heroImage:    { width: '100%', height: '100%' },
  heroBottom:   {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 14, paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroBadge:    { alignSelf: 'flex-start', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  heroDots:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 10 },
  heroDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  heroDotActive:{ width: 14, height: 5, borderRadius: 3, backgroundColor: '#fff' },
  heroBadgeText:{ fontSize: 10, fontWeight: '800', color: '#fff' },
  heroTitle:    { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 4 },
  heroMeta:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  heroRatingRow:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroRatingText:{ fontSize: 12, fontWeight: '700' },
  heroYear:     { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  heroActions:  { flexDirection: 'row', gap: 10 },
  heroViewBtn:  {
    flex: 1, paddingVertical: 8, borderRadius: 4, alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.5)',
  },
  heroViewBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  heroSaveBtn:  {
    flex: 1, paddingVertical: 8, borderRadius: 4, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  heroSaveBtnText: { color: '#000', fontSize: 13, fontWeight: '700' },

  // Genre chips
  chipsScroll: { flexGrow: 0 },
  chipsRow:  { paddingHorizontal: 16, paddingBottom: 16, gap: 8, alignItems: 'center' },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignSelf: 'flex-start' },
  chipText:  { fontSize: 12 },

  // Section
  section:      { marginBottom: 28 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  seeAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText:   { fontSize: 12, fontWeight: '600' },
  row:          { paddingHorizontal: 16 },
  seeAllCard:   {
    width: CARD_WIDTH, height: 175, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center', gap: 8, marginLeft: CARD_GAP,
  },
  seeAllCardText: { fontSize: 12, fontWeight: '700' },

  // Empty For You
  emptyCard:  {
    marginHorizontal: 16, marginBottom: 28, borderRadius: 6, borderWidth: StyleSheet.hairlineWidth,
    padding: 24, alignItems: 'center', gap: 8,
  },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyDesc:  { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  emptyBtn:   { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 },
  emptyBtnText:{ color: '#fff', fontSize: 13, fontWeight: '700' },

  loadingBlock:{ alignItems: 'center', paddingVertical: 80, gap: 16 },
  loadingText: { fontSize: 13 },
  errorBox:    { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#3f0000', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dc2626', borderRadius: 6, padding: 16, gap: 12 },
  errorText:   { color: '#fca5a5', fontSize: 13 },
  retryBtn:    { alignSelf: 'flex-start', borderWidth: StyleSheet.hairlineWidth, borderColor: '#fca5a5', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6 },
  retryText:   { color: '#fca5a5', fontSize: 12, fontWeight: '700' },

  rateBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  rateCard:     {
    width: '100%', borderRadius: 6, padding: 24, borderWidth: StyleSheet.hairlineWidth, gap: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
  },
  rateTitle:    { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  rateBtns:     { flexDirection: 'row', gap: 12 },
  rateCancelBtn:{ flex: 1, paddingVertical: 14, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  rateCancelText:{ fontSize: 15, fontWeight: '700' },
  rateConfirmBtn:{
    flex: 1, paddingVertical: 14, borderRadius: 4, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  rateConfirmText:{ color: '#fff', fontSize: 15, fontWeight: '800' },
})
