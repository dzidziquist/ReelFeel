import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../context/ThemeContext'

const GOLD = '#d4af37'

/** Display-only star rating — works in any theme */
export function StarDisplay({ rating, size = 'sm' }) {
  const { theme } = useTheme()
  const fontSize  = size === 'lg' ? 24 : 16
  const emptyColor = theme.bg3 ?? '#2c2c2e'
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Text key={i} style={{ fontSize, color: GOLD }}>★</Text>)
    } else if (rating >= i - 0.5) {
      stars.push(
        <View key={i} style={{ width: fontSize * 0.7, height: fontSize, overflow: 'hidden', position: 'relative' }}>
          <Text style={{ fontSize, color: emptyColor, position: 'absolute' }}>★</Text>
          <View style={{ width: '50%', overflow: 'hidden' }}>
            <Text style={{ fontSize, color: GOLD }}>★</Text>
          </View>
        </View>
      )
    } else {
      stars.push(<Text key={i} style={{ fontSize, color: emptyColor }}>★</Text>)
    }
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>
}

/**
 * Interactive star picker with decimal text input.
 * - Tap stars to set value in 1-step (tap filled star = subtract 0.5)
 * - Edit the text field to enter any decimal 0.0–5.0
 */
export function StarPicker({ value, onChange }) {
  const { theme }  = useTheme()
  const [inputText, setInputText] = useState(String(value ?? 3))
  const debounceRef = useRef(null)

  useEffect(() => { setInputText(String(value ?? 3)) }, [value])

  const emptyColor = theme.bg3 ?? '#2c2c2e'
  const displayValue = value ?? 0

  function handleStarPress(i) {
    const next = value === i ? i - 0.5 : i
    onChange(next)
    setInputText(String(next))
  }

  function handleTextChange(text) {
    setInputText(text)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const parsed = parseFloat(text)
      if (!isNaN(parsed)) {
        const clamped = Math.max(0, Math.min(5, Math.round(parsed * 10) / 10))
        onChange(clamped)
        setInputText(String(clamped))
      }
    }, 600)
  }

  function handleTextBlur() {
    const parsed = parseFloat(inputText)
    if (isNaN(parsed)) {
      setInputText(String(value))
    } else {
      const clamped = Math.max(0, Math.min(5, Math.round(parsed * 10) / 10))
      onChange(clamped)
      setInputText(String(clamped))
    }
  }

  return (
    <View style={s.wrap}>
      {/* Stars */}
      <View style={s.stars}>
        {[1, 2, 3, 4, 5].map(i => (
          <TouchableOpacity key={i} onPress={() => handleStarPress(i)} activeOpacity={0.7}>
            <Text style={{
              fontSize: 32,
              color: displayValue >= i ? GOLD : displayValue >= i - 0.5 ? GOLD + '88' : emptyColor,
            }}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Decimal input */}
      <View style={s.inputRow}>
        <TextInput
          style={[s.input, {
            backgroundColor: theme.bg2,
            borderColor: theme.text,
            color: GOLD,
          }]}
          value={inputText}
          onChangeText={handleTextChange}
          onBlur={handleTextBlur}
          keyboardType="decimal-pad"
          maxLength={3}
          selectTextOnFocus
        />
        <Text style={[s.outOf, { color: theme.textSub }]}>/5</Text>
        <Text style={[s.hint, { color: theme.textMut }]}>  (0.0 – 5.0)</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap:     { gap: 10 },
  stars:    { flexDirection: 'row', gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input:    {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 18,
    fontWeight: '700',
    width: 60,
    textAlign: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  outOf:    { fontSize: 16, fontWeight: '600' },
  hint:     { fontSize: 11 },
})
