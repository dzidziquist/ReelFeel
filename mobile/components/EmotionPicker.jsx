import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'

const CATEGORY_ORDER = ['Happy', 'Interested', 'Surprised', 'Sad', 'Disgusted', 'Afraid', 'Angry']

/**
 * Emotion picker with category rows + intensity columns (like a mood board).
 *
 * Props:
 *   emotions – array from DB, each has { id, name, icon, color, category, sort_order }
 *   selected – array of selected emotion IDs
 *   onChange – (ids: number[]) => void
 */
export default function EmotionPicker({ emotions = [], selected = [], onChange }) {
  const { theme } = useTheme()

  // Group emotions by category, preserving order within each group
  const groups = {}
  for (const e of emotions) {
    const cat = e.category || 'Other'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(e)
  }

  // Category display order — known first, then any extras alphabetically
  const knownCats = CATEGORY_ORDER.filter(c => groups[c]?.length)
  const extraCats = Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c)).sort()
  const orderedCats = [...knownCats, ...extraCats]

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  if (!orderedCats.length) return null

  return (
    <View style={[s.container, { borderColor: theme.text }]}>
      {orderedCats.map((cat, ci) => {
        const items = groups[cat]
        // Use the first item's color as the category accent
        const accent = items[0]?.color ?? theme.textMut

        return (
          <View key={cat}>
            {ci > 0 && <View style={[s.separator, { backgroundColor: theme.text }]} />}
            <View style={s.row}>
              {/* Category label */}
              <View style={s.labelCol}>
                <Text style={[s.catLabel, { color: theme.text }]}>{cat}</Text>
              </View>

              {/* Emoji options — horizontal scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.emojiRow}
                style={s.emojiScroll}
              >
                {items.map(e => {
                  const active = selected.includes(e.id)
                  return (
                    <TouchableOpacity
                      key={e.id}
                      onPress={() => toggle(e.id)}
                      activeOpacity={0.65}
                      style={[
                        s.emojiBtn,
                        active && {
                          backgroundColor: e.color + '28',
                          borderColor:     e.color,
                          borderWidth:     2,
                        },
                        !active && {
                          borderColor: 'transparent',
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <Text style={s.emoji}>{e.icon}</Text>
                      {active && (
                        <Text style={[s.emojiName, { color: e.color }]} numberOfLines={1}>
                          {e.name}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          </View>
        )
      })}

      {/* Selected summary pills */}
      {selected.length > 0 && (() => {
        const selEmotions = emotions.filter(e => selected.includes(e.id))
        return (
          <View style={[s.summary, { borderTopColor: theme.text }]}>
            {selEmotions.map(e => (
              <TouchableOpacity
                key={e.id}
                onPress={() => toggle(e.id)}
                style={[s.pill, { backgroundColor: e.color + '22', borderColor: e.color + '66' }]}
              >
                <Text style={[s.pillText, { color: e.color }]}>{e.icon} {e.name} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      })()}
    </View>
  )
}

const LABEL_W  = 76
const EMOJI_SZ = 38

const s = StyleSheet.create({
  container:  { borderRadius: 6, borderWidth: 2, overflow: 'hidden' },
  separator:  { height: 1 },
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  labelCol:   { width: LABEL_W, paddingLeft: 14, paddingRight: 4 },
  catLabel:   { fontSize: 13, fontWeight: '700' },
  emojiScroll:{ flex: 1 },
  emojiRow:   { alignItems: 'center', paddingHorizontal: 6, gap: 2 },
  emojiBtn:   { width: EMOJI_SZ, height: EMOJI_SZ, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  emoji:      { fontSize: 24, lineHeight: 30 },
  emojiName:  { fontSize: 7, fontWeight: '600', textAlign: 'center', marginTop: 1, width: EMOJI_SZ },
  summary:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, borderTopWidth: 1 },
  pill:       { borderWidth: 2, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:   { fontSize: 12, fontWeight: '700' },
})
