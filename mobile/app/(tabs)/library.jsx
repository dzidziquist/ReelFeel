import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../api/client'

const NUM_COLS = 4
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - (NUM_COLS - 1) * 8) / NUM_COLS

export default function Library() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    api.getLibrary(filter)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [filter])

  function FilterBtn({ value, label, activeColor }) {
    const active = filter === value
    return (
      <TouchableOpacity
        onPress={() => setFilter(value)}
        className={`px-3 py-1.5 rounded-lg border`}
        style={{
          backgroundColor: active ? activeColor : 'transparent',
          borderColor: active ? activeColor : '#374151',
        }}
      >
        <Text className="text-sm" style={{ color: active ? '#fff' : '#9ca3af' }}>{label}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-1 bg-gray-950">
      <FlatList
        data={loading ? [] : items}
        keyExtractor={item => String(item.id)}
        numColumns={NUM_COLS}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-white text-2xl font-bold mb-3">Library</Text>
            <View className="flex-row gap-2">
              <FilterBtn value="" label="All" activeColor="#0d9488" />
              <FilterBtn value="film" label="Films" activeColor="#1d4ed8" />
              <FilterBtn value="tv" label="TV Shows" activeColor="#7e22ce" />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading
            ? <View className="items-center py-20"><ActivityIndicator color="#f97316" /></View>
            : (
              <View className="items-center py-20">
                <Text className="text-5xl mb-4">📚</Text>
                <Text className="text-gray-400 text-lg mb-2">Nothing here yet.</Text>
                <TouchableOpacity onPress={() => router.push('/search')}>
                  <Text className="text-orange-400">Find something to watch</Text>
                </TouchableOpacity>
              </View>
            )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/media/${item.tmdb_id}`)}
            style={{ width: ITEM_WIDTH }}
          >
            <View
              className="rounded-lg overflow-hidden bg-gray-800"
              style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5 }}
            >
              {item.poster_url
                ? <Image source={{ uri: item.poster_url }} style={{ width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5 }} resizeMode="cover" />
                : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-3xl">🎬</Text>
                  </View>
                )
              }
              <View
                className="absolute top-1 left-1 rounded px-1"
                style={{ backgroundColor: item.media_type === 'film' ? 'rgba(30,58,138,0.85)' : 'rgba(88,28,135,0.85)' }}
              >
                <Text className="text-xs font-semibold" style={{ color: item.media_type === 'film' ? '#93c5fd' : '#d8b4fe' }}>
                  {item.media_type === 'film' ? 'F' : 'TV'}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-gray-300 mt-1" numberOfLines={1}>{item.title}</Text>
            {item.year ? <Text className="text-xs text-gray-600">{item.year}</Text> : null}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
