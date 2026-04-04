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
import { C } from '../constants/theme'

function toDateString(d) {
  return d.toISOString().split('T')[0]
}

export default function LogEntry() {
  const params  = useLocalSearchParams()
  const router  = useRouter()

  const tmdbId = params.tmdb_id || null
  const type   = params.type    || 'film'
  const editId = params.edit    || null

  const [media, setMedia]               = useState(null)
  const [emotions, setEmotions]         = useState([])
  const [searchQ, setSearchQ]           = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [form, setForm] = useState({
    tmdb_id:    tmdbId || '',
    media_type: type,
    watched_on: toDateString(new Date()),
    rating:     3,
    review:     '',
    rewatch:    false,
    emotion_ids: [],
  })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { getEmotions().then(setEmotions) }, [])

  useEffect(() => {
    if (!tmdbId) return
    // Pre-populate media preview from TMDB search if we have tmdb_id from URL
    // We fetch media info directly from TMDB since the item may not be in DB yet
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
        tmdb_id:     entry.media.tmdb_id,
        media_type:  entry.media.media_type,
        watched_on:  entry.watched_on,
        rating:      entry.rating,
        review:      entry.review,
        rewatch:     entry.rewatch,
        emotion_ids: entry.emotions.map(e => e.id),
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
      if (editId) await updateEntry(editId, form)
      else        await createEntry(form)
      router.replace('/(tabs)')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const showForm = !!media || !!editId

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

      {error ? (
        <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
      ) : null}

      {/* Media search */}
      {!media && !editId && (
        <View style={s.section}>
          <Text style={s.label}>Find a film or TV show</Text>
          <View style={s.searchRow}>
            <TextInput
              style={s.searchInput}
              placeholder="Search TMDB…"
              placeholderTextColor={C.textMut}
              value={searchQ}
              onChangeText={setSearchQ}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} style={s.goBtn}>
              <Text style={s.goBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
          {searchResults.length > 0 && (
            <View style={s.searchResults}>
              {searchResults.slice(0, 5).map(r => (
                <TouchableOpacity key={r.tmdb_id} onPress={() => selectMedia(r)} style={s.searchRow2}>
                  {r.poster_path
                    ? <Image source={{ uri: `https://image.tmdb.org/t/p/w92${r.poster_path}` }} style={s.miniPoster} resizeMode="cover" />
                    : <View style={[s.miniPoster, s.miniPosterFallback]}><Text>🎬</Text></View>
                  }
                  <View>
                    <Text style={s.searchResultTitle}>
                      {r.title}{r.year ? <Text style={{ color: C.textMut }}> ({r.year})</Text> : null}
                    </Text>
                    <Text style={[s.typeSmall, { color: r.media_type === 'film' ? C.redL : C.goldL }]}>
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
        <View style={s.mediaCard}>
          {media.poster_url
            ? <Image source={{ uri: media.poster_url }} style={s.mediaPoster} resizeMode="cover" />
            : <View style={[s.mediaPoster, s.mediaPosterFallback]}><Text style={{ fontSize: 24 }}>🎬</Text></View>
          }
          <View style={s.mediaInfo}>
            <Text style={s.mediaTitle}>{media.title}</Text>
            {media.year ? <Text style={s.mediaYear}>{media.year}</Text> : null}
            <View style={[s.typeBadge, { borderColor: media.media_type === 'film' ? C.red : C.gold }]}>
              <Text style={[s.typeText, { color: media.media_type === 'film' ? C.redL : C.goldL }]}>
                {media.media_type === 'film' ? 'Film' : 'TV Show'}
              </Text>
            </View>
            {!editId && (
              <TouchableOpacity onPress={() => { setMedia(null); setForm(f => ({ ...f, tmdb_id: '', media_type: 'film' })) }}>
                <Text style={s.changeBtn}>Change</Text>
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
            <Text style={s.label}>Watched on</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={s.dateBtn}>
              <Text style={s.dateBtnText}>{form.watched_on}</Text>
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
                <Text style={s.doneBtn}>Done</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Rating */}
          <View>
            <Text style={s.label}>Rating (0–5)</Text>
            <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
            <Text style={s.ratingDisplay}>{form.rating} / 5</Text>
          </View>

          {/* Emotions */}
          <View>
            <Text style={s.label}>How did it make you feel?</Text>
            <EmotionPicker
              emotions={emotions}
              selected={form.emotion_ids}
              onChange={ids => setForm(f => ({ ...f, emotion_ids: ids }))}
            />
          </View>

          {/* Review */}
          <View>
            <Text style={s.label}>Notes <Text style={s.optional}>(optional)</Text></Text>
            <TextInput
              style={s.notesInput}
              placeholder="Any thoughts…"
              placeholderTextColor={C.textMut}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={form.review}
              onChangeText={v => setForm(f => ({ ...f, review: v }))}
            />
          </View>

          {/* Rewatch */}
          <View style={s.rewatchRow}>
            <Text style={s.rewatchLabel}>This was a rewatch</Text>
            <Switch
              value={form.rewatch}
              onValueChange={v => setForm(f => ({ ...f, rewatch: v }))}
              trackColor={{ true: C.red, false: C.border }}
              thumbColor={C.text}
            />
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[s.submitBtn, { opacity: loading ? 0.6 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color={C.text} />
                : <Text style={s.submitBtnText}>{editId ? 'Save changes' : 'Log entry'}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={s.cancelBtn}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  flex:               { flex: 1, backgroundColor: C.bg0 },
  content:            { padding: 16, paddingBottom: 60 },
  errorBox:           { backgroundColor: '#3f0000', borderWidth: 1, borderColor: C.red, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  errorText:          { color: '#fca5a5', fontSize: 13 },
  section:            { marginBottom: 24 },
  label:              { color: C.textSub, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  optional:           { color: C.textMut, fontWeight: '400' },
  searchRow:          { flexDirection: 'row', gap: 8 },
  searchInput:        { flex: 1, backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.text, fontSize: 14 },
  goBtn:              { backgroundColor: C.red, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  goBtnText:          { color: C.text, fontWeight: '600' },
  searchResults:      { marginTop: 12, gap: 8 },
  searchRow2:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bg2, borderRadius: 12, padding: 10 },
  miniPoster:         { width: 36, height: 54, borderRadius: 4 },
  miniPosterFallback: { backgroundColor: C.bg1, alignItems: 'center', justifyContent: 'center' },
  searchResultTitle:  { color: C.text, fontSize: 13, fontWeight: '500' },
  typeSmall:          { fontSize: 11, marginTop: 2 },
  mediaCard:          { backgroundColor: C.bg1, borderRadius: 12, flexDirection: 'row', gap: 16, padding: 16, marginBottom: 24 },
  mediaPoster:        { width: 64, height: 96, borderRadius: 8 },
  mediaPosterFallback:{ backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },
  mediaInfo:          { flex: 1 },
  mediaTitle:         { color: C.text, fontWeight: '600', fontSize: 15 },
  mediaYear:          { color: C.textSub, fontSize: 13, marginTop: 2 },
  typeBadge:          { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 },
  typeText:           { fontSize: 11 },
  changeBtn:          { color: C.textMut, fontSize: 12, marginTop: 6 },
  formFields:         { gap: 20 },
  dateBtn:            { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  dateBtnText:        { color: C.text, fontSize: 14 },
  doneBtn:            { color: C.gold, fontSize: 13, textAlign: 'right', marginTop: 8 },
  ratingDisplay:      { color: C.gold, fontFamily: 'monospace', fontSize: 13, marginTop: 4 },
  notesInput:         { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.text, fontSize: 14, minHeight: 80 },
  rewatchRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rewatchLabel:       { color: C.textSub, fontSize: 13 },
  actions:            { flexDirection: 'row', gap: 12, paddingTop: 8 },
  submitBtn:          { flex: 1, backgroundColor: C.red, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText:      { color: C.text, fontWeight: '600' },
  cancelBtn:          { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  cancelBtnText:      { color: C.textSub, fontWeight: '500' },
})
