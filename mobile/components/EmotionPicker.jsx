import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'

const CATEGORY_ORDER = ['Neutral', 'Happy', 'Interested', 'Surprised', 'Sad', 'Disgusted', 'Afraid', 'Angry']

export default function EmotionPicker({ emotions = [], selected = [], onChange }) {
  const { theme } = useTheme()

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

  const activeItems = groups[activeTab] ?? []
  const activeAccent = activeItems[0]?.color ?? theme.gold
  const selectedEmotions = emotions.filter(e => selected.includes(e.id))

  return (
    <View style={[s.container, { borderColor: theme.text }]}>
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

      {/* Emotion grid for active tab */}
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

      {/* Selected pills */}
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
  )
}

const s = StyleSheet.create({
  container:    { borderRadius: 6, borderWidth: 2, overflow: 'hidden' },

  tabBar:       { borderBottomWidth: 1 },
  tabBarContent:{ flexDirection: 'row', paddingHorizontal: 4 },
  tab:          { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText:      { fontSize: 13 },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 },
  chipEmoji:    { fontSize: 18 },
  chipName:     { fontSize: 13, fontWeight: '600', flexShrink: 1 },

  summary:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, borderTopWidth: 1 },
  pill:         { borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:     { fontSize: 12, fontWeight: '700' },
})
