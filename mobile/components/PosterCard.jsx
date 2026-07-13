import { memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

/**
 * Reusable poster card with:
 * - TMDB rating badge on bottom-right
 * - Watch state indicator on bottom-left: ✔ watched, ♥ liked, ★ rated, 🕒 watchlist
 * - Type badge on top-left
 * - onLongPress support for context menus
 *
 * Props:
 *   item       – { poster_url, tmdb_rating, title, year, media_type }
 *   width      – number (card width, height = 1.5× width)
 *   onPress    – function
 *   onLongPress– function (optional)
 *   watchState – { watched, liked, rated, inWatchlist } (optional)
 *   style      – optional extra container style
 */
function PosterCard({ item, width = 120, onPress, onLongPress, watchState, comingSoon = false, reason = null, style, userRating = null }) {
  const { theme } = useTheme()
  const height    = Math.round(width * 1.5)
  const isFilm    = item.media_type === 'film' || item.media_type === 'movie'

  // Most-important watch state badge
  let stateIcon = null
  let stateBg   = 'rgba(0,0,0,0.75)'
  if (watchState?.watched && watchState?.liked) {
    stateIcon = <Ionicons name="heart" size={10} color="#ec4899" />
    stateBg   = 'rgba(30,0,20,0.85)'
  } else if (watchState?.watched) {
    stateIcon = <Ionicons name="checkmark" size={11} color="#22c55e" />
    stateBg   = 'rgba(0,30,10,0.85)'
  } else if (watchState?.rated) {
    stateIcon = <Ionicons name="star" size={10} color={theme.gold} />
    stateBg   = 'rgba(20,15,0,0.85)'
  } else if (watchState?.inWatchlist) {
    stateIcon = <Ionicons name="bookmark" size={10} color={theme.gold} />
    stateBg   = 'rgba(20,15,0,0.85)'
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.82}
      delayLongPress={350}
      style={[{ width }, style]}
      accessibilityLabel={item.title}
      accessibilityRole="button"
    >
      <View style={[s.imageWrap, { width, height, borderColor: theme.text, shadowColor: theme.shadowColor, shadowOpacity: theme.shadowOpacity }]}>
        {item.poster_url ? (
          <Image source={item.poster_url} style={{ width, height }} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[s.fallback, { width, height, backgroundColor: theme.bg2 }]}>
            <Text style={s.fallbackEmoji}>🎬</Text>
          </View>
        )}

        {/* Type badge — top left */}
        <View style={[s.typeBadge, { backgroundColor: isFilm ? 'rgba(140,15,15,0.85)' : 'rgba(100,70,0,0.85)' }]}>
          <Text style={s.typeText}>{isFilm ? 'Film' : 'TV'}</Text>
        </View>

        {/* Coming Soon indicator — top right: blue dot, details in search chip */}
        {comingSoon && <View style={s.comingSoonBadge} />}

        {/* Rating badge — bottom right: user rating when available, else TMDB */}
        {(userRating != null || item.tmdb_rating != null) && (
          <View style={s.ratingBadge}>
            <Ionicons name="star" size={9} color={theme.gold} />
            <Text style={[s.ratingText, { color: theme.gold }]}>
              {userRating != null ? Number(userRating).toFixed(1) : Number(item.tmdb_rating).toFixed(1)}
            </Text>
          </View>
        )}

        {/* Watch state — bottom left */}
        {stateIcon && (
          <View style={[s.stateBadge, { backgroundColor: stateBg }]}>
            {stateIcon}
          </View>
        )}
      </View>

      <Text style={[s.title, { width, color: theme.textSub }]} numberOfLines={1}>{item.title}</Text>
      {item.year ? <Text style={[s.year, { color: theme.textMut }]}>{item.year}</Text> : null}
      {reason ? <Text style={[s.reason, { width, color: theme.textMut }]} numberOfLines={2}>{reason}</Text> : null}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  imageWrap:    {
    borderRadius: 4, overflow: 'hidden', backgroundColor: '#1a1a1a',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6,
    elevation: 2,
  },
  fallback:     { alignItems: 'center', justifyContent: 'center' },
  fallbackEmoji:{ fontSize: 28 },
  typeBadge:    { position: 'absolute', top: 4, left: 4, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  typeText:     { fontSize: 10, fontWeight: '800', color: '#fff' },
  ratingBadge:  {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 3, paddingHorizontal: 5, paddingVertical: 3,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  ratingText:   { fontSize: 10, fontWeight: '800' },
  stateBadge:   {
    position: 'absolute', bottom: 6, left: 6,
    borderRadius: 3, width: 22, height: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  title:           { fontSize: 11, marginTop: 5, fontWeight: '600' },
  year:            { fontSize: 10 },
  reason:          { fontSize: 10, marginTop: 3, fontWeight: '600', letterSpacing: 0.1 },
  comingSoonBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(212,175,55,0.9)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
})

export default memo(PosterCard)
