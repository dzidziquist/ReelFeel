import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Dimensions, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getLibrary } from '../../lib/queries'
import PosterCard from '../../components/PosterCard'
import { useTheme } from '../../context/ThemeContext'

const NUM_COLS   = 3
const GAP        = 10
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - GAP * (NUM_COLS - 1)) / NUM_COLS

export default function Library() {
  const { theme }    = useTheme()
  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter,     setFilter]     = useState('')
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
        style={[
          s.filterBtn,
          { borderColor: active ? theme.red : theme.border },
          active && { backgroundColor: theme.red },
        ]}
      >
        <Text style={[s.filterText, { color: active ? '#fff' : theme.textSub, fontWeight: active ? '600' : '400' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    )
  }

  const paddedItems = [...(loading ? [] : items)]
  while (paddedItems.length % NUM_COLS !== 0) paddedItems.push(null)

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <FlatList
        data={paddedItems}
        keyExtractor={(item, i) => item ? String(item.id) : `pad-${i}`}
        numColumns={NUM_COLS}
        contentContainerStyle={s.list}
        columnWrapperStyle={s.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />
        }
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <Text style={[s.title, { color: theme.text }]}>Library</Text>
            <Text style={[s.subtitle, { color: theme.textMut }]}>
              {items.length} {items.length === 1 ? 'title' : 'titles'} watched
            </Text>
            <View style={s.filters}>
              <FilterBtn value=""     label="All" />
              <FilterBtn value="film" label="Films" />
              <FilterBtn value="tv"   label="TV Shows" />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading
            ? <View style={s.center}><ActivityIndicator color={theme.gold} /></View>
            : (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>📚</Text>
                <Text style={[s.emptyTitle, { color: theme.textSub }]}>Nothing logged yet.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text style={[s.emptyLink, { color: theme.gold }]}>Find something to watch</Text>
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
  flex:        { flex: 1 },
  center:      { alignItems: 'center', paddingVertical: 80 },
  list:        { padding: 16, paddingBottom: 48 },
  row:         { gap: GAP, marginBottom: GAP },
  headerBlock: { marginBottom: 16 },
  title:       { fontSize: 24, fontWeight: '800' },
  subtitle:    { fontSize: 13, marginTop: 4, marginBottom: 12 },
  filters:     { flexDirection: 'row', gap: 8 },
  filterBtn:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  filterText:  { fontSize: 13 },
  empty:       { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji:  { fontSize: 48, marginBottom: 16 },
  emptyTitle:  { fontSize: 17, marginBottom: 8 },
  emptyLink:   { },
})
