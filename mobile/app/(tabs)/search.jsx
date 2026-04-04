import { useRef, useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { searchTMDB } from '../../lib/tmdb'
import { C } from '../../constants/theme'

export default function Search() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const debounce = useRef(null)
  const router   = useRouter()

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
      setResults(await searchTMDB(q))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.flex}>
      <FlatList
        data={results}
        keyExtractor={r => String(r.tmdb_id)}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <Text style={s.title}>Search</Text>
            <TextInput
              style={s.input}
              placeholder="Search films and TV shows…"
              placeholderTextColor={C.textMut}
              value={query}
              onChangeText={handleInput}
              autoCorrect={false}
            />
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
            {loading ? <ActivityIndicator color={C.gold} style={{ marginTop: 20 }} /> : null}
            {!loading && query && results.length === 0 && !error
              ? <Text style={s.noResults}>No results for "{query}"</Text>
              : null
            }
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={s.resultCard}>
            {r.poster_path
              ? <Image source={{ uri: `https://image.tmdb.org/t/p/w200${r.poster_path}` }} style={s.poster} resizeMode="cover" />
              : <View style={[s.poster, s.posterFallback]}><Text style={{ fontSize: 24 }}>🎬</Text></View>
            }
            <View style={s.resultInfo}>
              <View>
                <Text style={s.resultTitle} numberOfLines={2}>{r.title}</Text>
                <View style={s.resultMeta}>
                  {r.year ? <Text style={s.metaYear}>{r.year}</Text> : null}
                  <View style={[s.typeBadge, { borderColor: r.media_type === 'film' ? C.red : C.gold }]}>
                    <Text style={[s.typeText, { color: r.media_type === 'film' ? C.redL : C.goldL }]}>
                      {r.media_type === 'film' ? 'Film' : 'TV Show'}
                    </Text>
                  </View>
                </View>
                {r.tmdb_rating ? <Text style={s.rating}>★ {r.tmdb_rating.toFixed(1)}</Text> : null}
                {r.overview ? <Text style={s.overview} numberOfLines={2}>{r.overview}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/log?tmdb_id=${r.tmdb_id}&type=${r.media_type}`)}
                style={s.logBtn}
              >
                <Text style={s.logBtnText}>+ Log this</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: C.bg0 },
  list:          { padding: 16, paddingBottom: 40 },
  headerBlock:   { marginBottom: 20 },
  title:         { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  input:         { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.text, fontSize: 14 },
  errorBox:      { backgroundColor: '#3f0000', borderWidth: 1, borderColor: C.red, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 12 },
  errorText:     { color: '#fca5a5', fontSize: 13 },
  noResults:     { color: C.textMut, textAlign: 'center', marginTop: 40 },
  resultCard:    { backgroundColor: C.bg1, borderRadius: 12, flexDirection: 'row', gap: 12, padding: 12, marginBottom: 12 },
  poster:        { width: 64, height: 96, borderRadius: 8 },
  posterFallback:{ backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },
  resultInfo:    { flex: 1, justifyContent: 'space-between' },
  resultTitle:   { color: C.text, fontWeight: '600', fontSize: 13, lineHeight: 18 },
  resultMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  metaYear:      { color: C.textMut, fontSize: 12 },
  typeBadge:     { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText:      { fontSize: 11 },
  rating:        { color: C.gold, fontSize: 11, marginTop: 2 },
  overview:      { color: C.textMut, fontSize: 11, marginTop: 4, lineHeight: 16 },
  logBtn:        { backgroundColor: C.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start' },
  logBtnText:    { color: C.text, fontSize: 12, fontWeight: '600' },
})
