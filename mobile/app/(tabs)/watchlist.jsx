import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, Dimensions, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getWatchlist, removeFromWatchlist } from '../../lib/queries'
import PosterCard from '../../components/PosterCard'
import { C } from '../../constants/theme'

const NUM_COLS   = 3
const GAP        = 10
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - GAP * (NUM_COLS - 1)) / NUM_COLS

export default function Watchlist() {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [error,     setError]     = useState('')
  const router = useRouter()

  const load = useCallback(async () => {
    setError('')
    try {
      setItems(await getWatchlist())
    } catch (err) {
      setError(err.message)
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

  function confirmRemove(item) {
    Alert.alert(
      'Remove from Watchlist?',
      `"${item.media.title}" will be removed from your watchlist.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            await removeFromWatchlist(item.media.id)
            setItems(prev => prev.filter(i => i.id !== item.id))
          },
        },
      ],
    )
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={C.gold} /></View>
  }

  // Pad data so the grid is filled evenly
  const paddedItems = [...items]
  while (paddedItems.length % NUM_COLS !== 0) paddedItems.push(null)

  return (
    <View style={s.flex}>
      <FlatList
        data={paddedItems}
        keyExtractor={(item, i) => item ? String(item.id) : `pad-${i}`}
        numColumns={NUM_COLS}
        contentContainerStyle={s.list}
        columnWrapperStyle={s.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.gold} colors={[C.gold]} />
        }
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <Text style={s.title}>Watchlist</Text>
            <Text style={s.subtitle}>{items.length} {items.length === 1 ? 'title' : 'titles'} saved</Text>
            {error ? (
              <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🔖</Text>
              <Text style={s.emptyTitle}>Nothing saved yet.</Text>
              <Text style={s.emptyBody}>
                Find a movie or show and tap "Save to Watchlist".
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={s.searchBtn}>
                <Text style={s.searchBtnText}>Browse Movies</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (!item) return <View style={{ width: ITEM_WIDTH }} />
          return (
            <TouchableOpacity
              style={{ width: ITEM_WIDTH }}
              onLongPress={() => confirmRemove(item)}
              activeOpacity={0.8}
            >
              <PosterCard
                item={item.media}
                width={ITEM_WIDTH}
                onPress={() => router.push(`/media/${item.media.tmdb_id}?type=${item.media.media_type}`)}
              />
              {/* Quick action row */}
              <View style={s.cardActions}>
                <TouchableOpacity
                  onPress={() => router.push(`/log?tmdb_id=${item.media.tmdb_id}&type=${item.media.media_type}`)}
                  style={s.logBtn}
                >
                  <Text style={s.logBtnText}>+ Log</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRemove(item)} style={s.removeBtn}>
                  <Text style={s.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:         { flex: 1, backgroundColor: C.bg0 },
  center:       { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center' },
  list:         { padding: 16, paddingBottom: 48 },
  row:          { gap: GAP, marginBottom: GAP },
  headerBlock:  { marginBottom: 16 },
  title:        { color: C.text, fontSize: 24, fontWeight: '800' },
  subtitle:     { color: C.textMut, fontSize: 13, marginTop: 4, marginBottom: 12 },
  errorBox:     { backgroundColor: '#3f0000', borderWidth: 1, borderColor: C.red, borderRadius: 12, padding: 14 },
  errorText:    { color: '#fca5a5', fontSize: 13 },
  empty:        { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyEmoji:   { fontSize: 48, marginBottom: 16 },
  emptyTitle:   { color: C.textSub, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody:    { color: C.textMut, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  searchBtn:    { backgroundColor: C.red, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  searchBtnText:{ color: C.text, fontWeight: '700' },
  cardActions:  { flexDirection: 'row', gap: 4, marginTop: 6 },
  logBtn:       { flex: 1, backgroundColor: C.red, borderRadius: 6, paddingVertical: 5, alignItems: 'center' },
  logBtnText:   { color: C.text, fontSize: 10, fontWeight: '700' },
  removeBtn:    { backgroundColor: C.bg2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  removeBtnText:{ color: C.textMut, fontSize: 10 },
})
