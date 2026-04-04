import { useRef, useState } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../api/client'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounce = useRef(null)
  const router = useRouter()

  function handleInput(val) {
    setQuery(val)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      if (val.trim()) doSearch(val.trim())
      else setResults([])
    }, 400)
  }

  async function doSearch(q) {
    setLoading(true)
    setError('')
    try {
      const data = await api.search(q)
      setResults(data.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-gray-950">
      <FlatList
        data={results}
        keyExtractor={r => String(r.tmdb_id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-white text-2xl font-bold mb-4">Search</Text>
            <TextInput
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
              placeholder="Search films and TV shows…"
              placeholderTextColor="#6b7280"
              value={query}
              onChangeText={handleInput}
              autoCorrect={false}
            />
            {error ? (
              <View className="bg-red-900/40 border border-red-700 rounded-xl px-4 py-3 mt-3">
                <Text className="text-red-300 text-sm">{error}</Text>
              </View>
            ) : null}
            {loading ? <ActivityIndicator color="#f97316" style={{ marginTop: 20 }} /> : null}
            {!loading && query && results.length === 0 && !error ? (
              <Text className="text-gray-500 text-center mt-10">No results for "{query}"</Text>
            ) : null}
          </View>
        }
        renderItem={({ item: r }) => (
          <View className="bg-gray-900 rounded-xl flex-row gap-3 p-3 mb-3">
            {r.poster_path
              ? <Image source={{ uri: `https://image.tmdb.org/t/p/w200${r.poster_path}` }} style={{ width: 64, height: 96, borderRadius: 8 }} resizeMode="cover" />
              : (
                <View className="bg-gray-700 rounded-lg items-center justify-center" style={{ width: 64, height: 96 }}>
                  <Text className="text-2xl">🎬</Text>
                </View>
              )
            }
            <View className="flex-1 justify-between">
              <View>
                <Text className="text-white font-semibold text-sm leading-tight">{r.title}</Text>
                <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                  {r.year ? <Text className="text-gray-500 text-xs">{r.year}</Text> : null}
                  <View
                    className="rounded border px-1.5 py-0.5"
                    style={{ borderColor: r.media_type === 'film' ? '#1d4ed8' : '#7e22ce' }}
                  >
                    <Text className="text-xs" style={{ color: r.media_type === 'film' ? '#60a5fa' : '#c084fc' }}>
                      {r.media_type === 'film' ? 'Film' : 'TV Show'}
                    </Text>
                  </View>
                </View>
                {r.tmdb_rating ? <Text className="text-yellow-400 text-xs mt-0.5">★ {r.tmdb_rating.toFixed(1)}</Text> : null}
                {r.overview ? (
                  <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>{r.overview}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/log?tmdb_id=${r.tmdb_id}&type=${r.media_type}`)}
                className="bg-orange-600 rounded-lg px-3 py-1.5 mt-2 items-center"
              >
                <Text className="text-white text-xs font-semibold">+ Log this</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  )
}
