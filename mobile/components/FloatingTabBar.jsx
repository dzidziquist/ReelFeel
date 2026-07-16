import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { useTabBar } from '../context/TabBarContext'

const ICONS = {
  index:     'telescope-outline',
  diary:     'heart-outline',
  watchlist: 'bookmark-outline',
  search:    'search-outline',
  profile:   'person-outline',
}

const LABELS = {
  index:     'Discover',
  diary:     'Diary',
  watchlist: 'Watchlist',
  search:    'Search',
  profile:   'Me',
}

const PILL_SIZE = 56
const H_PADDING = 16

export default function FloatingTabBar({ state, descriptors, navigation }) {
  const { theme, isDark, navbarShowLabels } = useTheme()
  const insets = useSafeAreaInsets()
  const { collapsedAnim, collapsed, expand } = useTabBar()

  const screenWidth = Dimensions.get('window').width
  const fullWidth   = screenWidth - H_PADDING * 2

  const barWidth = collapsedAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [fullWidth, PILL_SIZE],
  })

  const borderRadius = collapsedAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [44, PILL_SIZE / 2],
  })

  // Clamp height to PILL_SIZE when collapsed so labels don't make a tall oval
  const maxHeight = collapsedAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [200, PILL_SIZE],
  })

  const tabsOpacity = collapsedAnim.interpolate({
    inputRange:  [0, 0.2, 1],
    outputRange: [1, 0, 0],
  })

  const pillOpacity = collapsedAnim.interpolate({
    inputRange:  [0, 0.65, 1],
    outputRange: [0, 0, 1],
  })

  const HIDDEN = new Set(['library'])
  const visibleRoutes  = state.routes.filter(r => !HIDDEN.has(r.name))
  const activeRoute    = state.routes[state.index]
  const activeIconName = ICONS[activeRoute?.name] ?? 'ellipse-outline'

  const shadowOpacity = collapsedAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.06, 0.22],
  })

  const tint = isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'

  if (activeRoute?.name === 'library') return null

  return (
    <View pointerEvents="box-none" style={[s.wrapper, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
      {/* Shadow lives outside overflow:hidden so it isn't clipped */}
      <Animated.View style={[s.shadowWrap, { width: barWidth, borderRadius, shadowOpacity }]}>
      <Animated.View style={[s.shell, { width: barWidth, borderRadius, maxHeight }, !isDark && s.shellLight]}>

        <BlurView intensity={isDark ? 72 : 88} tint={tint} style={StyleSheet.absoluteFill} />

        {/* Content layer — always full opacity */}
        <View style={s.content}>

          {/* Full tab row */}
          <Animated.View style={[s.tabs, { opacity: tabsOpacity }]} pointerEvents={collapsed ? 'none' : 'auto'}>
            {visibleRoutes.map(route => {
              const isFocused = state.routes[state.index].key === route.key
              const iconName  = ICONS[route.name] ?? 'ellipse-outline'
              const label     = LABELS[route.name] ?? route.name
              const highlightBg = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.09)'

              function onPress() {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name)
              }

              return (
                <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.75} style={s.tab}>
                  <View style={[
                    s.tabInner,
                    navbarShowLabels && s.tabInnerLabels,
                    !navbarShowLabels && isFocused && { backgroundColor: highlightBg },
                  ]}>
                    <Ionicons
                      name={iconName}
                      size={navbarShowLabels ? 20 : 24}
                      color={isFocused ? theme.gold : theme.textMut}
                    />
                    {navbarShowLabels && (
                      <Text style={[s.label, { color: isFocused ? theme.gold : theme.textMut }]}>{label.toUpperCase()}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            })}
          </Animated.View>

          {/* Collapsed circle icon — tap to expand */}
          <Animated.View
            style={[s.pill, { opacity: pillOpacity }]}
            pointerEvents={collapsed ? 'box-none' : 'none'}
          >
            <TouchableOpacity onPress={expand} activeOpacity={0.7} style={s.pillTap}>
              <Ionicons name={activeIconName} size={24} color={theme.gold} />
            </TouchableOpacity>
          </Animated.View>

        </View>
      </Animated.View>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: H_PADDING,
    alignItems:        'flex-start',
  },
  shadowWrap: {
    shadowColor:  '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
  },
  shell: {
    overflow:  'hidden',
    minHeight: PILL_SIZE,
  },
  shellLight: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.14)',
  },
  content: {
    minHeight: PILL_SIZE,
    padding:   6,
  },
  tabs: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  tab: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabInner: {
    alignItems:        'center',
    justifyContent:    'center',
    paddingVertical:   10,
    paddingHorizontal: 18,
    borderRadius:      14,
    gap:               3,
  },
  tabInnerLabels: {
    paddingVertical:   8,
    paddingHorizontal: 10,
    borderRadius:      10,
    gap:               2,
  },
  label: {
    fontSize:      9,
    fontWeight:    '700',
    letterSpacing: 0.6,
  },
  pill: {
    position:       'absolute',
    top:            0,
    left:           0,
    right:          0,
    bottom:         0,
    width:          PILL_SIZE,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pillTap: {
    width:          PILL_SIZE,
    height:         PILL_SIZE,
    alignItems:     'center',
    justifyContent: 'center',
  },
})
