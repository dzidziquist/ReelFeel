import { useRef, useState } from 'react'
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { searchTMDB } from '../../lib/tmdb'
import { addToWatchlist } from '../../lib/queries'
import { useTheme } from '../../context/ThemeContext'

export default function Search() {
  const { theme }  = useTheme()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState({})
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

  async function handleWatchlist(r) {
    setSaving(prev => ({ ...prev, [r.tmdb_id]: true }))
    try {
      await addToWatchlist(r.tmdb_id, r.media_type)
    } catch (_) {}
    finally {
      setSaving(prev => ({ ...prev, [r.tmdb_id]: false }))
    }
  }

  const isFilm = r => r.media_type === 'film' || r.media_type === 'movie'

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <FlatList
        data={results}
        keyExtractor={r => String(r.tmdb_id)}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <Text style={[s.title, { color: theme.text }]}>Search</Text>
            <TextInput
              style={[s.input, { backgroundColor: theme.bg2, borderColor: theme.text, color: theme.text }]}
              placeholder="Search films and TV shows…"
              placeholderTextColor={theme.textMut}
              value={query}
              onChangeText={handleInput}
              autoCorrect={false}
            />
            {error ? (
              <View style={[s.errorBox, { borderColor: theme.red }]}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}
            {loading ? <ActivityIndicator color={theme.gold} style={{ marginTop: 20 }} /> : null}
            {!loading && query && results.length === 0 && !error ? (
              <Text style={[s.noResults, { color: theme.textMut }]}>No results for "{query}"</Text>
            ) : null}
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={[s.resultCard, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
            <TouchableOpacity onPress={() => router.push(`/media/${r.tmdb_id}?type=${r.media_type}`)}>
              {r.poster_path
                ? <Image source={{ uri: `https://image.tmdb.org/t/p/w200${r.poster_path}` }} style={s.poster} resizeMode="cover" />
                : <View style={[s.poster, { backgroundColor: theme.bg2, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>🎬</Text>
                  </View>
              }
              {r.tmdb_rating != null && (
                <View style={s.ratingBadge}>
                  <Ionicons name="star" size={9} color={theme.gold} />
                  <Text style={[s.ratingBadgeText, { color: theme.gold }]}>{Number(r.tmdb_rating).toFixed(1)}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={s.resultInfo}>
              <View>
                <TouchableOpacity onPress={() => router.push(`/media/${r.tmdb_id}?type=${r.media_type}`)}>
                  <Text style={[s.resultTitle, { color: theme.text }]} numberOfLines={2}>{r.title}</Text>
                </TouchableOpacity>
                <View style={s.resultMeta}>
                  {r.year ? <Text style={[s.metaYear, { color: theme.textMut }]}>{r.year}</Text> : null}
                  <View style={[s.typeBadge, { borderColor: isFilm(r) ? theme.red : theme.gold }]}>
                    <Text style={[s.typeText, { color: isFilm(r) ? theme.redL : theme.goldL }]}>
                      {isFilm(r) ? 'Film' : 'TV Show'}
                    </Text>
                  </View>
                </View>
                {r.overview ? <Text style={[s.overview, { color: theme.textMut }]} numberOfLines={2}>{r.overview}</Text> : null}
              </View>

              <View style={s.actionRow}>
                <TouchableOpacity
                  onPress={() => router.push(`/log?tmdb_id=${r.tmdb_id}&type=${r.media_type}`)}
                  style={[s.logBtn, { backgroundColor: theme.red }]}
                >
                  <Text style={s.logBtnText}>+ Log</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleWatchlist(r)}
                  disabled={saving[r.tmdb_id]}
                  style={[s.watchlistBtn, { backgroundColor: theme.bg2, borderColor: theme.text }]}
                >
                  {saving[r.tmdb_id]
                    ? <ActivityIndicator size="small" color={theme.gold} />
                    : <Text style={[s.watchlistBtnText, { color: theme.gold }]}>🔖 Save</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:             { flex: 1 },
  list:             { padding: 16, paddingBottom: 40 },
  headerBlock:      { marginBottom: 20 },
  title:            { fontSize: 22, fontWeight: '900', marginBottom: 16 },
  input:            {
    borderWidth: 2, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14,
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.7, shadowRadius: 0, elevation: 3,
  },
  errorBox:         { backgroundColor: '#3f0000', borderWidth: 2, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12, marginTop: 12 },
  errorText:        { color: '#fca5a5', fontSize: 13 },
  noResults:        { textAlign: 'center', marginTop: 40 },
  resultCard:       {
    borderRadius: 6, flexDirection: 'row', gap: 12, padding: 12, marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 3,
  },
  poster:           { width: 64, height: 96, borderRadius: 4 },
  ratingBadge:      { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingBadgeText:  { fontSize: 9, fontWeight: '700' },
  resultInfo:       { flex: 1, justifyContent: 'space-between' },
  resultTitle:      { fontWeight: '600', fontSize: 13, lineHeight: 18 },
  resultMeta:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  metaYear:         { fontSize: 12 },
  typeBadge:        { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText:         { fontSize: 11 },
  overview:         { fontSize: 11, marginTop: 4, lineHeight: 16 },
  actionRow:        { flexDirection: 'row', gap: 8, marginTop: 8 },
  logBtn:           {
    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, flex: 1, alignItems: 'center',
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 2,
  },
  logBtnText:       { color: '#fff', fontSize: 12, fontWeight: '700' },
  watchlistBtn:     { borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, flex: 1, alignItems: 'center', borderWidth: 2 },
  watchlistBtnText: { fontSize: 12, fontWeight: '600' },
})
