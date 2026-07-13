import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useTheme } from '../context/ThemeContext'

const WEEKS     = 13
const DAYS      = 7
const CELL_SIZE = 12
const CELL_GAP  = 3
const CELL_STEP = CELL_SIZE + CELL_GAP   // 15px per column
const DAY_COL_W = 12                     // width reserved for M/W/F labels
const COL_GAP   = 4                      // gap between day-label col and week grid

// Only show alternating day labels (M, W, F) to save space
const DAY_LABELS = ['', 'M', '', 'W', '', 'F', '']

function dateToDayKey(d) {
  return d.toISOString().split('T')[0]
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function cellColor(count, theme) {
  if (!count)      return theme.bg3 ?? '#2c2c2e'
  if (count === 1) return '#7b5c0a'
  if (count <= 3)  return '#b8860b'
  return '#d4af37'
}

/**
 * GitHub-style calendar heatmap showing last 91 days of watch activity.
 * Props: entries – array of { watched_on: 'YYYY-MM-DD' }
 */
export default function CalendarHeatmap({ entries = [], onDateSelect, selectedDate }) {
  const { theme }   = useTheme()
  const [tooltip, setTooltip] = useState(null)

  // Build count map
  const countMap = new Map()
  for (const e of entries) {
    const k = e.watched_on?.slice(0, 10)
    if (k) countMap.set(k, (countMap.get(k) ?? 0) + 1)
  }

  // Build grid: WEEKS columns × 7 rows, aligned to Sunday start
  const today     = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate  = addDays(today, -(WEEKS * DAYS - 1))
  const startDow   = startDate.getDay()
  const gridStart  = addDays(startDate, -startDow)

  // Collect month-label positions
  const monthLabels = []
  const weeks = []

  for (let w = 0; w < WEEKS; w++) {
    const weekDays = []
    for (let d = 0; d < DAYS; d++) {
      const date  = addDays(gridStart, w * 7 + d)
      const key   = dateToDayKey(date)
      const count = countMap.get(key) ?? 0
      const inRange = date >= startDate && date <= today
      weekDays.push({ date, key, count, inRange })

      // First Sunday of the month → emit label above this week
      if (d === 0 && date.getDate() <= 7) {
        monthLabels.push({
          weekIdx: w,
          label: date.toLocaleString('default', { month: 'short' }),
        })
      }
    }
    weeks.push(weekDays)
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={s.root}>
        {/* Month labels row — explicit height so absolute children don't collapse parent */}
        <View style={[s.monthRow, { marginLeft: DAY_COL_W + COL_GAP }]}>
          {monthLabels.map((m, i) => (
            <Text
              key={i}
              style={[
                s.monthLabel,
                { left: m.weekIdx * CELL_STEP, color: theme.textMut },
              ]}
            >
              {m.label}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {/* Day labels column */}
          <View style={[s.dayCol, { width: DAY_COL_W }]}>
            {DAY_LABELS.map((lbl, i) => (
              <Text
                key={i}
                style={[s.dayLabel, { color: theme.textMut, height: CELL_SIZE, lineHeight: CELL_SIZE }]}
              >
                {lbl}
              </Text>
            ))}
          </View>

          {/* Week columns */}
          <View style={s.weeksRow}>
            {weeks.map((week, wi) => (
              <View key={wi} style={s.weekCol}>
                {week.map(({ date, key, count, inRange }) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      if (!inRange) return
                      setTooltip(tooltip?.key === key ? null : { key, date, count })
                      if (onDateSelect) {
                        onDateSelect(selectedDate === key ? null : key)
                      }
                    }}
                    activeOpacity={0.7}
                    style={[
                      s.cell,
                      {
                        backgroundColor: inRange ? cellColor(count, theme) : 'transparent',
                        opacity: inRange ? 1 : 0,
                        borderWidth: (tooltip?.key === key || selectedDate === key) ? 1.5 : 0,
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
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:       { paddingVertical: 4 },
  monthRow:   { height: 14, position: 'relative', marginBottom: 4 },
  monthLabel: { position: 'absolute', fontSize: 9, fontWeight: '600', top: 0 },
  grid:       { flexDirection: 'row', gap: COL_GAP },
  dayCol:     { gap: CELL_GAP, paddingTop: 1 },
  dayLabel:   { fontSize: 8, textAlign: 'right' },
  weeksRow:   { flexDirection: 'row', gap: CELL_GAP },
  weekCol:    { gap: CELL_GAP },
  cell:       { width: CELL_SIZE, height: CELL_SIZE, borderRadius: 2 },
  tooltip:    { marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  tooltipText:{ fontSize: 12 },
  legend:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 10 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  legendLabel:{ fontSize: 9, marginHorizontal: 2 },
})
