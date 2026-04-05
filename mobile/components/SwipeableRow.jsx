import { useRef } from 'react'
import { View, Text, Animated, PanResponder, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const SWIPE_THRESHOLD = 80   // px to trigger delete reveal
const DELETE_WIDTH    = 80   // width of the red delete strip

/**
 * Swipeable row that reveals a red delete button on left-swipe.
 *
 * Props:
 *   children  – the content to display
 *   onDelete  – called when the delete button is tapped
 *   disabled  – disable swipe (e.g. while loading)
 */
export default function SwipeableRow({ children, onDelete, disabled = false }) {
  const translateX = useRef(new Animated.Value(0)).current
  const isOpen     = useRef(false)

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      !disabled && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),

    onPanResponderMove: (_, g) => {
      if (g.dx > 0 && !isOpen.current) return  // don't allow right-swipe to open
      const newX = isOpen.current ? Math.max(-DELETE_WIDTH, g.dx - DELETE_WIDTH) : Math.min(0, g.dx)
      translateX.setValue(newX)
    },

    onPanResponderRelease: (_, g) => {
      if (g.dx < -SWIPE_THRESHOLD) {
        // Open
        Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true, tension: 120, friction: 10 }).start()
        isOpen.current = true
      } else if (g.dx > SWIPE_THRESHOLD && isOpen.current) {
        // Close
        closeRow()
      } else if (isOpen.current) {
        // Snap back to open
        Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true }).start()
      } else {
        // Snap back to closed
        closeRow()
      }
    },
  })).current

  function closeRow() {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start()
    isOpen.current = false
  }

  function handleDelete() {
    closeRow()
    onDelete?.()
  }

  return (
    <View style={s.container}>
      {/* Delete action strip (behind the row) */}
      <View style={s.deleteStrip}>
        <TouchableOpacity onPress={handleDelete} style={s.deleteBtn} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={s.deleteLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Main row content */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  container:   { position: 'relative', overflow: 'hidden' },
  deleteStrip: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: DELETE_WIDTH, backgroundColor: '#dc2626',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn:   { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: 4 },
  deleteLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
})
