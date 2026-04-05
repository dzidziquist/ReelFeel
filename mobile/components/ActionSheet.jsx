import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'

/**
 * Bottom-sheet action menu.
 *
 * Props:
 *   visible  – boolean
 *   onClose  – called when backdrop or Cancel pressed
 *   title    – optional header text
 *   items    – [{ icon: IoniconName, label: string, onPress: fn, destructive?: bool }]
 */
export default function ActionSheet({ visible, onClose, title, items = [] }) {
  const { theme } = useTheme()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.backdrop} />
      </TouchableWithoutFeedback>

      <View style={[s.sheet, { backgroundColor: theme.bg1, borderTopColor: theme.border }]}>
        {title ? (
          <View style={[s.titleRow, { borderBottomColor: theme.border }]}>
            <Text style={[s.title, { color: theme.textMut }]} numberOfLines={2}>{title}</Text>
          </View>
        ) : null}

        {items.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[s.item, i < items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
            onPress={() => { onClose(); item.onPress?.() }}
            activeOpacity={0.7}
          >
            <View style={[s.iconWrap, { backgroundColor: item.destructive ? '#dc262622' : theme.bg2 }]}>
              <Ionicons
                name={item.icon}
                size={20}
                color={item.destructive ? '#dc2626' : theme.gold ?? '#d4af37'}
              />
            </View>
            <Text style={[s.label, { color: item.destructive ? '#dc2626' : theme.text }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.cancelBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[s.cancelText, { color: theme.textSub }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:     {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  titleRow:  { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  title:     { fontSize: 12, textAlign: 'center', fontWeight: '500' },
  item:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  iconWrap:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label:     { fontSize: 16, fontWeight: '500', flex: 1 },
  cancelBtn: {
    marginTop: 12, paddingVertical: 16, borderRadius: 14,
    borderWidth: 1, alignItems: 'center',
  },
  cancelText:{ fontSize: 16, fontWeight: '600' },
})
