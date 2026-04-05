import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, ImageBackground, StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getMedia, deleteEntry, addToWatchlist, removeFromWatchlistByTmdbId, isInWatchlist } from '../../lib/queries'
import EntryCard from '../../components/EntryCard'
import { StarDisplay } from '../../components/StarRating'
import { C } from '../../constants/theme'

export default function MediaDetail() {
  const { tmdbId, type } = useLocalSearchParams()
  const router           = useRouter()

  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [wlLoading,   setWlLoading]   = useState(false)

  const load = useCallback(async () => {
    try {
      const d = await getMedia(Number(tmdbId), type || 'film')
      setData(d)
      // Check watchlist status if media is in DB (has an id)
      if (d.media.id) {
        const wl = await isInWatchlist(d.media.id)
        setInWatchlist(wl)
      }
    } catch (err) {
      Alert.alert('Error', err.message)
      router.back()
    }
  }, [tmdbId, type])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

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

  async function toggleWatchlist() {
    if (!data?.media) return
    setWlLoading(true)
    try {
      if (inWatchlist) {
        await removeFromWatchlistByTmdbId(Number(tmdbId))
        setInWatchlist(false)
      } else {
        await addToWatchlist(Number(tmdbId), data.media.media_type || type || 'film')
        setInWatchlist(true)
      }
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setWlLoading(false)
    }
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={C.gold} /></View>
  }
  if (!data) return null

  const { media, entries, avg_rating } = data
  const genres = Array.isArray(media.genres) ? media.genres : []
  const cast   = Array.isArray(media.cast)   ? media.cast   : []

  return (
    <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Backdrop */}
      {media.backdrop_url ? (
        <ImageBackground source={{ uri: media.backdrop_url }} style={s.backdrop} resizeMode="cover">
          <View style={s.backdropOverlay} />
        </ImageBackground>
      ) : <View style={s.backdropEmpty} />}

      {/* Header row */}
      <View style={[s.headerRow, { marginTop: media.backdrop_url ? -70 : 0 }]}>
        <View style={s.posterWrap}>
          {media.poster_url ? (
            <Image source={{ uri: media.poster_url }} style={s.poster} resizeMode="cover" />
          ) : (
            <View style={[s.poster, s.posterFallback]}><Text style={{ fontSize: 32 }}>🎬</Text></View>
          )}
          {/* TMDB Rating overlay on poster */}
          {media.tmdb_rating != null && (
            <View style={s.posterRating}>
              <Text style={s.posterRatingText}>★ {Number(media.tmdb_rating).toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={s.headerInfo}>
          <Text style={s.mediaTitle}>{media.title}</Text>
          {media.tagline ? <Text style={s.tagline}>"{media.tagline}"</Text> : null}
          {media.year    ? <Text style={s.mediaYear}>{media.year}</Text> : null}

          <View style={s.metaRow}>
            <View style={[s.typeBadge, { borderColor: (media.media_type === 'film' || media.media_type === 'movie') ? C.red : C.gold }]}>
              <Text style={[s.typeText, { color: (media.media_type === 'film' || media.media_type === 'movie') ? C.redL : C.goldL }]}>
                {(media.media_type === 'film' || media.media_type === 'movie') ? 'Film' : 'TV Show'}
              </Text>
            </View>
            {genres.slice(0, 3).map(g => (
              <Text key={g} style={s.genre}>{g}</Text>
            ))}
          </View>

          {media.runtime ? (
            <Text style={s.runtime}>
              {Math.floor(media.runtime / 60)}h {media.runtime % 60}m
            </Text>
          ) : null}

          <View style={s.ratingsRow}>
            {avg_rating != null && (
              <View style={s.ratingBox}>
                <Text style={s.avgRating}>{Number(avg_rating).toFixed(1)}</Text>
                <Text style={s.ratingLabel}>your avg</Text>
              </View>
            )}
            {media.tmdb_rating != null && (
              <View style={s.ratingBox}>
                <Text style={s.tmdbRating}>{Number(media.tmdb_rating).toFixed(1)}</Text>
                <Text style={s.ratingLabel}>
                  TMDB{media.vote_count ? ` (${(media.vote_count / 1000).toFixed(0)}k)` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Overview */}
      {media.overview ? (
        <Text style={s.overview}>{media.overview}</Text>
      ) : null}

      {/* Cast */}
      {cast.length > 0 && (
        <View style={s.castBlock}>
          <Text style={s.castHeader}>Cast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.castRow}>
            {cast.map(person => (
              <View key={person.id} style={s.castPill}>
                <View style={s.castAvatar}>
                  {person.profile_path ? (
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w92${person.profile_path}` }}
                      style={s.castAvatarImg}
                    />
                  ) : (
                    <Text style={s.castAvatarFallback}>👤</Text>
                  )}
                </View>
                <Text style={s.castName} numberOfLines={1}>{person.name}</Text>
                {person.character ? (
                  <Text style={s.castChar} numberOfLines={1}>{person.character}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={s.actionRow}>
        <TouchableOpacity
          onPress={() => router.push(`/log?tmdb_id=${media.tmdb_id}&type=${media.media_type || type}`)}
          style={s.logBtn}
        >
          <Text style={s.logBtnText}>+ Log Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={toggleWatchlist}
          disabled={wlLoading}
          style={[s.wlBtn, inWatchlist && s.wlBtnActive]}
        >
          {wlLoading
            ? <ActivityIndicator size="small" color={C.gold} />
            : <Text style={[s.wlBtnText, inWatchlist && s.wlBtnTextActive]}>
                {inWatchlist ? '✓ Saved' : '🔖 Watchlist'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* Entries */}
      <View style={s.entriesBlock}>
        <Text style={s.entriesHeader}>
          Your Entries <Text style={s.entriesCount}>({entries.length})</Text>
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
  flex:             { flex: 1, backgroundColor: C.bg0 },
  center:           { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center' },
  backdrop:         { height: 200 },
  backdropEmpty:    { height: 24 },
  backdropOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },

  // Header
  headerRow:        { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16 },
  posterWrap:       { position: 'relative' },
  poster:           { width: 110, height: 165, borderRadius: 12, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8 },
  posterFallback:   { backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },
  posterRating:     { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  posterRatingText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  headerInfo:       { flex: 1, paddingTop: 8 },
  mediaTitle:       { color: C.text, fontSize: 20, fontWeight: '800', lineHeight: 26 },
  tagline:          { color: C.textMut, fontSize: 12, fontStyle: 'italic', marginTop: 3 },
  mediaYear:        { color: C.textSub, fontSize: 13, marginTop: 3 },
  metaRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  typeBadge:        { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText:         { fontSize: 11 },
  genre:            { color: C.textMut, fontSize: 11 },
  runtime:          { color: C.textMut, fontSize: 11, marginTop: 4 },
  ratingsRow:       { flexDirection: 'row', gap: 20, marginTop: 10, alignItems: 'flex-end' },
  ratingBox:        { alignItems: 'center' },
  avgRating:        { color: C.gold, fontSize: 22, fontWeight: '700' },
  tmdbRating:       { color: C.goldL, fontSize: 18, fontWeight: '700' },
  ratingLabel:      { color: C.textMut, fontSize: 10, marginTop: 1 },

  // Overview
  overview:         { color: C.textSub, fontSize: 13, paddingHorizontal: 16, marginBottom: 16, lineHeight: 20 },

  // Cast
  castBlock:        { paddingHorizontal: 16, marginBottom: 20 },
  castHeader:       { color: C.textSub, fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  castRow:          { gap: 12 },
  castPill:         { width: 72, alignItems: 'center' },
  castAvatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: C.bg2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  castAvatarImg:    { width: 52, height: 52 },
  castAvatarFallback:{ fontSize: 22 },
  castName:         { color: C.textSub, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  castChar:         { color: C.textMut, fontSize: 9, textAlign: 'center', marginTop: 1 },

  // Action buttons
  actionRow:        { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 24 },
  logBtn:           { flex: 1, backgroundColor: C.red, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  logBtnText:       { color: C.text, fontWeight: '700', fontSize: 14 },
  wlBtn:            { flex: 1, backgroundColor: C.bg2, borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  wlBtnActive:      { borderColor: C.gold, backgroundColor: 'rgba(212,175,55,0.12)' },
  wlBtnText:        { color: C.textSub, fontWeight: '600', fontSize: 13 },
  wlBtnTextActive:  { color: C.gold },

  // Entries
  entriesBlock:     { paddingHorizontal: 16 },
  entriesHeader:    { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  entriesCount:     { color: C.textMut, fontWeight: '400', fontSize: 14 },
  noEntries:        { color: C.textMut, textAlign: 'center', paddingVertical: 32 },
})
