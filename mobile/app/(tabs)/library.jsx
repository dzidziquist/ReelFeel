import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Dimensions, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { getLibrary } from '../../lib/queries'
import { C } from '../../constants/theme'

const NUM_COLS   = 4
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - (NUM_COLS - 1) * 8) / NUM_COLS

export default function Library() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    getLibrary(filter).then(setItems).finally(() => setLoading(false))
  }, [filter])

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

  return (
    <View style={s.flex}>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={item => String(item.id)}
        numColumns={NUM_COLS}
        contentContainerStyle={s.list}
        columnWrapperStyle={s.row}
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <Text style={s.title}>Library</Text>
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
                <Text style={s.emptyTitle}>Nothing here yet.</Text>
                <TouchableOpacity onPress={() => router.push('/search')}>
                  <Text style={s.emptyLink}>Find something to watch</Text>
                </TouchableOpacity>
              </View>
            )
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/media/${item.tmdb_id}`)} style={{ width: ITEM_WIDTH }}>
            <View style={[s.poster, { height: ITEM_WIDTH * 1.5 }]}>
              {item.poster_url
                ? <Image source={{ uri: item.poster_url }} style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5 }} resizeMode="cover" />
                : <View style={s.posterFallback}><Text style={{ fontSize: 28 }}>🎬</Text></View>
              }
              <View style={[s.badge, { backgroundColor: item.media_type === 'film' ? 'rgba(180,20,20,0.85)' : 'rgba(120,90,0,0.85)' }]}>
                <Text style={s.badgeText}>{item.media_type === 'film' ? 'F' : 'TV'}</Text>
              </View>
            </View>
            <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
            {item.year ? <Text style={s.itemYear}>{item.year}</Text> : null}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:            { flex: 1, backgroundColor: C.bg0 },
  center:          { alignItems: 'center', paddingVertical: 80 },
  list:            { padding: 16, paddingBottom: 40 },
  row:             { gap: 8, marginBottom: 8 },
  headerBlock:     { marginBottom: 20 },
  title:           { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  filters:         { flexDirection: 'row', gap: 8 },
  filterBtn:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.red, borderColor: C.red },
  filterText:      { color: C.textSub, fontSize: 13 },
  filterTextActive:{ color: C.text },
  empty:           { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:      { color: C.textSub, fontSize: 17, marginBottom: 8 },
  emptyLink:       { color: C.gold },
  poster:          { borderRadius: 8, overflow: 'hidden', backgroundColor: C.bg2 },
  posterFallback:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge:           { position: 'absolute', top: 4, left: 4, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
  badgeText:       { fontSize: 10, fontWeight: '700', color: C.text },
  itemTitle:       { color: C.textSub, fontSize: 11, marginTop: 4 },
  itemYear:        { color: C.textMut, fontSize: 11 },
})
