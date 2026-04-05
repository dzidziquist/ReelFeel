import { useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { C } from '../constants/theme'

const GOLD     = C.gold
const GOLD_DIM = C.goldL + '88'
const EMPTY    = '#2a2a2a'

/** Display-only star rating */
export function StarDisplay({ rating, size = 'sm' }) {
  const fontSize = size === 'lg' ? 24 : 16
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Text key={i} style={{ fontSize, color: GOLD }}>★</Text>)
    } else if (rating >= i - 0.5) {
      stars.push(
        <View key={i} style={{ width: fontSize * 0.7, height: fontSize, overflow: 'hidden', position: 'relative' }}>
          <Text style={{ fontSize, color: EMPTY, position: 'absolute' }}>★</Text>
          <View style={{ width: '50%', overflow: 'hidden' }}>
            <Text style={{ fontSize, color: GOLD }}>★</Text>
          </View>
        </View>
      )
    } else {
      stars.push(<Text key={i} style={{ fontSize, color: EMPTY }}>★</Text>)
    }
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>
}

/**
 * Interactive star picker with decimal text input.
 * - Tap stars to set value in 0.5 steps
 * - Edit the text field to enter any decimal 0.0–5.0
 */
export function StarPicker({ value, onChange }) {
  const [inputText, setInputText] = useState(String(value ?? 3))
  const debounceRef = useRef(null)

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

  const displayValue = value ?? 0

  return (
    <View style={s.wrap}>
      {/* Stars */}
      <View style={s.stars}>
        {[1, 2, 3, 4, 5].map(i => (
          <TouchableOpacity key={i} onPress={() => handleStarPress(i)} activeOpacity={0.7}>
            <Text style={{
              fontSize: 32,
              color: displayValue >= i ? GOLD : displayValue >= i - 0.5 ? GOLD_DIM : EMPTY,
            }}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Decimal input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={inputText}
          onChangeText={handleTextChange}
          onBlur={handleTextBlur}
          keyboardType="decimal-pad"
          maxLength={3}
          selectTextOnFocus
        />
        <Text style={s.outOf}>/5</Text>
        <Text style={s.hint}>  (0.0 – 5.0)</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap:     { gap: 10 },
  stars:    { flexDirection: 'row', gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input:    {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: GOLD,
    fontSize: 18,
    fontWeight: '700',
    width: 60,
    textAlign: 'center',
  },
  outOf:    { color: C.textSub, fontSize: 16, fontWeight: '600' },
  hint:     { color: C.textMut, fontSize: 11 },
})
