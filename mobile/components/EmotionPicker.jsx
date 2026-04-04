import { View, Text, TouchableOpacity, ScrollView } from 'react-native'

export default function EmotionPicker({ emotions, selected, onChange }) {
  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {emotions.map(e => {
        const active = selected.includes(e.id)
        return (
          <TouchableOpacity
            key={e.id}
            onPress={() => toggle(e.id)}
            activeOpacity={0.75}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? e.color : e.color + '55',
              backgroundColor: active ? e.color + '33' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: active ? e.color : e.color + 'aa' }}>
              {e.icon} {e.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
