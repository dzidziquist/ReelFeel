import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { StarDisplay } from './StarRating'
import { C } from '../constants/theme'

export default function EntryCard({ entry, onDelete }) {
  const { media } = entry
  const router    = useRouter()

  return (
    <View style={s.card}>
      {/* Poster */}
      <TouchableOpacity onPress={() => router.push(`/media/${media.tmdb_id}`)}>
        {media.poster_url
          ? <Image source={{ uri: media.poster_url }} style={s.poster} resizeMode="cover" />
          : <View style={[s.poster, s.posterFallback]}><Text style={{ fontSize: 22 }}>🎬</Text></View>
        }
      </TouchableOpacity>

      {/* Info */}
      <View style={s.info}>
        <View style={s.topRow}>
          <View style={s.titleBlock}>
            <TouchableOpacity onPress={() => router.push(`/media/${media.tmdb_id}`)}>
              <Text style={s.title} numberOfLines={1}>{media.title}</Text>
            </TouchableOpacity>
            <View style={s.metaRow}>
              {media.year ? <Text style={s.year}>({media.year})</Text> : null}
              <View style={[s.typeBadge, { borderColor: media.media_type === 'film' ? '#5c1414' : '#4a3800' }]}>
                <Text style={[s.typeText, { color: media.media_type === 'film' ? C.redL : C.goldL }]}>
                  {media.media_type === 'film' ? 'Film' : 'TV'}
                </Text>
              </View>
              {entry.rewatch ? (
                <View style={s.rewatchBadge}>
                  <Text style={s.rewatchText}>rewatch</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={s.date}>{entry.watched_on}</Text>
        </View>

        <View style={s.ratingRow}>
          <StarDisplay rating={entry.rating} />
          <Text style={s.ratingNum}>{entry.rating}/5</Text>
        </View>

        {entry.emotions.length > 0 && (
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
          <Text style={s.review} numberOfLines={2}>"{entry.review}"</Text>
        ) : null}
      </View>

      {/* Actions */}
      {onDelete && (
        <View style={s.actions}>
          <TouchableOpacity onPress={() => router.push(`/log?edit=${entry.id}`)}>
            <Text style={s.editBtn}>edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(entry.id)}>
            <Text style={s.deleteBtn}>del</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card:         { backgroundColor: C.bg1, borderRadius: 12, flexDirection: 'row', gap: 12, padding: 12 },
  poster:       { width: 56, height: 80, borderRadius: 8 },
  posterFallback:{ backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },
  info:         { flex: 1, minWidth: 0 },
  topRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titleBlock:   { flex: 1, minWidth: 0 },
  title:        { color: C.text, fontWeight: '600', fontSize: 14 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' },
  year:         { color: C.textMut, fontSize: 11 },
  typeBadge:    { borderWidth: 1, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  typeText:     { fontSize: 10 },
  rewatchBadge: { borderWidth: 1, borderColor: '#4a3800', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  rewatchText:  { color: C.goldL, fontSize: 10 },
  date:         { color: C.textMut, fontSize: 11, flexShrink: 0 },
  ratingRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  ratingNum:    { color: C.gold, fontFamily: 'monospace', fontSize: 13 },
  emotionsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  emotionPill:  { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  emotionText:  { fontSize: 11, fontWeight: '600' },
  review:       { color: C.textSub, fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  actions:      { justifyContent: 'flex-start', gap: 8, flexShrink: 0 },
  editBtn:      { color: C.textMut, fontSize: 11 },
  deleteBtn:    { color: C.red, fontSize: 11 },
})
