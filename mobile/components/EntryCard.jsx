import { memo } from 'react'
import { View, Text, Image, TouchableOpacity, Pressable, StyleSheet, Share, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { StarDisplay } from './StarRating'
import { useTheme } from '../context/ThemeContext'

export default memo(function EntryCard({ entry, onDelete }) {
  const { media } = entry
  const router    = useRouter()
  const { theme } = useTheme()

  if (!media) return null  // guard against broken diary entry join

  const isFilm = media.media_type === 'film' || media.media_type === 'movie'

  async function handleShare() {
    const webUrl  = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://reelfeel.me'
    const typeSlug = isFilm ? 'movie' : 'tv'
    const url      = `${webUrl}/media/${media.tmdb_id}?type=${typeSlug}`
    const lines  = [
      `I watched ${media.title}${media.year ? ` (${media.year})` : ''} and rated it ${Number(entry.rating).toFixed(1)}/5 ⭐ on ReelFeel`,
      entry.review ? `"${entry.review}"` : null,
      url,
    ].filter(Boolean)
    try {
      await Share.share({ message: lines.join('\n') })
    } catch {
      Alert.alert('Share failed', 'Could not open the share sheet.')
    }
  }

  const nav = () => router.push(`/media/${media.tmdb_id}`)

  return (
    <Pressable
      onPress={nav}
      style={({ pressed }) => [s.card, {
        backgroundColor: pressed ? theme.bg2 : theme.bg1,
        borderColor: theme.text,
        shadowColor: theme.shadowColor,
        shadowOpacity: theme.shadowOpacity,
      }]}
    >
      {/* Poster */}
      {media.poster_url
        ? <Image source={{ uri: media.poster_url }} style={[s.poster, { borderColor: theme.text + '88' }]} resizeMode="cover" />
        : <View style={[s.poster, { backgroundColor: theme.bg2, borderColor: theme.text + '88', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 22 }}>🎬</Text>
          </View>
      }

      {/* Info */}
      <View style={s.info}>
        <View style={s.topRow}>
          <View style={s.titleBlock}>
            <Text style={[s.title, { color: theme.text }]} numberOfLines={1}>{media.title}</Text>
            <View style={s.metaRow}>
              {media.year ? <Text style={[s.year, { color: theme.textMut }]}>({media.year})</Text> : null}
              <View style={[s.typeBadge, { borderColor: isFilm ? theme.red + '88' : theme.gold + '66' }]}>
                <Text style={[s.typeText, { color: isFilm ? theme.redL : theme.goldL }]}>
                  {isFilm ? 'Film' : 'TV'}
                </Text>
              </View>
              {(entry.season_number || entry.episode_number) ? (
                <View style={[s.seBadge, { backgroundColor: theme.bg3 }]}>
                  <Text style={[s.seText, { color: theme.textSub }]}>
                    {entry.season_number  ? `S${entry.season_number}`  : ''}
                    {entry.episode_number ? `E${entry.episode_number}` : ''}
                  </Text>
                </View>
              ) : null}
              {entry.rewatch ? (
                <View style={[s.rewatchBadge, { borderColor: theme.gold + '66' }]}>
                  <Text style={[s.rewatchText, { color: theme.goldL }]}>rewatch</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={[s.date, { color: theme.textMut }]}>{entry.watched_on}</Text>
        </View>

        <View style={s.ratingRow}>
          <StarDisplay rating={entry.rating} />
          <Text style={[s.ratingNum, { color: theme.gold }]}>{Number(entry.rating).toFixed(1)}/5</Text>
        </View>

        {entry.emotions?.length > 0 && (
          <View style={s.emotionsRow}>
            {entry.emotions.map(e => (
              <View
                key={e.id}
                style={[s.emotionPill, { backgroundColor: e.color + '22', borderColor: e.color + '55' }]}
              >
                <Text style={[s.emotionText, { color: e.color }]}>{e.icon} {e.name}</Text>
              </View>
            ))}
          </View>
        )}

        {entry.review ? (
          <Text style={[s.review, { color: theme.textSub }]} numberOfLines={2}>"{entry.review}"</Text>
        ) : null}
      </View>

      {/* Actions */}
      {onDelete && (
        <View style={s.actions}>
          <TouchableOpacity
            onPress={() => router.push(`/log?edit=${entry.id}`)}
            style={[s.actionBtn, { backgroundColor: theme.bg2, borderColor: theme.text }]}
            accessibilityLabel="Edit entry"
            accessibilityRole="button"
          >
            <Ionicons name="pencil-outline" size={14} color={theme.textMut} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(entry.id)}
            style={[s.actionBtn, { backgroundColor: theme.red + '1e', borderColor: theme.red + '55' }]}
            accessibilityLabel="Delete entry"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={14} color={theme.red} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={[s.actionBtn, { backgroundColor: theme.bg2, borderColor: theme.text }]}
            accessibilityLabel="Share entry"
            accessibilityRole="button"
          >
            <Ionicons name="share-social-outline" size={14} color={theme.textMut} />
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  )
})

const s = StyleSheet.create({
  card:         {
    borderRadius: 6, flexDirection: 'row', gap: 12, padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
    elevation: 2,
  },
  poster:       { width: 56, height: 80, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  info:         { flex: 1, minWidth: 0 },
  topRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titleBlock:   { flex: 1, minWidth: 0 },
  title:        { fontWeight: '800', fontSize: 14 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  year:         { fontSize: 11 },
  typeBadge:    { borderWidth: StyleSheet.hairlineWidth, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  typeText:     { fontSize: 10, fontWeight: '800' },
  seBadge:      { borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  seText:       { fontSize: 10, fontWeight: '800', fontFamily: 'monospace' },
  rewatchBadge: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 },
  rewatchText:  { fontSize: 10, fontWeight: '700' },
  date:         { fontSize: 11, flexShrink: 0 },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  ratingNum:    { fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  emotionsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  emotionPill:  { borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  emotionText:  { fontSize: 11, fontWeight: '700' },
  review:       { fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  actions:      { justifyContent: 'flex-start', gap: 4, flexShrink: 0 },
  actionBtn:    { width: 40, height: 40, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
})
