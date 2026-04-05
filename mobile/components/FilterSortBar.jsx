import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  TextInput, StyleSheet, Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

const SORT_OPTIONS = [
  { key: 'watched_on_desc', label: 'Date (newest)' },
  { key: 'watched_on_asc',  label: 'Date (oldest)' },
  { key: 'rating_desc',     label: 'Rating (high)' },
  { key: 'rating_asc',      label: 'Rating (low)'  },
  { key: 'title_asc',       label: 'Title A–Z'     },
  { key: 'title_desc',      label: 'Title Z–A'     },
]

const WATCHLIST_SORT = [
  { key: 'added_at_desc', label: 'Added (newest)' },
  { key: 'added_at_asc',  label: 'Added (oldest)' },
  { key: 'title_asc',     label: 'Title A–Z'      },
]

/**
 * Collapsible filter + sort bar.
 *
 * Props:
 *   filters          – { genre, minRating, maxRating, emotionIds }
 *   onFiltersChange  – (newFilters) => void
 *   sort             – string (sort key)
 *   onSortChange     – (newSort) => void
 *   emotions         – [{ id, name, icon, color }]  (for emotion filter chips)
 *   availableGenres  – string[]  (genres found in current data)
 *   mode             – 'diary' | 'watchlist'  (controls sort options)
 *   activeCount      – number (how many active filters to show badge)
 */
export default function FilterSortBar({
  filters = {},
  onFiltersChange,
  sort = 'watched_on_desc',
  onSortChange,
  emotions = [],
  availableGenres = [],
  mode = 'diary',
  activeCount = 0,
}) {
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)

  const sortList = mode === 'watchlist' ? WATCHLIST_SORT : SORT_OPTIONS
  const activeLabel = sortList.find(s => s.key === sort)?.label ?? 'Sort'

  const hasFilters = activeCount > 0

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Collapsed bar */}
      <View style={[s.bar, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
        <TouchableOpacity style={s.filterBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={16} color={theme.textSub} />
          <Text style={[s.filterLabel, { color: theme.textSub }]}>Filter</Text>
          {hasFilters && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={[s.divider, { backgroundColor: theme.border }]} />

        {/* Sort chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={s.sortChips}>
            {sortList.map(opt => {
              const active = sort === opt.key
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => onSortChange(opt.key)}
                  style={[
                    s.chip,
                    active ? { backgroundColor: theme.red ?? '#dc2626', borderColor: theme.red } : { borderColor: theme.border },
                  ]}
                >
                  <Text style={[s.chipText, { color: active ? '#fff' : theme.textMut }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <FilterPanel
          theme={theme}
          filters={filters}
          onFiltersChange={(f) => { onFiltersChange(f); setOpen(false) }}
          onClose={() => setOpen(false)}
          emotions={emotions}
          availableGenres={availableGenres}
        />
      </Modal>
    </View>
  )
}

// ── Date helpers ──────────────────────────────────────────────
function toStr(d) { return d.toISOString().split('T')[0] }
function startOfWeek() {
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d
}
function monthsAgo(n) {
  const d = new Date(); d.setMonth(d.getMonth() - n); return d
}
const TODAY = toStr(new Date())
const DATE_PRESETS = [
  { label: 'All',        start: '',                            end: '' },
  { label: 'This week',  start: toStr(startOfWeek()),         end: TODAY },
  { label: 'This month', start: TODAY.slice(0, 7) + '-01',    end: TODAY },
  { label: '3 months',   start: toStr(monthsAgo(3)),          end: TODAY },
  { label: 'This year',  start: TODAY.slice(0, 4) + '-01-01', end: TODAY },
]

function FilterPanel({ theme, filters, onFiltersChange, onClose, emotions, availableGenres }) {
  const [local, setLocal] = useState({
    genre: '', minRating: '', maxRating: '', emotionIds: [], startDate: '', endDate: '',
    ...filters,
  })
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker,   setShowToPicker]   = useState(false)

  function patch(updates) {
    setLocal(prev => ({ ...prev, ...updates }))
  }

  function toggleEmotion(id) {
    const ids = local.emotionIds ?? []
    patch({ emotionIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id] })
  }

  function reset() {
    const empty = { genre: '', minRating: '', maxRating: '', emotionIds: [], startDate: '', endDate: '' }
    setLocal(empty)
    onFiltersChange(empty)
  }

  function applyPreset(preset) {
    patch({ startDate: preset.start, endDate: preset.end })
  }

  const activeCount = [
    local.genre,
    local.minRating,
    local.maxRating,
    ...(local.emotionIds ?? []),
  ].filter(Boolean).length + (local.startDate || local.endDate ? 1 : 0)

  return (
    <View style={[fp.container, { backgroundColor: theme.bg0 }]}>
      {/* Header */}
      <View style={[fp.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onClose}><Text style={{ color: theme.textSub, fontSize: 15 }}>Cancel</Text></TouchableOpacity>
        <Text style={[fp.title, { color: theme.text }]}>Filter</Text>
        <TouchableOpacity onPress={reset}><Text style={{ color: theme.red ?? '#dc2626', fontSize: 15 }}>Reset</Text></TouchableOpacity>
      </View>

      <ScrollView style={fp.body} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Genre */}
        {availableGenres.length > 0 && (
          <View style={fp.section}>
            <Text style={[fp.sectionLabel, { color: theme.textSub }]}>Genre</Text>
            <View style={fp.chips}>
              {availableGenres.map(g => {
                const active = local.genre === g
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => patch({ genre: active ? '' : g })}
                    style={[fp.chip, active
                      ? { backgroundColor: theme.red, borderColor: theme.red }
                      : { borderColor: theme.border }
                    ]}
                  >
                    <Text style={[fp.chipText, { color: active ? '#fff' : theme.textSub }]}>{g}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* Rating range */}
        <View style={fp.section}>
          <Text style={[fp.sectionLabel, { color: theme.textSub }]}>Rating</Text>
          <View style={fp.ratingRow}>
            <View style={fp.ratingInput}>
              <Text style={[fp.ratingLbl, { color: theme.textMut }]}>Min</Text>
              <TextInput
                style={[fp.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text }]}
                value={String(local.minRating ?? '')}
                onChangeText={v => patch({ minRating: v })}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={theme.textMut}
                maxLength={3}
              />
            </View>
            <Text style={{ color: theme.textMut, fontSize: 18, alignSelf: 'flex-end', paddingBottom: 8 }}>–</Text>
            <View style={fp.ratingInput}>
              <Text style={[fp.ratingLbl, { color: theme.textMut }]}>Max</Text>
              <TextInput
                style={[fp.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text }]}
                value={String(local.maxRating ?? '')}
                onChangeText={v => patch({ maxRating: v })}
                keyboardType="decimal-pad"
                placeholder="5.0"
                placeholderTextColor={theme.textMut}
                maxLength={3}
              />
            </View>
          </View>
        </View>

        {/* Date Range */}
        <View style={fp.section}>
          <Text style={[fp.sectionLabel, { color: theme.textSub }]}>Date Range</Text>

          {/* Preset chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DATE_PRESETS.map(preset => {
                const active = local.startDate === preset.start && local.endDate === preset.end
                return (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => applyPreset(preset)}
                    style={[fp.chip, active
                      ? { backgroundColor: theme.red, borderColor: theme.red }
                      : { borderColor: theme.border }
                    ]}
                  >
                    <Text style={[fp.chipText, { color: active ? '#fff' : theme.textSub }]}>{preset.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>

          {/* Custom From / To */}
          <TouchableOpacity
            onPress={() => { setShowFromPicker(true); setShowToPicker(false) }}
            style={[fp.dateRow, { backgroundColor: theme.bg2, borderColor: theme.border }]}
          >
            <Text style={[fp.dateLbl, { color: theme.textMut }]}>From</Text>
            <Text style={[fp.dateVal, { color: local.startDate ? theme.text : theme.textMut }]}>
              {local.startDate || 'Any'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.textMut} />
          </TouchableOpacity>

          {showFromPicker && (
            <View>
              <DateTimePicker
                value={local.startDate ? new Date(local.startDate + 'T00:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowFromPicker(false)
                  if (date) patch({ startDate: toStr(date) })
                }}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity onPress={() => setShowFromPicker(false)} style={fp.doneBtn}>
                  <Text style={{ color: theme.red, fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={() => { setShowToPicker(true); setShowFromPicker(false) }}
            style={[fp.dateRow, { backgroundColor: theme.bg2, borderColor: theme.border, marginTop: 8 }]}
          >
            <Text style={[fp.dateLbl, { color: theme.textMut }]}>To</Text>
            <Text style={[fp.dateVal, { color: local.endDate ? theme.text : theme.textMut }]}>
              {local.endDate || 'Any'}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.textMut} />
          </TouchableOpacity>

          {showToPicker && (
            <View>
              <DateTimePicker
                value={local.endDate ? new Date(local.endDate + 'T00:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (Platform.OS === 'android') setShowToPicker(false)
                  if (date) patch({ endDate: toStr(date) })
                }}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity onPress={() => setShowToPicker(false)} style={fp.doneBtn}>
                  <Text style={{ color: theme.red, fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Emotion filter */}
        {emotions.length > 0 && (
          <View style={fp.section}>
            <Text style={[fp.sectionLabel, { color: theme.textSub }]}>Mood / Emotion</Text>
            <View style={fp.chips}>
              {emotions.map(e => {
                const active = (local.emotionIds ?? []).includes(e.id)
                return (
                  <TouchableOpacity
                    key={e.id}
                    onPress={() => toggleEmotion(e.id)}
                    style={[fp.chip, {
                      borderColor: active ? e.color : e.color + '55',
                      backgroundColor: active ? e.color + '33' : 'transparent',
                    }]}
                  >
                    <Text style={[fp.chipText, { color: active ? e.color : e.color + 'aa' }]}>
                      {e.icon} {e.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Apply button */}
      <View style={[fp.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[fp.applyBtn, { backgroundColor: theme.red ?? '#dc2626' }]}
          onPress={() => onFiltersChange(local)}
        >
          <Text style={fp.applyText}>
            Apply{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  bar:       { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, gap: 10 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterLabel:{ fontSize: 13, fontWeight: '600' },
  badge:     { backgroundColor: '#dc2626', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  divider:   { width: 1, height: 20 },
  sortChips: { flexDirection: 'row', gap: 6 },
  chip:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  chipText:  { fontSize: 11, fontWeight: '500' },
})

const fp = StyleSheet.create({
  container:  { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, borderBottomWidth: StyleSheet.hairlineWidth },
  title:      { fontSize: 17, fontWeight: '700' },
  body:       { flex: 1, padding: 16 },
  section:    { marginBottom: 24 },
  sectionLabel:{ fontSize: 13, fontWeight: '700', marginBottom: 10 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  chipText:   { fontSize: 13, fontWeight: '600' },
  ratingRow:  { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  ratingInput:{ flex: 1 },
  ratingLbl:  { fontSize: 11, marginBottom: 4 },
  input:      { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  footer:     { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  applyBtn:   { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  applyText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  dateRow:    { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  dateLbl:    { fontSize: 13, fontWeight: '600', width: 36 },
  dateVal:    { flex: 1, fontSize: 14 },
  doneBtn:    { alignItems: 'flex-end', paddingVertical: 8, paddingHorizontal: 14 },
})
