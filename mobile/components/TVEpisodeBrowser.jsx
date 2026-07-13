import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  Image, ActivityIndicator, StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getTVSeasons, getTVEpisodes } from '../lib/tmdb'
import { useTheme } from '../context/ThemeContext'

export default function TVEpisodeBrowser({ tmdbId, seasonNumber, episodeNumber, onSelect }) {
  const { theme } = useTheme()

  const [seasons,         setSeasons]         = useState([])
  const [episodes,        setEpisodes]        = useState([])
  const [activeSeason,    setActiveSeason]    = useState(seasonNumber ? Number(seasonNumber) : null)
  const [loadingSeasons,  setLoadingSeasons]  = useState(true)
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [seasonOpen,      setSeasonOpen]      = useState(false)
  const [episodeOpen,     setEpisodeOpen]     = useState(false)

  useEffect(() => {
    getTVSeasons(tmdbId)
      .then(setSeasons)
      .catch(() => setSeasons([]))
      .finally(() => setLoadingSeasons(false))
  }, [tmdbId])

  useEffect(() => {
    if (!activeSeason) { setEpisodes([]); return }
    setLoadingEpisodes(true)
    getTVEpisodes(tmdbId, activeSeason)
      .then(setEpisodes)
      .catch(() => setEpisodes([]))
      .finally(() => setLoadingEpisodes(false))
  }, [tmdbId, activeSeason])

  function pickSeason(sn) {
    setActiveSeason(sn)
    setSeasonOpen(false)
    onSelect(sn, null)
  }

  function pickEpisode(ep) {
    setEpisodeOpen(false)
    onSelect(activeSeason, ep.episode_number)
  }

  function clear() {
    setActiveSeason(null)
    setEpisodes([])
    onSelect(null, null)
  }

  const selSn = seasonNumber  ? Number(seasonNumber)  : null
  const selEp = episodeNumber ? Number(episodeNumber) : null

  const activeSeasonObj  = seasons.find(s => s.season_number === activeSeason)
  const selectedEpisode  = episodes.find(e => e.episode_number === selEp)

  if (loadingSeasons) {
    return (
      <View style={[s.placeholder, { backgroundColor: theme.bg2 }]}>
        <ActivityIndicator size="small" color={theme.gold} />
        <Text style={[s.placeholderText, { color: theme.textMut }]}>Loading seasons…</Text>
      </View>
    )
  }

  if (!seasons.length) return null

  const seasonLabel  = activeSeasonObj ? activeSeasonObj.name : 'Select season'
  const episodeLabel = selectedEpisode
    ? `E${selectedEpisode.episode_number} — ${selectedEpisode.name}`
    : activeSeason ? 'Select episode' : null

  return (
    <View style={s.row}>
      {/* Season dropdown */}
      <TouchableOpacity
        style={[s.dropdown, { backgroundColor: theme.bg2, borderColor: activeSeason ? theme.gold : theme.text }]}
        onPress={() => setSeasonOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[s.dropdownText, { color: activeSeason ? theme.gold : theme.textMut }]} numberOfLines={1}>
          {seasonLabel}
        </Text>
        <Ionicons name="chevron-down" size={14} color={activeSeason ? theme.gold : theme.textMut} />
      </TouchableOpacity>

      {/* Episode dropdown — only shown once a season is picked */}
      {activeSeason != null && (
        <TouchableOpacity
          style={[s.dropdown, { backgroundColor: theme.bg2, borderColor: selEp ? theme.gold : theme.text }]}
          onPress={() => setEpisodeOpen(true)}
          activeOpacity={0.8}
          disabled={loadingEpisodes}
        >
          {loadingEpisodes ? (
            <ActivityIndicator size="small" color={theme.gold} style={{ flex: 1 }} />
          ) : (
            <>
              <Text style={[s.dropdownText, { color: selEp ? theme.gold : theme.textMut }]} numberOfLines={1}>
                {episodeLabel ?? 'Select episode'}
              </Text>
              <Ionicons name="chevron-down" size={14} color={selEp ? theme.gold : theme.textMut} />
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Clear button */}
      {(activeSeason != null) && (
        <TouchableOpacity onPress={clear} style={[s.clearBtn, { borderColor: theme.text }]} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color={theme.textMut} />
        </TouchableOpacity>
      )}

      {/* Season picker modal */}
      <DropdownModal
        visible={seasonOpen}
        onClose={() => setSeasonOpen(false)}
        title="Select Season"
        theme={theme}
      >
        {seasons.map(sn => (
          <TouchableOpacity
            key={sn.season_number}
            style={[s.option, { borderBottomColor: theme.border }]}
            onPress={() => pickSeason(sn.season_number)}
            activeOpacity={0.75}
          >
            {sn.poster_url ? (
              <Image source={{ uri: sn.poster_url }} style={[s.seasonThumb, { borderColor: theme.border }]} resizeMode="cover" />
            ) : (
              <View style={[s.seasonThumb, { backgroundColor: theme.bg3, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 10, color: theme.textMut }}>S{sn.season_number}</Text>
              </View>
            )}
            <Text style={[s.optionText, { color: activeSeason === sn.season_number ? theme.gold : theme.text, flex: 1 }]}>
              {sn.name}
            </Text>
            <Text style={[s.optionMeta, { color: theme.textMut }]}>{sn.episode_count} eps</Text>
            {activeSeason === sn.season_number && (
              <Ionicons name="checkmark" size={16} color={theme.gold} />
            )}
          </TouchableOpacity>
        ))}
      </DropdownModal>

      {/* Episode picker modal */}
      <DropdownModal
        visible={episodeOpen}
        onClose={() => setEpisodeOpen(false)}
        title={`${activeSeasonObj?.name ?? 'Season'} — Episodes`}
        theme={theme}
      >
        {episodes.map(ep => (
          <TouchableOpacity
            key={ep.episode_number}
            style={[s.option, { borderBottomColor: theme.border }]}
            onPress={() => pickEpisode(ep)}
            activeOpacity={0.75}
          >
            {ep.still_url ? (
              <Image source={{ uri: ep.still_url }} style={[s.episodeThumb, { borderColor: theme.border }]} resizeMode="cover" />
            ) : (
              <View style={[s.episodeThumb, { backgroundColor: theme.bg3, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 10, color: theme.textMut }}>E{ep.episode_number}</Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.optionNum, { color: theme.textMut }]}>E{ep.episode_number}{ep.runtime ? `  ·  ${ep.runtime}m` : ''}</Text>
              <Text style={[s.optionText, { color: selEp === ep.episode_number ? theme.gold : theme.text }]} numberOfLines={1}>
                {ep.name}
              </Text>
            </View>
            {selEp === ep.episode_number && (
              <Ionicons name="checkmark" size={16} color={theme.gold} />
            )}
          </TouchableOpacity>
        ))}
      </DropdownModal>
    </View>
  )
}

function DropdownModal({ visible, onClose, title, theme, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[s.sheet, { backgroundColor: theme.bg1, borderTopColor: theme.text }]}>
        <View style={[s.sheetHeader, { borderBottomColor: theme.text }]}>
          <Text style={[s.sheetTitle, { color: theme.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={theme.textMut} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={[children].flat()}
          renderItem={({ item }) => item}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  row:           { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dropdown:      {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 12,
    gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  dropdownText:  { flex: 1, fontSize: 13, fontWeight: '600' },
  clearBtn:      { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  placeholder:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 6, padding: 12 },
  placeholderText:{ fontSize: 13 },

  backdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:         { maxHeight: '70%', borderTopWidth: StyleSheet.hairlineWidth, borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingTop: 0 },
  sheetHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetTitle:    { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },

  option:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  seasonThumb:   { width: 36, height: 54, borderRadius: 3, borderWidth: 1 },
  episodeThumb:  { width: 80, height: 48, borderRadius: 3, borderWidth: 1, flexShrink: 0 },
  optionNum:     { fontSize: 12, fontWeight: '700', width: 32 },
  optionText:    { fontSize: 14, fontWeight: '600' },
  optionMeta:    { fontSize: 11 },
})
