import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  ActivityIndicator, StatusBar, StyleSheet, Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getTrending, getNowPlaying, getPopularTV } from '../../lib/tmdb'
import PosterCard from '../../components/PosterCard'
import { C } from '../../constants/theme'

const CARD_WIDTH  = 120
const CARD_GAP    = 12
const SCREEN_W    = Dimensions.get('window').width

function Section({ title, emoji, data, onItemPress }) {
  if (!data?.length) return null
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{emoji} {title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {data.map(item => (
          <PosterCard
            key={`${item.tmdb_id}-${item.media_type}`}
            item={item}
            width={CARD_WIDTH}
            onPress={() => onItemPress(item)}
            style={{ marginRight: CARD_GAP }}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default function Home() {
  const router = useRouter()

  const [nowPlaying, setNowPlaying] = useState([])
  const [trending,   setTrending]   = useState([])
  const [popularTV,  setPopularTV]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [np, tr, tv] = await Promise.all([
        getNowPlaying(),
        getTrending('all', 'week'),
        getPopularTV(),
      ])
      setNowPlaying(np)
      setTrending(tr)
      setPopularTV(tv)
    } catch (err) {
      setError('Failed to load movies. Check your TMDB API key.')
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

  function openMovie(item) {
    router.push(`/media/${item.tmdb_id}?type=${item.media_type}`)
  }

  return (
    <View style={s.flex}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg0} />
      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.gold}
            colors={[C.gold]}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>🎬</Text>
          <View>
            <Text style={s.appName}>MovieRater</Text>
            <Text style={s.subtitle}>What's on the big screen</Text>
          </View>
        </View>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={s.loadingBlock}>
            <ActivityIndicator size="large" color={C.gold} />
            <Text style={s.loadingText}>Loading movies…</Text>
          </View>
        ) : (
          <>
            <Section
              title="Now Playing"
              emoji="🎟"
              data={nowPlaying}
              onItemPress={openMovie}
            />
            <Section
              title="Trending This Week"
              emoji="🔥"
              data={trending}
              onItemPress={openMovie}
            />
            <Section
              title="Popular TV Shows"
              emoji="📺"
              data={popularTV}
              onItemPress={openMovie}
            />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: C.bg0 },
  content:     { paddingBottom: 48 },
  header:      {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20,
  },
  logo:        { fontSize: 36 },
  appName:     { color: C.text, fontSize: 22, fontWeight: '800' },
  subtitle:    { color: C.textMut, fontSize: 12, marginTop: 2 },
  section:     { marginBottom: 28 },
  sectionTitle:{ color: C.text, fontSize: 17, fontWeight: '700', marginBottom: 12, paddingHorizontal: 16 },
  row:         { paddingHorizontal: 16 },
  loadingBlock:{ alignItems: 'center', paddingVertical: 80, gap: 16 },
  loadingText: { color: C.textMut, fontSize: 13 },
  errorBox:    {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#3f0000', borderWidth: 1, borderColor: C.red,
    borderRadius: 12, padding: 16,
  },
  errorText:   { color: '#fca5a5', fontSize: 13 },
})
