import { useCallback, useEffect, useState } from 'react'
import {
  View, FlatList, ActivityIndicator, StyleSheet, Dimensions, Text, TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getTrending, getNowPlaying, getPopularTV, getUpcoming, getAiringToday } from '../../lib/tmdb'
import { addToWatchlist, createEntry, getWatchStatesForTmdbIds } from '../../lib/queries'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import PosterCard from '../../components/PosterCard'
import ActionSheet from '../../components/ActionSheet'

const NUM_COLS   = 3
const H_PAD      = 16
const GAP        = 10
const CARD_WIDTH = Math.floor((Dimensions.get('window').width - H_PAD * 2 - GAP * (NUM_COLS - 1)) / NUM_COLS)

const CONFIG = {
  trending:    { label: 'Trending This Week', emoji: '🔥', fetch: () => getTrending('all', 'week') },
  nowPlaying:  { label: 'Now Playing',        emoji: '🎟', fetch: getNowPlaying },
  popularTV:   { label: 'Popular TV Shows',   emoji: '📺', fetch: getPopularTV },
  upcoming:    { label: 'Coming Soon',        emoji: '🗓', fetch: getUpcoming },
  airingToday: { label: 'New Episodes Today', emoji: '📡', fetch: getAiringToday },
}

export default function SectionAll() {
  const { type }  = useLocalSearchParams()
  const router    = useRouter()
  const { theme } = useTheme()
  const insets    = useSafeAreaInsets()
  const config    = CONFIG[type] ?? CONFIG.trending

  const [data,       setData]       = useState([])
  const [watchStates,setWatchStates]= useState(new Map())
  const [loading,    setLoading]    = useState(true)
  const [sheet,      setSheet]      = useState({ visible: false, item: null })

  useEffect(() => {
    setLoading(true)
    config.fetch()
      .then(items => {
        setData(items)
        return getWatchStatesForTmdbIds(items.map(i => i.tmdb_id)).catch(() => new Map())
      })
      .then(states => setWatchStates(states))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [type])

  const sheetItems = sheet.item ? [
    {
      icon: 'book-outline', label: 'Add to Diary',
      onPress: () => router.push(`/log?tmdb_id=${sheet.item.tmdb_id}&type=${sheet.item.media_type}`),
    },
    {
      icon: 'bookmark-outline', label: 'Add to Watchlist',
      onPress: async () => {
        try {
          await addToWatchlist(sheet.item.tmdb_id, sheet.item.media_type)
          setWatchStates(prev => {
            const m = new Map(prev)
            m.set(sheet.item.tmdb_id, { ...(prev.get(sheet.item.tmdb_id) ?? {}), inWatchlist: true })
            return m
          })
        } catch (_) {}
        setSheet({ visible: false, item: null })
      },
    },
    {
      icon: 'checkmark-circle-outline', label: 'Mark as Watched (3★)',
      onPress: async () => {
        try {
          await createEntry({
            tmdb_id: sheet.item.tmdb_id, media_type: sheet.item.media_type,
            rating: 3, watched_on: new Date().toISOString().split('T')[0],
            review: '', rewatch: false, emotion_ids: [],
          })
          setWatchStates(prev => {
            const m = new Map(prev)
            m.set(sheet.item.tmdb_id, { watched: true, liked: false, rated: true, inWatchlist: false })
            return m
          })
        } catch (_) {}
        setSheet({ visible: false, item: null })
      },
    },
  ] : []

  const renderItem = useCallback(({ item }) => (
    <PosterCard
      item={item}
      width={CARD_WIDTH}
      watchState={watchStates.get(item.tmdb_id)}
      comingSoon={item.comingSoon}
      onPress={() => router.push(`/media/${item.tmdb_id}?type=${item.media_type}`)}
      onLongPress={() => setSheet({ visible: true, item })}
    />
  ), [watchStates])

  const listHeader = (
    <View style={{ paddingTop: insets.top + 60, paddingHorizontal: H_PAD, paddingBottom: 12 }}>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '800' }}>
        {config.emoji}{'  '}{config.label}
      </Text>
    </View>
  )

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating back pill */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[s.backPill, { top: insets.top + 8, backgroundColor: theme.bg1, borderColor: theme.text }]}
        activeOpacity={0.85}
      >
        <Ionicons name="chevron-back" size={18} color={theme.text} />
      </TouchableOpacity>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.red} />
        </View>
      ) : data.length === 0 ? (
        <View style={s.center}>
          <Text style={[s.empty, { color: theme.textMut }]}>Nothing to show right now</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => `${item.tmdb_id}-${item.media_type}`}
          numColumns={NUM_COLS}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.colWrap}
          ListHeaderComponent={listHeader}
          renderItem={renderItem}
        />
      )}

      <ActionSheet
        visible={sheet.visible}
        onClose={() => setSheet({ visible: false, item: null })}
        title={sheet.item?.title}
        items={sheetItems}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:   { fontSize: 14 },
  grid:    { paddingHorizontal: H_PAD, paddingBottom: 40 },
  colWrap: { gap: GAP, marginBottom: GAP + 4 },
  backPill: {
    position: 'absolute', left: 16, zIndex: 100,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8,
  },
})
