import { View, Text, TouchableOpacity } from 'react-native'
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

/** Interactive star picker */
export function StarPicker({ value, onChange }) {
  function handlePress(i) {
    onChange(value === i ? i - 0.5 : i)
  }

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => handlePress(i)} activeOpacity={0.7}>
          <Text style={{
            fontSize: 32,
            color: value >= i ? GOLD : value >= i - 0.5 ? GOLD_DIM : EMPTY,
          }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
