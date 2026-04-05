import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getTVSeasons, getTVEpisodes } from '../lib/tmdb'
import { useTheme } from '../context/ThemeContext'

/**
 * Interactive TV season → episode browser.
 *
 * Props:
 *   tmdbId          – TMDB series ID (number)
 *   seasonNumber    – currently selected season (string or null)
 *   episodeNumber   – currently selected episode (string or null)
 *   onSelect        – (season: number|null, episode: number|null) => void
 */
export default function TVEpisodeBrowser({ tmdbId, seasonNumber, episodeNumber, onSelect }) {
  const { theme } = useTheme()

  const [seasons,         setSeasons]         = useState([])
  const [episodes,        setEpisodes]        = useState([])
  const [activeSeason,    setActiveSeason]    = useState(seasonNumber ? Number(seasonNumber) : null)
  const [loadingSeasons,  setLoadingSeasons]  = useState(true)
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)

  // Load season list once
  useEffect(() => {
    setLoadingSeasons(true)
    getTVSeasons(tmdbId)
      .then(setSeasons)
      .catch(() => setSeasons([]))
      .finally(() => setLoadingSeasons(false))
  }, [tmdbId])

  // Load episodes whenever active season changes
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
    setEpisodes([])
    onSelect(sn, null)
  }

  function pickEpisode(ep) {
    onSelect(activeSeason, ep.episode_number)
  }

  function clearSelection() {
    setActiveSeason(null)
    setEpisodes([])
    onSelect(null, null)
  }

  const selEp  = episodeNumber ? Number(episodeNumber) : null
  const selSn  = seasonNumber  ? Number(seasonNumber)  : null

  // ── Selected summary bar ─────────────────────────────────────
  if (selSn && selEp) {
    const ep   = episodes.find(e => e.episode_number === selEp)
    const snObj = seasons.find(s => s.season_number === selSn)
    return (
      <View style={[s.selectedBar, { backgroundColor: theme.bg2, borderColor: theme.gold + '66' }]}>
        {ep?.still_url ? (
          <Image source={{ uri: ep.still_url }} style={s.selectedStill} resizeMode="cover" />
        ) : (
          <View style={[s.selectedStill, { backgroundColor: theme.bg3, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="tv-outline" size={22} color={theme.textMut} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.selectedLabel, { color: theme.gold }]}>
            S{selSn} E{selEp}
          </Text>
          {ep?.name ? <Text style={[s.selectedEpName, { color: theme.text }]} numberOfLines={1}>{ep.name}</Text> : null}
          {snObj?.name ? <Text style={[s.selectedSnName, { color: theme.textMut }]}>{snObj.name}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => { setActiveSeason(selSn); onSelect(selSn, null) }} style={s.changeBtn}>
          <Text style={[s.changeBtnText, { color: theme.gold }]}>Change</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearSelection} style={s.clearBtn}>
          <Ionicons name="close-circle" size={20} color={theme.textMut} />
        </TouchableOpacity>
      </View>
    )
  }

  // ── Loading seasons ──────────────────────────────────────────
  if (loadingSeasons) {
    return (
      <View style={[s.placeholder, { backgroundColor: theme.bg2 }]}>
        <ActivityIndicator size="small" color={theme.gold} />
        <Text style={[s.placeholderText, { color: theme.textMut }]}>Loading seasons…</Text>
      </View>
    )
  }

  if (!seasons.length) return null

  // ── Season picker ────────────────────────────────────────────
  return (
    <View>
      <Text style={[s.sectionHint, { color: theme.textMut }]}>
        {activeSeason ? `Season ${activeSeason} — tap an episode` : 'Select a season'}
      </Text>

      {/* Season horizontal scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.seasonRow}>
        {seasons.map(sn => {
          const active = activeSeason === sn.season_number
          return (
            <TouchableOpacity
              key={sn.season_number}
              onPress={() => pickSeason(sn.season_number)}
              activeOpacity={0.75}
              style={[
                s.seasonCard,
                { borderColor: active ? theme.gold : theme.border, backgroundColor: active ? theme.gold + '18' : theme.bg2 },
              ]}
            >
              {sn.poster_url ? (
                <Image source={{ uri: sn.poster_url }} style={s.seasonPoster} resizeMode="cover" />
              ) : (
                <View style={[s.seasonPoster, { backgroundColor: theme.bg3, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[s.seasonNoText, { color: theme.textMut }]}>S{sn.season_number}</Text>
                </View>
              )}
              <Text style={[s.seasonName, { color: active ? theme.gold : theme.text }]} numberOfLines={1}>
                {sn.name}
              </Text>
              <Text style={[s.seasonEpCount, { color: theme.textMut }]}>{sn.episode_count} eps</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Episode list */}
      {activeSeason && (
        <View style={s.episodeList}>
          {loadingEpisodes ? (
            <View style={[s.placeholder, { backgroundColor: theme.bg2, marginTop: 8 }]}>
              <ActivityIndicator size="small" color={theme.gold} />
              <Text style={[s.placeholderText, { color: theme.textMut }]}>Loading episodes…</Text>
            </View>
          ) : (
            episodes.map(ep => {
              const active = selEp === ep.episode_number && selSn === activeSeason
              return (
                <TouchableOpacity
                  key={ep.episode_number}
                  onPress={() => pickEpisode(ep)}
                  activeOpacity={0.75}
                  style={[
                    s.episodeRow,
                    { backgroundColor: active ? theme.gold + '18' : theme.bg2, borderColor: active ? theme.gold : theme.border },
                  ]}
                >
                  {ep.still_url ? (
                    <Image source={{ uri: ep.still_url }} style={s.episodeStill} resizeMode="cover" />
                  ) : (
                    <View style={[s.episodeStill, { backgroundColor: theme.bg3, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={[s.episodeNoFallback, { color: theme.textMut }]}>E{ep.episode_number}</Text>
                    </View>
                  )}
                  <View style={s.episodeInfo}>
                    <View style={s.episodeTopRow}>
                      <Text style={[s.episodeNum, { color: active ? theme.gold : theme.textMut }]}>E{ep.episode_number}</Text>
                      {ep.runtime ? <Text style={[s.episodeRuntime, { color: theme.textMut }]}>{ep.runtime}m</Text> : null}
                      {ep.vote_average > 0 ? (
                        <View style={s.episodeRating}>
                          <Ionicons name="star" size={10} color={theme.gold} />
                          <Text style={[s.episodeRatingText, { color: theme.gold }]}>{ep.vote_average.toFixed(1)}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[s.episodeName, { color: active ? theme.text : theme.textSub }]} numberOfLines={1}>
                      {ep.name}
                    </Text>
                    {ep.air_date ? (
                      <Text style={[s.episodeDate, { color: theme.textMut }]}>{ep.air_date}</Text>
                    ) : null}
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={18} color={theme.gold} style={{ alignSelf: 'center' }} />}
                </TouchableOpacity>
              )
            })
          )}
        </View>
      )}
    </View>
  )
}

const SEASON_W = 90
const STILL_W  = 80
const STILL_H  = 45

const s = StyleSheet.create({
  // Selected summary
  selectedBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 10 },
  selectedStill:   { width: 64, height: 40, borderRadius: 6 },
  selectedLabel:   { fontSize: 13, fontWeight: '800' },
  selectedEpName:  { fontSize: 13, fontWeight: '500', marginTop: 1 },
  selectedSnName:  { fontSize: 11, marginTop: 1 },
  changeBtn:       { paddingHorizontal: 8 },
  changeBtnText:   { fontSize: 12, fontWeight: '600' },
  clearBtn:        { padding: 2 },

  // Placeholder / loading
  placeholder:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12 },
  placeholderText: { fontSize: 13 },

  sectionHint:     { fontSize: 11, fontWeight: '600', marginBottom: 10 },

  // Season row
  seasonRow:       { gap: 8, paddingBottom: 4 },
  seasonCard:      { width: SEASON_W, borderRadius: 10, borderWidth: 1.5, overflow: 'hidden' },
  seasonPoster:    { width: SEASON_W, height: Math.round(SEASON_W * 1.5), },
  seasonName:      { fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingTop: 4 },
  seasonEpCount:   { fontSize: 9, paddingHorizontal: 6, paddingBottom: 6 },
  seasonNoText:    { fontSize: 16, fontWeight: '800' },

  // Episode list
  episodeList:     { gap: 6, marginTop: 8 },
  episodeRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 10, borderWidth: 1, padding: 8 },
  episodeStill:    { width: STILL_W, height: STILL_H, borderRadius: 6 },
  episodeNoFallback:{ fontSize: 12, fontWeight: '700' },
  episodeInfo:     { flex: 1, minWidth: 0 },
  episodeTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  episodeNum:      { fontSize: 11, fontWeight: '700' },
  episodeRuntime:  { fontSize: 10 },
  episodeRating:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  episodeRatingText:{ fontSize: 10, fontWeight: '600' },
  episodeName:     { fontSize: 12, fontWeight: '500', marginTop: 2 },
  episodeDate:     { fontSize: 10, marginTop: 2 },
})
