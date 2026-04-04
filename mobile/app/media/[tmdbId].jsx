import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, ImageBackground, StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getMedia, deleteEntry } from '../../lib/queries'
import EntryCard from '../../components/EntryCard'
import { StarDisplay } from '../../components/StarRating'
import { C } from '../../constants/theme'

export default function MediaDetail() {
  const { tmdbId } = useLocalSearchParams()
  const router     = useRouter()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMedia(tmdbId)
      .then(setData)
      .catch(() => router.back())
      .finally(() => setLoading(false))
  }, [tmdbId])

  async function handleDelete(id) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteEntry(id)
          setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
        },
      },
    ])
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={C.gold} /></View>
  }
  if (!data) return null

  const { media, entries, avg_rating } = data

  return (
    <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Backdrop */}
      {media.backdrop_url ? (
        <ImageBackground source={{ uri: media.backdrop_url }} style={s.backdrop} resizeMode="cover">
          <View style={s.backdropOverlay} />
        </ImageBackground>
      ) : null}

      {/* Header */}
      <View style={[s.headerRow, { marginTop: media.backdrop_url ? -60 : 0 }]}>
        {media.poster_url ? (
          <Image source={{ uri: media.poster_url }} style={s.poster} resizeMode="cover" />
        ) : null}
        <View style={s.headerInfo}>
          <Text style={s.mediaTitle}>{media.title}</Text>
          {media.year ? <Text style={s.mediaYear}>({media.year})</Text> : null}
          <View style={s.metaRow}>
            <View style={[s.typeBadge, { borderColor: media.media_type === 'film' ? C.red : C.gold }]}>
              <Text style={[s.typeText, { color: media.media_type === 'film' ? C.redL : C.goldL }]}>
                {media.media_type === 'film' ? 'Film' : 'TV Show'}
              </Text>
            </View>
            {(media.genres || []).map(g => (
              <Text key={g} style={s.genre}>{g}</Text>
            ))}
          </View>
          {media.runtime ? <Text style={s.runtime}>{media.runtime} min</Text> : null}

          <View style={s.ratingsRow}>
            {avg_rating != null && (
              <View>
                <Text style={s.avgRating}>{Number(avg_rating).toFixed(1)}</Text>
                <Text style={s.ratingLabel}>your avg</Text>
              </View>
            )}
            {media.tmdb_rating ? (
              <View>
                <Text style={s.tmdbRating}>{media.tmdb_rating.toFixed(1)}</Text>
                <Text style={s.ratingLabel}>TMDB / 10</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {media.overview ? (
        <Text style={s.overview}>{media.overview}</Text>
      ) : null}

      <TouchableOpacity
        onPress={() => router.push(`/log?tmdb_id=${media.tmdb_id}&type=${media.media_type}`)}
        style={s.logBtn}
      >
        <Text style={s.logBtnText}>+ Log entry</Text>
      </TouchableOpacity>

      {/* Entries */}
      <View style={s.entriesBlock}>
        <Text style={s.entriesHeader}>
          Your entries <Text style={s.entriesCount}>({entries.length})</Text>
        </Text>
        {entries.length === 0
          ? <Text style={s.noEntries}>You haven't logged this yet.</Text>
          : entries.map((e, i) => (
            <View key={e.id} style={{ marginBottom: i < entries.length - 1 ? 12 : 0 }}>
              <EntryCard entry={e} onDelete={handleDelete} />
            </View>
          ))
        }
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  flex:           { flex: 1, backgroundColor: C.bg0 },
  center:         { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center' },
  backdrop:       { height: 180 },
  backdropOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  headerRow:      { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  poster:         { width: 100, height: 150, borderRadius: 12, elevation: 8 },
  headerInfo:     { flex: 1, paddingTop: 8 },
  mediaTitle:     { color: C.text, fontSize: 22, fontWeight: '700', lineHeight: 28 },
  mediaYear:      { color: C.textSub, fontSize: 15, marginTop: 2 },
  metaRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  typeBadge:      { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText:       { fontSize: 11 },
  genre:          { color: C.textMut, fontSize: 11 },
  runtime:        { color: C.textMut, fontSize: 11, marginTop: 4 },
  ratingsRow:     { flexDirection: 'row', gap: 20, marginTop: 12, alignItems: 'flex-end' },
  avgRating:      { color: C.gold, fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  tmdbRating:     { color: C.goldL, fontSize: 20, fontWeight: '700', fontFamily: 'monospace' },
  ratingLabel:    { color: C.textMut, fontSize: 11, marginTop: 2 },
  overview:       { color: C.textSub, fontSize: 13, paddingHorizontal: 16, marginBottom: 16, lineHeight: 20 },
  logBtn:         { marginHorizontal: 16, marginBottom: 24, backgroundColor: C.red, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  logBtnText:     { color: C.text, fontWeight: '600' },
  entriesBlock:   { paddingHorizontal: 16 },
  entriesHeader:  { color: C.text, fontSize: 17, fontWeight: '600', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  entriesCount:   { color: C.textMut, fontWeight: '400', fontSize: 15 },
  noEntries:      { color: C.textMut, textAlign: 'center', paddingVertical: 32 },
})
