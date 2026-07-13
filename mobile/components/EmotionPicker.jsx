import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

const CATEGORY_ORDER = ['Neutral', 'Happy', 'Interested', 'Surprised', 'Sad', 'Disgusted', 'Afraid', 'Angry']

export default function EmotionPicker({ emotions = [], selected = [], onChange }) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const groups = {}
  for (const e of emotions) {
    const cat = e.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(e)
  }

  const knownCats = CATEGORY_ORDER.filter(c => groups[c]?.length)
  const extraCats = Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c)).sort()
  const orderedCats = [...knownCats, ...extraCats]

  const [activeTab, setActiveTab] = useState(orderedCats[0] ?? '')

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  if (!orderedCats.length) return null

  const activeItems      = groups[activeTab] ?? []
  const selectedEmotions = emotions.filter(e => selected.includes(e.id))

  return (
    <View>
      {/* Header — always visible */}
      <TouchableOpacity
        onPress={() => setIsOpen(o => !o)}
        style={[s.header, { borderColor: theme.text, backgroundColor: theme.bg2 }]}
        activeOpacity={0.75}
      >
        <Ionicons name={isOpen ? 'chevron-down' : 'chevron-forward'} size={14} color={theme.textSub} />
        <Text style={[s.headerLabel, { color: theme.textSub }]}>How did it make you feel?</Text>
        {!isOpen && selectedEmotions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.collapsedScroll}
            contentContainerStyle={s.collapsedPills}
          >
            {selectedEmotions.map(e => (
              <Text key={e.id} style={[s.collapsedPill, { color: e.color }]}>
                {e.icon} {e.name}
              </Text>
            ))}
          </ScrollView>
        )}
      </TouchableOpacity>

      {/* Expanded content */}
      {isOpen && (
        <View style={[s.expanded, { borderColor: theme.text }]}>
          {/* Category tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[s.tabBar, { borderBottomColor: theme.text }]}
            contentContainerStyle={s.tabBarContent}
          >
            {orderedCats.map(cat => {
              const isActive = cat === activeTab
              const accent   = groups[cat][0]?.color ?? theme.gold
              const hasSel   = groups[cat].some(e => selected.includes(e.id))
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveTab(cat)}
                  style={[
                    s.tab,
                    isActive && { borderBottomColor: accent, borderBottomWidth: 2 },
                  ]}
                >
                  <Text style={[
                    s.tabText,
                    { color: isActive ? accent : theme.textMut },
                    isActive && { fontWeight: '700' },
                  ]}>
                    {cat}
                    {hasSel ? ' ·' : ''}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Emotion grid */}
          <View style={s.grid}>
            {activeItems.map(e => {
              const active = selected.includes(e.id)
              return (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => toggle(e.id)}
                  activeOpacity={0.65}
                  style={[
                    s.chip,
                    { borderColor: active ? e.color : theme.text + '40' },
                    active && { backgroundColor: e.color + '22' },
                  ]}
                >
                  <Text style={s.chipEmoji}>{e.icon}</Text>
                  <Text style={[s.chipName, { color: active ? e.color : theme.textSub }]} numberOfLines={1}>
                    {e.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Selected pills summary */}
          {selectedEmotions.length > 0 && (
            <View style={[s.summary, { borderTopColor: theme.text }]}>
              {selectedEmotions.map(e => (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => toggle(e.id)}
                  style={[s.pill, { backgroundColor: e.color + '22', borderColor: e.color + '66' }]}
                >
                  <Text style={[s.pillText, { color: e.color }]}>{e.icon} {e.name} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  header:         {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10,
  },
  headerArrow:    { width: 14 },
  headerLabel:    { fontSize: 13, fontWeight: '600', flex: 1 },
  collapsedScroll:{ flex: 1 },
  collapsedPills: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  collapsedPill:  { fontSize: 12, fontWeight: '600' },

  expanded:       { borderWidth: 2, borderTopWidth: 0, borderRadius: 6, borderTopLeftRadius: 0, borderTopRightRadius: 0, overflow: 'hidden' },

  tabBar:         { borderBottomWidth: 1 },
  tabBarContent:  { flexDirection: 'row', paddingHorizontal: 4 },
  tab:            { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText:        { fontSize: 13 },

  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 },
  chipEmoji:      { fontSize: 18 },
  chipName:       { fontSize: 13, fontWeight: '600', flexShrink: 1 },

  summary:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, borderTopWidth: 1 },
  pill:           { borderWidth: 2, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:       { fontSize: 12, fontWeight: '700' },
})
