import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, ImageBackground, StyleSheet, Share,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getMedia, deleteEntry, addToWatchlist, removeFromWatchlistByTmdbId, isInWatchlist } from '../../lib/queries'
import { getWatchProviders, checkReleaseStatus } from '../../lib/tmdb'
import EntryCard from '../../components/EntryCard'
import { StarDisplay } from '../../components/StarRating'
import StreamingProviders from '../../components/StreamingProviders'
import { useTheme } from '../../context/ThemeContext'

export default function MediaDetail() {
  const { tmdbId, type } = useLocalSearchParams()
  const router           = useRouter()
  const { theme }        = useTheme()
  const insets           = useSafeAreaInsets()

  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [wlLoading,   setWlLoading]   = useState(false)
  const [providers,     setProviders]     = useState({ link: null, streaming: [], rent: [], buy: [] })
  const [releaseStatus, setReleaseStatus] = useState({
    inTheatres: false, comingSoonTheatres: false, comingSoonStreaming: false,
    theatreDate: null, streamingDate: null,
  })

  const load = useCallback(async () => {
    try {
      const d = await getMedia(Number(tmdbId), type || 'film')
      setData(d)
      if (d.media.id) {
        const wl = await isInWatchlist(d.media.id)
        setInWatchlist(wl)
      }
      // Fetch streaming providers + theatre status (non-blocking)
      const mediaType = d.media.media_type || type || 'film'
      getWatchProviders(Number(tmdbId), mediaType).then(p => setProviders(p)).catch(() => {})
      const isFilmType = mediaType === 'film' || mediaType === 'movie'
      if (isFilmType) {
        checkReleaseStatus(Number(tmdbId)).then(v => setReleaseStatus(v)).catch(() => {})
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

  async function handleShare() {
    if (!data?.media) return
    const { media } = data
    const webUrl    = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://reelfeel.me'
    const typeSlug  = media.media_type === 'film' || media.media_type === 'movie' ? 'movie' : 'tv'
    const url       = `${webUrl}/media/${tmdbId}?type=${typeSlug}`
    const snippet   = media.overview ? media.overview.slice(0, 120) + (media.overview.length > 120 ? '…' : '') : ''
    const ratingLine = data.avg_rating != null ? `I rated it ${Number(data.avg_rating).toFixed(1)}/5 ⭐` : null
    const message = [
      `Check out ${media.title}${media.year ? ` (${media.year})` : ''} on ReelFeel 🎬`,
      ratingLine,
      snippet,
      url,
    ].filter(Boolean).join('\n')
    try {
      await Share.share({ message })
    } catch {
      Alert.alert('Share failed', 'Could not open the share sheet.')
    }
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
    return (
      <View style={[s.center, { backgroundColor: theme.bg0 }]}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    )
  }
  if (!data) return null

  const { media, entries, avg_rating } = data
  const genres      = Array.isArray(media.genres) ? media.genres : []
  const cast        = Array.isArray(media.cast)   ? media.cast   : []
  const isFilm      = media.media_type === 'film' || media.media_type === 'movie'
  const isUnreleased = isFilm && (
    releaseStatus.comingSoonTheatres ||
    (media.year && Number(media.year) > new Date().getFullYear())
  )
  const hasBackdrop = !!media.backdrop_url
  // Title/tagline/year sit in the ~54px that overlaps the dark backdrop overlay —
  // force white so they're readable in light mode too.
  const titleColor  = hasBackdrop ? '#fff' : theme.text
  const subColor    = hasBackdrop ? '#fff' : theme.textSub
  const mutColor    = hasBackdrop ? 'rgba(255,255,255,0.92)' : theme.textMut
  const textShadow  = hasBackdrop ? { textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 } : {}

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
    {/* Floating back pill */}
    <TouchableOpacity
      onPress={() => router.back()}
      style={[s.backPill, { top: insets.top + 8, backgroundColor: theme.bg1, borderColor: theme.text }]}
      activeOpacity={0.85}
    >
      <Ionicons name="chevron-back" size={18} color={theme.text} />
    </TouchableOpacity>

    <ScrollView style={s.flex} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Backdrop */}
      {media.backdrop_url ? (
        <ImageBackground source={{ uri: media.backdrop_url }} style={s.backdrop} resizeMode="cover">
          <View style={s.backdropOverlay} />
        </ImageBackground>
      ) : <View style={s.backdropEmpty} />}

      {/* Header row — whole row lifts into backdrop so poster and title align */}
      <View style={[s.headerRow, { marginTop: hasBackdrop ? -70 : 0 }]}>
        <View style={[s.posterWrap, { width: 110, height: 165 }]}>
          {media.poster_url ? (
            <Image source={{ uri: media.poster_url }} style={s.poster} resizeMode="cover" />
          ) : (
            <View style={[s.poster, { backgroundColor: theme.bg2, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 32 }}>🎬</Text>
            </View>
          )}
          {media.tmdb_rating != null && (
            <View style={s.posterRating}>
              <Text style={[s.posterRatingText, { color: theme.gold }]}>★ {Number(media.tmdb_rating).toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={s.headerInfo}>
          <Text style={[s.mediaTitle, { color: titleColor }, textShadow]}>{media.title}</Text>
          {media.tagline ? <Text style={[s.tagline, { color: mutColor }, textShadow]}>"{media.tagline}"</Text> : null}
          {media.year    ? <Text style={[s.mediaYear, { color: subColor }, textShadow]}>{media.year}</Text> : null}

          <View style={s.metaRow}>
            <View style={[s.typeBadge, { borderColor: isFilm ? theme.red : theme.gold }]}>
              <Text style={[s.typeText, { color: isFilm ? theme.redL : theme.goldL }]}>
                {isFilm ? 'Film' : 'TV Show'}
              </Text>
            </View>
            {genres.slice(0, 3).map(g => (
              <Text key={g} style={[s.genre, { color: theme.textMut }]}>{g}</Text>
            ))}
          </View>

          {media.runtime ? (
            <Text style={[s.runtime, { color: theme.textMut }]}>
              {Math.floor(media.runtime / 60)}h {media.runtime % 60}m
            </Text>
          ) : null}

          <View style={s.ratingsRow}>
            {avg_rating != null && (
              <View style={s.ratingBox}>
                <Text style={[s.avgRating, { color: theme.gold }]}>{Number(avg_rating).toFixed(1)}</Text>
                <Text style={[s.ratingLabel, { color: theme.textMut }]}>your avg</Text>
              </View>
            )}
            {media.tmdb_rating != null && (
              <View style={s.ratingBox}>
                <Text style={[s.tmdbRating, { color: theme.goldL }]}>{Number(media.tmdb_rating).toFixed(1)}</Text>
                <Text style={[s.ratingLabel, { color: theme.textMut }]}>
                  TMDB{media.vote_count ? ` (${(media.vote_count / 1000).toFixed(0)}k)` : ''}
                </Text>
              </View>
            )}
          </View>

        </View>
      </View>

      {/* Overview */}
      {media.overview ? (
        <Text style={[s.overview, { color: theme.textSub }]}>{media.overview}</Text>
      ) : null}

      {/* Cast */}
      {cast.length > 0 && (
        <View style={s.castBlock}>
          <Text style={[s.castHeader, { color: theme.textSub }]}>Cast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.castRow}>
            {cast.map(person => (
              <View key={person.id} style={s.castPill}>
                <View style={[s.castAvatar, { backgroundColor: theme.bg2 }]}>
                  {person.profile_path ? (
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w92${person.profile_path}` }}
                      style={s.castAvatarImg}
                    />
                  ) : (
                    <Text style={s.castAvatarFallback}>👤</Text>
                  )}
                </View>
                <Text style={[s.castName, { color: theme.textSub }]} numberOfLines={1}>{person.name}</Text>
                {person.character ? (
                  <Text style={[s.castChar, { color: theme.textMut }]} numberOfLines={1}>{person.character}</Text>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Streaming Providers */}
      <StreamingProviders
        streaming={providers.streaming}
        rent={providers.rent}
        buy={providers.buy}
        justWatchLink={providers.link}
        inTheatres={releaseStatus.inTheatres}
        comingSoonTheatres={releaseStatus.comingSoonTheatres}
        comingSoonStreaming={releaseStatus.comingSoonStreaming}
        theatreDate={releaseStatus.theatreDate}
        streamingDate={releaseStatus.streamingDate}
        title={media.title}
      />

      {/* Action Buttons */}
      <View style={s.actionRow}>
        {isUnreleased ? (
          <View style={[s.logBtn, s.unreleasedBtn, { borderColor: theme.border, backgroundColor: theme.bg2 }]}>
            <Ionicons name="time-outline" size={15} color={theme.textMut} />
            <Text style={[s.logBtnText, { color: theme.textMut }]}>Not released yet</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => router.push(`/log?tmdb_id=${media.tmdb_id}&type=${media.media_type || type}`)}
            style={[s.logBtn, { backgroundColor: theme.red }]}
          >
            <Text style={[s.logBtnText, { color: '#fff' }]}>+ Log Entry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={toggleWatchlist}
          disabled={wlLoading}
          style={[
            s.wlBtn,
            { backgroundColor: theme.bg2, borderColor: inWatchlist ? theme.gold : theme.text },
            inWatchlist && { backgroundColor: theme.gold + '20' },
          ]}
        >
          {wlLoading ? (
            <ActivityIndicator size="small" color={theme.gold} />
          ) : (
            <>
              <Ionicons
                name={inWatchlist ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={inWatchlist ? theme.gold : theme.textSub}
              />
              <Text style={[s.wlBtnText, { color: inWatchlist ? theme.gold : theme.textSub }]}>
                {inWatchlist ? 'Saved' : 'Watchlist'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          style={[s.shareIconBtn, { backgroundColor: theme.bg2, borderColor: theme.text }]}
          accessibilityLabel="Share"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={18} color={theme.textSub} />
        </TouchableOpacity>
      </View>

      {/* Entries */}
      <View style={s.entriesBlock}>
        <Text style={[s.entriesHeader, { color: theme.text, borderBottomColor: theme.text }]}>
          Your Entries <Text style={[s.entriesCount, { color: theme.textMut }]}>({entries.length})</Text>
        </Text>
        {entries.length === 0
          ? <Text style={[s.noEntries, { color: theme.textMut }]}>You haven't logged this yet.</Text>
          : entries.map((e, i) => (
            <View key={e.id} style={{ marginBottom: i < entries.length - 1 ? 12 : 0 }}>
              <EntryCard entry={e} onDelete={handleDelete} />
            </View>
          ))
        }
      </View>
    </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  flex:             { flex: 1 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backPill:         {
    position: 'absolute', left: 16, zIndex: 100,
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
  },
  backdrop:         { height: 200 },
  backdropEmpty:    { height: 24 },
  backdropOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.82)' },

  headerRow:        { flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 16 },
  posterWrap:       { position: 'relative' },
  poster:           { width: 110, height: 165, borderRadius: 6, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  posterRating:     { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  posterRatingText: { fontSize: 11, fontWeight: '700' },
  headerInfo:       { flex: 1 },
  mediaTitle:       { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  tagline:          { fontSize: 12, fontStyle: 'italic', marginTop: 3 },
  mediaYear:        { fontSize: 13, marginTop: 3 },
  metaRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  typeBadge:        { borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText:         { fontSize: 11, fontWeight: '700' },
  genre:            { fontSize: 11 },
  runtime:          { fontSize: 11, marginTop: 4 },
  ratingsRow:       { flexDirection: 'row', gap: 24, marginTop: 10, alignItems: 'flex-start' },
  ratingBox:        { alignItems: 'flex-start' },
  avgRating:        { fontSize: 22, fontWeight: '800' },
  tmdbRating:       { fontSize: 22, fontWeight: '800' },
  ratingLabel:      { fontSize: 10, marginTop: 2 },

  shareIconBtn:     { width: 44, height: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },

  overview:         { fontSize: 13, paddingHorizontal: 16, marginBottom: 16, lineHeight: 20 },

  castBlock:        { paddingHorizontal: 16, marginBottom: 20 },
  castHeader:       { fontSize: 13, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  castRow:          { gap: 12 },
  castPill:         { width: 72, alignItems: 'center' },
  castAvatar:       { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  castAvatarImg:    { width: 52, height: 52 },
  castAvatarFallback:{ fontSize: 22 },
  castName:         { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  castChar:         { fontSize: 9, textAlign: 'center', marginTop: 1 },

  actionRow:        { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 24, marginTop: 8 },
  logBtn:           {
    flex: 1, borderRadius: 6, paddingVertical: 13, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  logBtnText:       { fontWeight: '800', fontSize: 14 },
  unreleasedBtn:    { flexDirection: 'row', gap: 6, justifyContent: 'center', shadowOpacity: 0, elevation: 0 },
  wlBtn:            { flex: 1, borderRadius: 6, paddingVertical: 13, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 6, justifyContent: 'center' },
  wlBtnText:        { fontWeight: '700', fontSize: 13 },

  entriesBlock:     { paddingHorizontal: 16 },
  entriesHeader:    { fontSize: 16, fontWeight: '800', marginBottom: 12, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  entriesCount:     { fontWeight: '400', fontSize: 14 },
  noEntries:        { textAlign: 'center', paddingVertical: 32 },
})
