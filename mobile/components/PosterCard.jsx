import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { C } from '../constants/theme'

/**
 * Reusable poster card with TMDB rating badge on bottom-right.
 * Props:
 *   item     – { poster_url, tmdb_rating, title, year, media_type }
 *   width    – number (card width, height is 1.5× width)
 *   onPress  – function
 *   style    – optional extra container style
 */
export default function PosterCard({ item, width = 120, onPress, style }) {
  const height = Math.round(width * 1.5)

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[{ width }, style]}>
      <View style={[s.imageWrap, { width, height }]}>
        {item.poster_url ? (
          <Image
            source={{ uri: item.poster_url }}
            style={{ width, height }}
            resizeMode="cover"
          />
        ) : (
          <View style={[s.fallback, { width, height }]}>
            <Text style={s.fallbackEmoji}>🎬</Text>
          </View>
        )}

        {/* Type badge — top left */}
        <View style={[s.typeBadge, {
          backgroundColor: item.media_type === 'tv'
            ? 'rgba(100,70,0,0.85)'
            : 'rgba(140,15,15,0.85)',
        }]}>
          <Text style={s.typeText}>{item.media_type === 'tv' ? 'TV' : 'F'}</Text>
        </View>

        {/* Rating badge — bottom right */}
        {item.tmdb_rating != null && (
          <View style={s.ratingBadge}>
            <Text style={s.ratingText}>★ {Number(item.tmdb_rating).toFixed(1)}</Text>
          </View>
        )}
      </View>

      <Text style={[s.title, { width }]} numberOfLines={1}>{item.title}</Text>
      {item.year ? <Text style={s.year}>{item.year}</Text> : null}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  imageWrap:    { borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  fallback:     { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a' },
  fallbackEmoji:{ fontSize: 28 },
  typeBadge:    {
    position: 'absolute', top: 4, left: 4,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  typeText:     { fontSize: 10, fontWeight: '700', color: '#fff' },
  ratingBadge:  {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
  },
  ratingText:   { color: C.gold, fontSize: 11, fontWeight: '700' },
  title:        { color: C.textSub, fontSize: 11, marginTop: 5 },
  year:         { color: C.textMut, fontSize: 10 },
})
