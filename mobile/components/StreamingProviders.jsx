import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native'
import * as Linking from 'expo-linking'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

// Universal Links — iOS opens the app if installed, Safari otherwise
const PROVIDER_URLS = {
  8:   'https://www.netflix.com',
  9:   'https://www.amazon.com/gp/video',
  337: 'https://www.disneyplus.com',
  15:  'https://www.hulu.com',
  384: 'https://www.max.com',
  2:   'https://tv.apple.com',
  387: 'https://www.peacocktv.com',
  531: 'https://www.paramountplus.com',
  283: 'https://www.crunchyroll.com',
  300: 'https://tubitv.com',
  43:  'https://www.starz.com',
  37:  'https://www.sho.com',
}

function justWatchFallback(title, justWatchLink) {
  if (justWatchLink) return justWatchLink
  return `https://www.justwatch.com/us/search?q=${encodeURIComponent(title || '')}`
}

const PROVIDER_NAME_KEYWORDS = {
  netflix:      'https://www.netflix.com',
  prime:        'https://www.amazon.com/gp/video',
  amazon:       'https://www.amazon.com/gp/video',
  disney:       'https://www.disneyplus.com',
  hulu:         'https://www.hulu.com',
  'apple tv':   'https://tv.apple.com',
  peacock:      'https://www.peacocktv.com',
  paramount:    'https://www.paramountplus.com',
  crunchyroll:  'https://www.crunchyroll.com',
  tubi:         'https://tubitv.com',
  starz:        'https://www.starz.com',
  showtime:     'https://www.sho.com',
  max:          'https://www.max.com',
}

function resolveProviderUrl(provider) {
  if (PROVIDER_URLS[provider.id]) return PROVIDER_URLS[provider.id]
  const name = (provider.name ?? '').toLowerCase()
  for (const [keyword, url] of Object.entries(PROVIDER_NAME_KEYWORDS)) {
    if (name.includes(keyword)) return url
  }
  return null
}

async function openProvider(provider, title, justWatchLink) {
  const url = resolveProviderUrl(provider) ?? justWatchFallback(title, justWatchLink)
  try {
    await Linking.openURL(url)
  } catch (_) {
    await Linking.openURL(justWatchFallback(title, justWatchLink))
  }
}

export default function StreamingProviders({
  streaming = [], rent = [], buy = [],
  justWatchLink = null,
  inTheatres = false,
  comingSoonTheatres = false,
  comingSoonStreaming = false,
  theatreDate = null,
  streamingDate = null,
  title = '',
}) {
  const { theme } = useTheme()

  if (!streaming.length && !rent.length && !buy.length && !inTheatres && !comingSoonTheatres && !comingSoonStreaming) return null

  function formatDate(iso) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function buyTickets() {
    const q = encodeURIComponent(title)
    Linking.openURL(`https://www.fandango.com/search?q=${q}`)
  }

  function ProviderLogo({ p }) {
    return (
      <TouchableOpacity
        onPress={() => openProvider(p, title, justWatchLink)}
        style={s.provider}
        activeOpacity={0.7}
      >
        {p.logo_url ? (
          <Image source={{ uri: p.logo_url }} style={s.logo} resizeMode="cover" />
        ) : (
          <View style={[s.logoFallback, { backgroundColor: theme.bg3 }]}>
            <Text style={[s.logoFallbackText, { color: theme.textSub }]}>
              {p.name?.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[s.providerName, { color: theme.textMut }]} numberOfLines={1}>
          {p.name?.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    )
  }

  function Row({ label, items }) {
    if (!items.length) return null
    return (
      <View style={s.row}>
        <Text style={[s.rowLabel, { color: theme.textMut }]}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {items.map(p => <ProviderLogo key={p.id} p={p} />)}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={[s.container, { borderTopColor: theme.border }]}>
      <View style={s.headerRow}>
        <Text style={[s.header, { color: theme.textSub }]}>Where to Watch</Text>
        {(justWatchLink || title) && (
          <TouchableOpacity
            onPress={() => Linking.openURL(justWatchFallback(title, justWatchLink))}
            activeOpacity={0.7}
          >
            <Text style={[s.justWatch, { color: theme.textMut }]}>More options →</Text>
          </TouchableOpacity>
        )}
      </View>
      {inTheatres && (
        <View style={s.theatreBlock}>
          <View style={[s.theatreRow, { backgroundColor: theme.bg2, borderColor: theme.gold }]}>
            <Text style={s.theatreEmoji}>🎟</Text>
            <Text style={[s.theatreText, { color: theme.gold }]}>Now in Theatres</Text>
          </View>
          <TouchableOpacity
            onPress={buyTickets}
            style={[s.ticketBtn, { backgroundColor: theme.gold, borderColor: '#000' }]}
            activeOpacity={0.8}
          >
            <Ionicons name="ticket-outline" size={15} color="#000" />
            <Text style={s.ticketBtnText}>Buy Tickets</Text>
          </TouchableOpacity>
        </View>
      )}
      {comingSoonTheatres && !inTheatres && (
        <View style={s.comingSoonBlock}>
          <View style={[s.comingSoonRow, { backgroundColor: theme.bg2, borderColor: theme.info ?? '#3b82f6' }]}>
            <Text style={s.comingSoonEmoji}>📅</Text>
            <View>
              <Text style={[s.comingSoonText, { color: theme.info ?? '#3b82f6' }]}>Coming Soon to Theatres</Text>
              {formatDate(theatreDate) && (
                <Text style={[s.comingSoonDate, { color: theme.textMut }]}>{formatDate(theatreDate)}</Text>
              )}
            </View>
          </View>
        </View>
      )}
      {comingSoonStreaming && (
        <View style={s.comingSoonBlock}>
          <View style={[s.comingSoonRow, { backgroundColor: theme.bg2, borderColor: theme.violet ?? '#8b5cf6' }]}>
            <Text style={s.comingSoonEmoji}>🎞</Text>
            <View>
              <Text style={[s.comingSoonText, { color: theme.violet ?? '#8b5cf6' }]}>Coming Soon to Streaming</Text>
              {formatDate(streamingDate) && (
                <Text style={[s.comingSoonDate, { color: theme.textMut }]}>{formatDate(streamingDate)}</Text>
              )}
            </View>
          </View>
        </View>
      )}
      <Row label="Stream"  items={streaming} />
      <Row label="Rent"    items={rent} />
      <Row label="Buy"     items={buy} />
    </View>
  )
}

const s = StyleSheet.create({
  container:       { paddingTop: 16, marginBottom: 8 },
  headerRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  header:          { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  justWatch:       { fontSize: 12, fontWeight: '600' },
  theatreBlock:    { marginHorizontal: 16, marginBottom: 12, gap: 8 },
  theatreRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  theatreEmoji:    { fontSize: 16 },
  theatreText:     { fontSize: 13, fontWeight: '800' },
  ticketBtn:       {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12, borderRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  ticketBtnText:   { fontSize: 14, fontWeight: '800', color: '#000' },
  comingSoonBlock: { marginHorizontal: 16, marginBottom: 12 },
  comingSoonRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  comingSoonEmoji: { fontSize: 16 },
  comingSoonText:  { fontSize: 13, fontWeight: '800' },
  comingSoonDate:  { fontSize: 11, marginTop: 2 },
  row:             { marginBottom: 12, paddingHorizontal: 16 },
  rowLabel:        { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  scroll:          { gap: 12 },
  provider:        { alignItems: 'center', width: 56 },
  logo:            { width: 44, height: 44, borderRadius: 6 },
  logoFallback:    { width: 44, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  logoFallbackText:{ fontSize: 14, fontWeight: '800' },
  providerName:    { fontSize: 9, marginTop: 4, textAlign: 'center', width: 56 },
})
