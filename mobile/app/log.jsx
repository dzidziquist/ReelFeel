import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, Switch, Platform, Alert,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../api/client'
import EmotionPicker from '../components/EmotionPicker'
import { StarPicker } from '../components/StarRating'

function toDateString(d) {
  return d.toISOString().split('T')[0]
}

export default function LogEntry() {
  const params = useLocalSearchParams()
  const router = useRouter()

  const tmdbId = params.tmdb_id || null
  const type   = params.type || 'film'
  const editId = params.edit || null

  const [media, setMedia] = useState(null)
  const [emotions, setEmotions] = useState([])
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [form, setForm] = useState({
    tmdb_id: tmdbId || '',
    media_type: type,
    watched_on: toDateString(new Date()),
    rating: 3,
    review: '',
    rewatch: false,
    emotion_ids: [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.getEmotions().then(setEmotions) }, [])

  useEffect(() => {
    if (!tmdbId) return
    api.getMedia(tmdbId).then(d => setMedia(d.media)).catch(() => {})
  }, [tmdbId])

  useEffect(() => {
    if (!editId) return
    api.getDiary().then(entries => {
      const entry = entries.find(e => e.id === Number(editId))
      if (!entry) return
      setMedia(entry.media)
      setForm({
        tmdb_id: entry.media.tmdb_id,
        media_type: entry.media.media_type,
        watched_on: entry.watched_on,
        rating: entry.rating,
        review: entry.review,
        rewatch: entry.rewatch,
        emotion_ids: entry.emotions.map(e => e.id),
      })
    })
  }, [editId])

  async function handleSearch() {
    if (!searchQ.trim()) return
    const data = await api.search(searchQ.trim())
    setSearchResults(data.results || [])
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
      if (editId) {
        await api.updateEntry(editId, form)
      } else {
        await api.createEntry(form)
      }
      router.replace('/(tabs)')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const showForm = !!media || !!editId

  return (
    <ScrollView className="flex-1 bg-gray-950" contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">

      {error ? (
        <View className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 mb-4">
          <Text className="text-red-300 text-sm">{error}</Text>
        </View>
      ) : null}

      {/* Media search */}
      {!media && !editId && (
        <View className="mb-6">
          <Text className="text-gray-300 text-sm font-medium mb-2">Find a film or TV show</Text>
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
              placeholder="Search TMDB…"
              placeholderTextColor="#6b7280"
              value={searchQ}
              onChangeText={setSearchQ}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} className="bg-orange-600 rounded-xl px-4 justify-center">
              <Text className="text-white font-semibold">Go</Text>
            </TouchableOpacity>
          </View>
          {searchResults.length > 0 && (
            <View className="mt-3 gap-2">
              {searchResults.slice(0, 5).map(r => (
                <TouchableOpacity
                  key={r.tmdb_id}
                  onPress={() => selectMedia(r)}
                  className="flex-row items-center gap-3 bg-gray-800 rounded-xl p-2.5"
                >
                  {r.poster_path
                    ? <Image source={{ uri: `https://image.tmdb.org/t/p/w92${r.poster_path}` }} style={{ width: 36, height: 54, borderRadius: 4 }} resizeMode="cover" />
                    : <View className="bg-gray-600 rounded items-center justify-center" style={{ width: 36, height: 54 }}><Text>🎬</Text></View>
                  }
                  <View>
                    <Text className="text-white text-sm font-medium">{r.title} {r.year ? <Text className="text-gray-400">({r.year})</Text> : null}</Text>
                    <Text className="text-xs" style={{ color: r.media_type === 'film' ? '#60a5fa' : '#c084fc' }}>
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
        <View className="bg-gray-800 rounded-xl flex-row gap-4 p-4 mb-6">
          {media.poster_url
            ? <Image source={{ uri: media.poster_url }} style={{ width: 64, height: 96, borderRadius: 8 }} resizeMode="cover" />
            : <View className="bg-gray-700 rounded-lg items-center justify-center" style={{ width: 64, height: 96 }}><Text className="text-2xl">🎬</Text></View>
          }
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">{media.title}</Text>
            {media.year ? <Text className="text-gray-400 text-sm">{media.year}</Text> : null}
            <View
              className="rounded border mt-1 px-1.5 py-0.5 self-start"
              style={{ borderColor: media.media_type === 'film' ? '#1d4ed8' : '#7e22ce' }}
            >
              <Text className="text-xs" style={{ color: media.media_type === 'film' ? '#60a5fa' : '#c084fc' }}>
                {media.media_type === 'film' ? 'Film' : 'TV Show'}
              </Text>
            </View>
            {!editId && (
              <TouchableOpacity onPress={() => { setMedia(null); setForm(f => ({ ...f, tmdb_id: '', media_type: 'film' })) }}>
                <Text className="text-gray-500 text-xs mt-1">Change</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Form */}
      {showForm && (
        <View className="gap-5">
          {/* Date */}
          <View>
            <Text className="text-gray-300 text-sm font-medium mb-2">Watched on</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
            >
              <Text className="text-white text-sm">{form.watched_on}</Text>
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
              <TouchableOpacity onPress={() => setShowDatePicker(false)} className="mt-2">
                <Text className="text-orange-400 text-sm text-right">Done</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Rating */}
          <View>
            <Text className="text-gray-300 text-sm font-medium mb-2">Rating (0–5)</Text>
            <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
            <Text className="text-orange-400 font-mono text-sm mt-1">{form.rating} / 5</Text>
          </View>

          {/* Emotions */}
          <View>
            <Text className="text-gray-300 text-sm font-medium mb-2">How did it make you feel?</Text>
            <EmotionPicker
              emotions={emotions}
              selected={form.emotion_ids}
              onChange={ids => setForm(f => ({ ...f, emotion_ids: ids }))}
            />
          </View>

          {/* Review */}
          <View>
            <Text className="text-gray-300 text-sm font-medium mb-2">Notes <Text className="text-gray-500 font-normal">(optional)</Text></Text>
            <TextInput
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm"
              placeholder="Any thoughts…"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={form.review}
              onChangeText={v => setForm(f => ({ ...f, review: v }))}
              style={{ minHeight: 80 }}
            />
          </View>

          {/* Rewatch */}
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-300 text-sm">This was a rewatch</Text>
            <Switch
              value={form.rewatch}
              onValueChange={v => setForm(f => ({ ...f, rewatch: v }))}
              trackColor={{ true: '#f97316', false: '#374151' }}
              thumbColor="#fff"
            />
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 pt-2">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="flex-1 bg-orange-500 rounded-xl py-3.5 items-center"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-semibold">{editId ? 'Save changes' : 'Log entry'}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} className="px-5 py-3.5 rounded-xl border border-gray-700">
              <Text className="text-gray-400 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
