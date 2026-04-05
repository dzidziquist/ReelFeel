import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'

const WEEKS     = 13
const DAYS      = 7
const CELL_SIZE = 12
const CELL_GAP  = 3

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function dateToDayKey(d) {
  return d.toISOString().split('T')[0]
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function cellColor(count, theme) {
  if (!count)    return theme.bg3 ?? '#2c2c2e'
  if (count === 1) return '#7b5c0a'
  if (count <= 3) return '#b8860b'
  return '#d4af37'
}

/**
 * GitHub-style calendar heatmap showing last 91 days of watch activity.
 *
 * Props:
 *   entries – array of { watched_on: 'YYYY-MM-DD' }
 */
export default function CalendarHeatmap({ entries = [] }) {
  const { theme }   = useTheme()
  const [tooltip, setTooltip] = useState(null) // { date, count }

  // Build count map
  const countMap = new Map()
  for (const e of entries) {
    const k = e.watched_on?.slice(0, 10)
    if (k) countMap.set(k, (countMap.get(k) ?? 0) + 1)
  }

  // Build grid: WEEKS columns × 7 rows
  // Start from (WEEKS*7 - 1) days ago
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = addDays(today, -(WEEKS * DAYS - 1))

  // Align startDate to Sunday
  const startDow = startDate.getDay()
  const gridStart = addDays(startDate, -startDow)

  const weeks = []
  let monthLabels = [] // [{ weekIdx, label }]

  for (let w = 0; w < WEEKS + 1; w++) {
    const weekDays = []
    for (let d = 0; d < DAYS; d++) {
      const date  = addDays(gridStart, w * 7 + d)
      const key   = dateToDayKey(date)
      const count = countMap.get(key) ?? 0
      const inRange = date >= startDate && date <= today
      weekDays.push({ date, key, count, inRange })

      // Detect month change for labels
      if (d === 0 && date.getDate() <= 7) {
        monthLabels.push({
          weekIdx: w,
          label: date.toLocaleString('default', { month: 'short' }),
        })
      }
    }
    weeks.push(weekDays)
  }

  const totalCells  = WEEKS + 1
  const gridWidth   = totalCells * (CELL_SIZE + CELL_GAP) - CELL_GAP
  const leftPadding = 18  // for day labels

  return (
    <View>
      {/* Month labels */}
      <View style={{ flexDirection: 'row', marginLeft: leftPadding, marginBottom: 4 }}>
        {monthLabels.map((m, i) => (
          <Text
            key={i}
            style={[
              s.monthLabel,
              { left: m.weekIdx * (CELL_SIZE + CELL_GAP), color: theme.textMut },
            ]}
          >
            {m.label}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {/* Day labels */}
        <View style={{ gap: CELL_GAP, paddingTop: 2 }}>
          {DAY_LABELS.map((d, i) => (
            <Text key={i} style={[s.dayLabel, { color: theme.textMut, height: CELL_SIZE }]}>
              {i % 2 === 1 ? d : ''}
            </Text>
          ))}
        </View>

        {/* Weeks */}
        <View style={{ flexDirection: 'row', gap: CELL_GAP }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ gap: CELL_GAP }}>
              {week.map(({ date, key, count, inRange }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (!inRange) return
                    setTooltip(tooltip?.key === key ? null : { key, date, count })
                  }}
                  activeOpacity={0.7}
                  style={[
                    s.cell,
                    {
                      backgroundColor: inRange ? cellColor(count, theme) : 'transparent',
                      opacity: inRange ? 1 : 0,
                      borderRadius: 2,
                      borderWidth: tooltip?.key === key ? 1 : 0,
                      borderColor: theme.gold ?? '#d4af37',
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Tooltip */}
      {tooltip && (
        <View style={[s.tooltip, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
          <Text style={[s.tooltipText, { color: theme.text }]}>
            {tooltip.count > 0
              ? `${tooltip.count} title${tooltip.count !== 1 ? 's' : ''} on ${tooltip.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
              : `No watches on ${tooltip.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
            }
          </Text>
        </View>
      )}

      {/* Legend */}
      <View style={s.legend}>
        <Text style={[s.legendLabel, { color: theme.textMut }]}>Less</Text>
        {[0, 1, 2, 4, 5].map(n => (
          <View key={n} style={[s.legendCell, { backgroundColor: cellColor(n, theme) }]} />
        ))}
        <Text style={[s.legendLabel, { color: theme.textMut }]}>More</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  cell:        { width: CELL_SIZE, height: CELL_SIZE },
  monthLabel:  { position: 'absolute', fontSize: 9, fontWeight: '600' },
  dayLabel:    { fontSize: 8, lineHeight: CELL_SIZE, width: 10 },
  tooltip:     { marginTop: 8, padding: 8, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  tooltipText: { fontSize: 12 },
  legend:      { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 10 },
  legendCell:  { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { fontSize: 9, marginHorizontal: 2 },
})
