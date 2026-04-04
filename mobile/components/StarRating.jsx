import { View, Text, TouchableOpacity } from 'react-native'

/** Display-only star rating */
export function StarDisplay({ rating, size = 'sm' }) {
  const fontSize = size === 'lg' ? 24 : 16
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<Text key={i} style={{ fontSize, color: '#facc15' }}>★</Text>)
    } else if (rating >= i - 0.5) {
      // Half star: two overlapping stars, clip left half yellow
      stars.push(
        <View key={i} style={{ width: fontSize * 0.7, height: fontSize, overflow: 'hidden', position: 'relative' }}>
          <Text style={{ fontSize, color: '#4b5563', position: 'absolute' }}>★</Text>
          <View style={{ width: '50%', overflow: 'hidden' }}>
            <Text style={{ fontSize, color: '#facc15' }}>★</Text>
          </View>
        </View>
      )
    } else {
      stars.push(<Text key={i} style={{ fontSize, color: '#4b5563' }}>★</Text>)
    }
  }
  return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>
}

/** Interactive star picker */
export function StarPicker({ value, onChange }) {
  function handlePress(i) {
    const newVal = value === i ? i - 0.5 : i
    onChange(newVal)
  }

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => handlePress(i)} activeOpacity={0.7}>
          <Text style={{
            fontSize: 32,
            color: value >= i ? '#facc15' : value >= i - 0.5 ? '#fde68a' : '#4b5563',
          }}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
