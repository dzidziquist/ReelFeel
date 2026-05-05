import { View, Text, ScrollView, Image, TouchableOpacity, Linking, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

/**
 * Horizontal row of streaming platform logos.
 *
 * Props:
 *   streaming  – [{ id, name, logo_url }]  (flatrate/subscription services)
 *   rent       – [{ id, name, logo_url }]  (optional)
 *   buy        – [{ id, name, logo_url }]  (optional)
 *   inTheatres – boolean
 *   title      – string (used for ticket search link)
 */
export default function StreamingProviders({ streaming = [], rent = [], buy = [], inTheatres = false, title = '' }) {
  const { theme } = useTheme()

  if (!streaming.length && !rent.length && !buy.length && !inTheatres) return null

  function buyTickets() {
    const q = encodeURIComponent(title)
    Linking.openURL(`https://www.fandango.com/search?q=${q}`)
  }

  function ProviderLogo({ p }) {
    return (
      <View style={s.provider}>
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
      </View>
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
      <Text style={[s.header, { color: theme.textSub }]}>Where to Watch</Text>
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
      <Row label="Stream"  items={streaming} />
      <Row label="Rent"    items={rent} />
      <Row label="Buy"     items={buy} />
    </View>
  )
}

const s = StyleSheet.create({
  container:       { paddingTop: 16, marginBottom: 8 },
  header:          { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, paddingHorizontal: 16 },
  theatreBlock:    { marginHorizontal: 16, marginBottom: 12, gap: 8 },
  theatreRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 4, borderWidth: 2 },
  theatreEmoji:    { fontSize: 16 },
  theatreText:     { fontSize: 13, fontWeight: '800' },
  ticketBtn:       {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: 12, borderRadius: 4, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.8, shadowRadius: 0, elevation: 3,
  },
  ticketBtnText:   { fontSize: 14, fontWeight: '800', color: '#000' },
  row:             { marginBottom: 12, paddingHorizontal: 16 },
  rowLabel:        { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  scroll:          { gap: 12 },
  provider:        { alignItems: 'center', width: 56 },
  logo:            { width: 44, height: 44, borderRadius: 6 },
  logoFallback:    { width: 44, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  logoFallbackText:{ fontSize: 14, fontWeight: '800' },
  providerName:    { fontSize: 9, marginTop: 4, textAlign: 'center', width: 56 },
})
