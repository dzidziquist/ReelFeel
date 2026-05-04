import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Switch, Platform, Alert, StyleSheet,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getEmotions, getDiary, createEntry, updateEntry } from '../lib/queries'
import { searchTMDB } from '../lib/tmdb'
import EmotionPicker from '../components/EmotionPicker'
import { StarPicker } from '../components/StarRating'
import TVEpisodeBrowser from '../components/TVEpisodeBrowser'
import { useTheme } from '../context/ThemeContext'

function toDateString(d) {
  return d.toISOString().split('T')[0]
}

export default function LogEntry() {
  const params   = useLocalSearchParams()
  const router   = useRouter()
  const { theme } = useTheme()

  const tmdbId = params.tmdb_id || null
  const type   = params.type    || 'film'
  const editId = params.edit    || null

  const [media, setMedia]               = useState(null)
  const [emotions, setEmotions]         = useState([])
  const [searchQ, setSearchQ]           = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [form, setForm] = useState({
    tmdb_id:        tmdbId || '',
    media_type:     type,
    watched_on:     toDateString(new Date()),
    rating:         3,
    review:         '',
    rewatch:        false,
    emotion_ids:    [],
    season_number:  '',
    episode_number: '',
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { getEmotions().then(setEmotions) }, [])

  useEffect(() => {
    if (!tmdbId) return
    import('../lib/tmdb').then(({ fetchTMDBDetail }) =>
      fetchTMDBDetail(Number(tmdbId), type).then(d =>
        setMedia({ tmdb_id: Number(tmdbId), media_type: type, title: d.title, year: d.year, poster_url: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null })
      ).catch(() => {})
    )
  }, [tmdbId])

  useEffect(() => {
    if (!editId) return
    getDiary().then(entries => {
      const entry = entries.find(e => String(e.id) === String(editId))
      if (!entry) return
      setMedia(entry.media)
      setForm({
        tmdb_id:        entry.media.tmdb_id,
        media_type:     entry.media.media_type,
        watched_on:     entry.watched_on,
        rating:         entry.rating,
        review:         entry.review,
        rewatch:        entry.rewatch,
        emotion_ids:    entry.emotions.map(e => e.id),
        season_number:  entry.season_number  ? String(entry.season_number)  : '',
        episode_number: entry.episode_number ? String(entry.episode_number) : '',
      })
    })
  }, [editId])

  async function handleSearch() {
    if (!searchQ.trim()) return
    const data = await searchTMDB(searchQ.trim())
    setSearchResults(data)
  }

  function selectMedia(r) {
    setForm(f => ({ ...f, tmdb_id: r.tmdb_id, media_type: r.media_type }))
    setMedia({
      tmdb_id: r.tmdb_id, media_type: r.media_type,
      title: r.title, year: r.year,
      poster_url: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    })
    setSearchResults([])
    setSearchQ('')
  }

  async function handleSubmit() {
    if (!form.tmdb_id) { setError('Select a film or TV show first.'); return }
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        season_number:  form.season_number  ? parseInt(form.season_number,  10) : undefined,
        episode_number: form.episode_number ? parseInt(form.episode_number, 10) : undefined,
      }
      if (editId) await updateEntry(editId, payload)
      else        await createEntry(payload)
      router.replace('/(tabs)')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const showForm = !!media || !!editId
  const isFilm   = form.media_type === 'film' || form.media_type === 'movie'

  return (
    <ScrollView
      style={[s.flex, { backgroundColor: theme.bg0 }]}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >

      {error ? (
        <View style={[s.errorBox, { borderColor: theme.red }]}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Media search */}
      {!media && !editId && (
        <View style={s.section}>
          <Text style={[s.label, { color: theme.textSub }]}>Find a film or TV show</Text>
          <View style={s.searchRow}>
            <TextInput
              style={[s.searchInput, { backgroundColor: theme.bg2, borderColor: theme.text, color: theme.text }]}
              placeholder="Search TMDB…"
              placeholderTextColor={theme.textMut}
              value={searchQ}
              onChangeText={setSearchQ}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} style={[s.goBtn, { backgroundColor: theme.red }]}>
              <Text style={s.goBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
          {searchResults.length > 0 && (
            <View style={s.searchResults}>
              {searchResults.slice(0, 5).map(r => (
                <TouchableOpacity
                  key={r.tmdb_id}
                  onPress={() => selectMedia(r)}
                  style={[s.searchRow2, { backgroundColor: theme.bg2 }]}
                >
                  {r.poster_path
                    ? <Image source={{ uri: `https://image.tmdb.org/t/p/w92${r.poster_path}` }} style={s.miniPoster} resizeMode="cover" />
                    : <View style={[s.miniPoster, { backgroundColor: theme.bg1, alignItems: 'center', justifyContent: 'center' }]}><Text>🎬</Text></View>
                  }
                  <View>
                    <Text style={[s.searchResultTitle, { color: theme.text }]}>
                      {r.title}{r.year ? <Text style={{ color: theme.textMut }}> ({r.year})</Text> : null}
                    </Text>
                    <Text style={[s.typeSmall, { color: r.media_type === 'film' ? theme.redL : theme.goldL }]}>
                      {r.media_type === 'film' ? 'Film' : 'TV Show'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Selected media preview */}
      {media && (
        <View style={[s.mediaCard, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
          {media.poster_url
            ? <Image source={{ uri: media.poster_url }} style={s.mediaPoster} resizeMode="cover" />
            : <View style={[s.mediaPoster, { backgroundColor: theme.bg2, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 24 }}>🎬</Text></View>
          }
          <View style={s.mediaInfo}>
            <Text style={[s.mediaTitle, { color: theme.text }]}>{media.title}</Text>
            {media.year ? <Text style={[s.mediaYear, { color: theme.textSub }]}>{media.year}</Text> : null}
            <View style={[s.typeBadge, { borderColor: isFilm ? theme.red : theme.gold }]}>
              <Text style={[s.typeText, { color: isFilm ? theme.redL : theme.goldL }]}>
                {isFilm ? 'Film' : 'TV Show'}
              </Text>
            </View>
            {!editId && (
              <TouchableOpacity onPress={() => { setMedia(null); setForm(f => ({ ...f, tmdb_id: '', media_type: 'film' })) }}>
                <Text style={[s.changeBtn, { color: theme.textMut }]}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Form */}
      {showForm && (
        <View style={s.formFields}>

          {/* Date */}
          <View>
            <Text style={[s.label, { color: theme.textSub }]}>Watched on</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[s.dateBtn, { backgroundColor: theme.bg2, borderColor: theme.text }]}
            >
              <Text style={[s.dateBtnText, { color: theme.text }]}>{form.watched_on}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(form.watched_on + 'T00:00:00')}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'ios')
                  if (date) setForm(f => ({ ...f, watched_on: toDateString(date) }))
                }}
              />
            )}
            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[s.doneBtn, { color: theme.gold }]}>Done</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Season / Episode browser — TV only */}
          {form.media_type === 'tv' && form.tmdb_id && (
            <View>
              <Text style={[s.label, { color: theme.textSub }]}>
                Season & Episode <Text style={[s.optional, { color: theme.textMut }]}>(optional)</Text>
              </Text>
              <TVEpisodeBrowser
                tmdbId={Number(form.tmdb_id)}
                seasonNumber={form.season_number}
                episodeNumber={form.episode_number}
                onSelect={(sn, ep) => setForm(f => ({
                  ...f,
                  season_number:  sn ? String(sn) : '',
                  episode_number: ep ? String(ep) : '',
                }))}
              />
            </View>
          )}

          {/* Rating */}
          <View>
            <Text style={[s.label, { color: theme.textSub }]}>Rating (0–5)</Text>
            <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
          </View>

          {/* Emotions */}
          <View>
            <Text style={[s.label, { color: theme.textSub }]}>How did it make you feel?</Text>
            <EmotionPicker
              emotions={emotions}
              selected={form.emotion_ids}
              onChange={ids => setForm(f => ({ ...f, emotion_ids: ids }))}
            />
          </View>

          {/* Review */}
          <View>
            <Text style={[s.label, { color: theme.textSub }]}>
              Notes <Text style={[s.optional, { color: theme.textMut }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[s.notesInput, { backgroundColor: theme.bg2, borderColor: theme.text, color: theme.text }]}
              placeholder="Any thoughts…"
              placeholderTextColor={theme.textMut}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={form.review}
              onChangeText={v => setForm(f => ({ ...f, review: v }))}
            />
          </View>

          {/* Rewatch */}
          <View style={s.rewatchRow}>
            <Text style={[s.rewatchLabel, { color: theme.textSub }]}>This was a rewatch</Text>
            <Switch
              value={form.rewatch}
              onValueChange={v => setForm(f => ({ ...f, rewatch: v }))}
              trackColor={{ true: theme.red, false: theme.bg3 }}
              thumbColor={theme.text}
            />
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[s.submitBtn, { backgroundColor: theme.red, opacity: loading ? 0.6 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitBtnText}>{editId ? 'Save changes' : 'Log entry'}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[s.cancelBtn, { borderColor: theme.text }]}
            >
              <Text style={[s.cancelBtnText, { color: theme.textSub }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  flex:               { flex: 1 },
  content:            { padding: 16, paddingBottom: 60 },
  errorBox:           { backgroundColor: '#3f0000', borderWidth: 2, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, borderColor: '#dc2626' },
  errorText:          { color: '#fca5a5', fontSize: 13 },
  section:            { marginBottom: 24 },
  label:              { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  optional:           { fontWeight: '400' },
  searchRow:          { flexDirection: 'row', gap: 8 },
  searchInput:        {
    flex: 1, borderWidth: 2, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.6, shadowRadius: 0, elevation: 2,
  },
  goBtn:              {
    borderRadius: 6, paddingHorizontal: 16, justifyContent: 'center',
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 3,
  },
  goBtnText:          { color: '#fff', fontWeight: '800' },
  searchResults:      { marginTop: 12, gap: 8 },
  searchRow2:         { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 6, padding: 10 },
  miniPoster:         { width: 36, height: 54, borderRadius: 4 },
  searchResultTitle:  { fontSize: 13, fontWeight: '600' },
  typeSmall:          { fontSize: 11, marginTop: 2 },
  mediaCard:          {
    borderRadius: 6, flexDirection: 'row', gap: 16, padding: 16, marginBottom: 24,
    borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.7, shadowRadius: 0, elevation: 3,
  },
  mediaPoster:        { width: 64, height: 96, borderRadius: 4 },
  mediaInfo:          { flex: 1 },
  mediaTitle:         { fontWeight: '700', fontSize: 15 },
  mediaYear:          { fontSize: 13, marginTop: 2 },
  typeBadge:          { borderWidth: 2, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 },
  typeText:           { fontSize: 11, fontWeight: '700' },
  changeBtn:          { fontSize: 12, marginTop: 6 },
  formFields:         { gap: 20 },
  dateBtn:            {
    borderWidth: 2, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 2,
  },
  dateBtnText:        { fontSize: 14 },
  doneBtn:            { fontSize: 13, textAlign: 'right', marginTop: 8 },
  notesInput:         {
    borderWidth: 2, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, minHeight: 80,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 2,
  },
  rewatchRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rewatchLabel:       { fontSize: 13 },
  actions:            { flexDirection: 'row', gap: 12, paddingTop: 8 },
  submitBtn:          {
    flex: 1, borderRadius: 6, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 3,
  },
  submitBtnText:      { color: '#fff', fontWeight: '800' },
  cancelBtn:          { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 6, borderWidth: 2 },
  cancelBtnText:      { fontWeight: '600' },
})
