import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  Modal, ActivityIndicator, StatusBar, StyleSheet, Dimensions,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getTrending, getNowPlaying, getPopularTV } from '../../lib/tmdb'
import { addToWatchlist, createEntry, getWatchStatesForTmdbIds } from '../../lib/queries'
import { StarPicker } from '../../components/StarRating'
import PosterCard from '../../components/PosterCard'
import ActionSheet from '../../components/ActionSheet'
import { useTheme } from '../../context/ThemeContext'

const CARD_WIDTH = 120
const CARD_GAP   = 12

function Section({ title, emoji, data, onItemPress, onItemLongPress, watchStates }) {
  if (!data?.length) return null
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{emoji}  {title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {data.map(item => (
          <PosterCard
            key={`${item.tmdb_id}-${item.media_type}`}
            item={item}
            width={CARD_WIDTH}
            onPress={() => onItemPress(item)}
            onLongPress={() => onItemLongPress(item)}
            watchState={watchStates?.get(item.tmdb_id)}
            style={{ marginRight: CARD_GAP }}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default function Home() {
  const { theme, isDark } = useTheme()
  const router = useRouter()

  const [nowPlaying, setNowPlaying] = useState([])
  const [trending,   setTrending]   = useState([])
  const [popularTV,  setPopularTV]  = useState([])
  const [watchStates,setWatchStates]= useState(new Map())
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,      setError]      = useState('')

  // Action sheet state
  const [sheet,      setSheet]      = useState({ visible: false, item: null })
  // Quick rate modal
  const [rateModal,  setRateModal]  = useState({ visible: false, item: null, value: 3 })
  const [rateLoading,setRateLoading]= useState(false)

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

      // Batch fetch watch states
      const allIds = [...new Set([...np, ...tr, ...tv].map(m => m.tmdb_id))]
      try {
        const states = await getWatchStatesForTmdbIds(allIds)
        setWatchStates(states)
      } catch (_) {}
    } catch (err) {
      setError('Failed to load. Check your TMDB API key.')
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

  function openSheet(item) {
    setSheet({ visible: true, item })
  }

  function openMovie(item) {
    router.push(`/media/${item.tmdb_id}?type=${item.media_type}`)
  }

  async function quickLog(item) {
    try {
      await createEntry({
        tmdb_id:    item.tmdb_id,
        media_type: item.media_type,
        rating:     3,
        watched_on: new Date().toISOString().split('T')[0],
        review:     '',
        rewatch:    false,
        emotion_ids: [],
      })
      // Update watch state badge
      setWatchStates(prev => {
        const map = new Map(prev)
        map.set(item.tmdb_id, { watched: true, liked: false, rated: true, inWatchlist: prev.get(item.tmdb_id)?.inWatchlist ?? false })
        return map
      })
      Alert.alert('Marked watched', `"${item.title}" logged with 3★`)
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }

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

  async function handleQuickRate() {
    const { item, value } = rateModal
    if (!item) return
    setRateLoading(true)
    try {
      await createEntry({
        tmdb_id:    item.tmdb_id,
        media_type: item.media_type,
        rating:     value,
        watched_on: new Date().toISOString().split('T')[0],
        review:     '',
        rewatch:    false,
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
    {
      icon:    'book-outline',
      label:   'Add to Diary',
      onPress: () => router.push(`/log?tmdb_id=${sheet.item.tmdb_id}&type=${sheet.item.media_type}`),
    },
    {
      icon:    'bookmark-outline',
      label:   'Add to Watchlist',
      onPress: () => handleWatchlist(sheet.item),
    },
    {
      icon:    'star-outline',
      label:   'Quick Rate',
      onPress: () => setRateModal({ visible: true, item: sheet.item, value: 3 }),
    },
    {
      icon:    'checkmark-circle-outline',
      label:   'Mark as Watched (3★)',
      onPress: () => quickLog(sheet.item),
    },
  ] : []

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <StatusBar barStyle={theme.statusBar ?? 'light-content'} backgroundColor={theme.bg0} />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>🎬</Text>
          <View>
            <Text style={[s.appName, { color: theme.text }]}>MovieRater</Text>
            <Text style={[s.subtitle, { color: theme.textMut }]}>What's on the big screen</Text>
          </View>
        </View>

        {error ? (
          <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
        ) : null}

        {loading ? (
          <View style={s.loadingBlock}>
            <ActivityIndicator size="large" color={theme.gold} />
            <Text style={[s.loadingText, { color: theme.textMut }]}>Loading movies…</Text>
          </View>
        ) : (
          <>
            <Section title="Now Playing" emoji="🎟" data={nowPlaying} onItemPress={openMovie} onItemLongPress={openSheet} watchStates={watchStates} />
            <Section title="Trending This Week" emoji="🔥" data={trending} onItemPress={openMovie} onItemLongPress={openSheet} watchStates={watchStates} />
            <Section title="Popular TV Shows" emoji="📺" data={popularTV} onItemPress={openMovie} onItemLongPress={openSheet} watchStates={watchStates} />
          </>
        )}
      </ScrollView>

      {/* Long-press action sheet */}
      <ActionSheet
        visible={sheet.visible}
        onClose={() => setSheet({ visible: false, item: null })}
        title={sheet.item?.title}
        items={sheetItems}
      />

      {/* Quick rate modal */}
      <Modal visible={rateModal.visible} transparent animationType="fade">
        <View style={s.rateBackdrop}>
          <View style={[s.rateCard, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[s.rateTitle, { color: theme.text }]}>Rate "{rateModal.item?.title}"</Text>
            <StarPicker
              value={rateModal.value}
              onChange={v => setRateModal(prev => ({ ...prev, value: v }))}
            />
            <View style={s.rateBtns}>
              <TouchableOpacity onPress={() => setRateModal({ visible: false, item: null, value: 3 })} style={[s.rateCancelBtn, { borderColor: theme.border }]}>
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
  )
}

const s = StyleSheet.create({
  flex:         { flex: 1 },
  content:      { paddingBottom: 48 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  logo:         { fontSize: 36 },
  appName:      { fontSize: 22, fontWeight: '800' },
  subtitle:     { fontSize: 12, marginTop: 2 },
  section:      { marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, paddingHorizontal: 16, color: '#fff' },
  row:          { paddingHorizontal: 16 },
  loadingBlock: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  loadingText:  { fontSize: 13 },
  errorBox:     { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#3f0000', borderWidth: 1, borderColor: '#dc2626', borderRadius: 12, padding: 16 },
  errorText:    { color: '#fca5a5', fontSize: 13 },
  // Quick rate modal
  rateBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  rateCard:     { width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, gap: 20 },
  rateTitle:    { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  rateBtns:     { flexDirection: 'row', gap: 12 },
  rateCancelBtn:{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  rateCancelText:{ fontSize: 15, fontWeight: '600' },
  rateConfirmBtn:{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  rateConfirmText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
})
