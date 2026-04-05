import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Dimensions, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getLibrary } from '../../lib/queries'
import PosterCard from '../../components/PosterCard'
import { C } from '../../constants/theme'

const NUM_COLS   = 3
const GAP        = 10
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - GAP * (NUM_COLS - 1)) / NUM_COLS

export default function Library() {
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [filter,    setFilter]    = useState('')
  const router = useRouter()

  const load = useCallback(async (type) => {
    try {
      setItems(await getLibrary(type || undefined))
    } catch (_) {}
  }, [])

  useEffect(() => {
    setLoading(true)
    load(filter).finally(() => setLoading(false))
  }, [filter, load])

  async function handleRefresh() {
    setRefreshing(true)
    await load(filter)
    setRefreshing(false)
  }

  function FilterBtn({ value, label }) {
    const active = filter === value
    return (
      <TouchableOpacity
        onPress={() => setFilter(value)}
        style={[s.filterBtn, active && s.filterBtnActive]}
      >
        <Text style={[s.filterText, active && s.filterTextActive]}>{label}</Text>
      </TouchableOpacity>
    )
  }

  // Pad data for even grid columns
  const paddedItems = [...(loading ? [] : items)]
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
            <Text style={s.title}>Library</Text>
            <Text style={s.subtitle}>{items.length} {items.length === 1 ? 'title' : 'titles'} watched</Text>
            <View style={s.filters}>
              <FilterBtn value=""     label="All" />
              <FilterBtn value="film" label="Films" />
              <FilterBtn value="tv"   label="TV Shows" />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading
            ? <View style={s.center}><ActivityIndicator color={C.gold} /></View>
            : (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>📚</Text>
                <Text style={s.emptyTitle}>Nothing logged yet.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text style={s.emptyLink}>Find something to watch</Text>
                </TouchableOpacity>
              </View>
            )
        }
        renderItem={({ item }) => {
          if (!item) return <View style={{ width: ITEM_WIDTH }} />
          return (
            <PosterCard
              item={item}
              width={ITEM_WIDTH}
              onPress={() => router.push(`/media/${item.tmdb_id}?type=${item.media_type}`)}
            />
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: C.bg0 },
  center:          { alignItems: 'center', paddingVertical: 80 },
  list:            { padding: 16, paddingBottom: 48 },
  row:             { gap: GAP, marginBottom: GAP },
  headerBlock:     { marginBottom: 16 },
  title:           { color: C.text, fontSize: 24, fontWeight: '800' },
  subtitle:        { color: C.textMut, fontSize: 13, marginTop: 4, marginBottom: 12 },
  filters:         { flexDirection: 'row', gap: 8 },
  filterBtn:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.red, borderColor: C.red },
  filterText:      { color: C.textSub, fontSize: 13 },
  filterTextActive:{ color: C.text, fontWeight: '600' },
  empty:           { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:      { color: C.textSub, fontSize: 17, marginBottom: 8 },
  emptyLink:       { color: C.gold },
})
