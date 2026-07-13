import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Dimensions, Alert, StyleSheet, Modal, Pressable,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { getLibrary } from '../../lib/queries'
import PosterCard from '../../components/PosterCard'
import { useTheme } from '../../context/ThemeContext'
import { useTabBar } from '../../context/TabBarContext'

const NUM_COLS   = 3
const GAP        = 10
const ITEM_WIDTH = (Dimensions.get('window').width - 32 - GAP * (NUM_COLS - 1)) / NUM_COLS

const FILTERS = [
  { value: '',     label: 'All'   },
  { value: 'film', label: 'Films' },
  { value: 'tv',   label: 'TV'    },
]

export default function Library() {
  const { theme, isDark }   = useTheme()
  const { onScroll, reset } = useTabBar()
  const insets              = useSafeAreaInsets()
  const router              = useRouter()

  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [filter,      setFilter]      = useState('')
  const [filterOpen,  setFilterOpen]  = useState(false)

  useFocusEffect(useCallback(() => { reset() }, []))

  const load = useCallback(async (type) => {
    try {
      setItems(await getLibrary(type || undefined))
    } catch {
      Alert.alert('Error', 'Could not load your library. Please try again.')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    load(filter).finally(() => setLoading(false))
  }, [filter, load])

  async function handleRefresh() { setRefreshing(true); await load(filter); setRefreshing(false) }

  const paddedItems = [...(loading ? [] : items)]
  while (paddedItems.length % NUM_COLS !== 0) paddedItems.push(null)

  const tint      = isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'
  const dividerBg = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)'
  const specular  = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'
  const isFiltered = filter !== ''

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <FlatList
        data={paddedItems}
        keyExtractor={(item, i) => item ? String(item.id) : `pad-${i}`}
        numColumns={NUM_COLS}
        contentContainerStyle={[s.list, { paddingBottom: 140 }]}
        columnWrapperStyle={s.row}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />
        }
        ListHeaderComponent={
          <View style={[s.headerBlock, { paddingTop: insets.top + 16 }]}>
            <Text style={[s.title, { color: theme.text }]}>Library</Text>
            <Text style={[s.subtitle, { color: theme.textMut }]}>
              {items.length} {items.length === 1 ? 'title' : 'titles'} watched
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading
            ? <View style={s.center}><ActivityIndicator color={theme.gold} /></View>
            : (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>📚</Text>
                <Text style={[s.emptyTitle, { color: theme.textSub }]}>Nothing logged yet.</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                  <Text style={[s.emptyLink, { color: theme.gold }]}>Find something to watch</Text>
                </TouchableOpacity>
              </View>
            )
        }
        renderItem={({ item }) => {
          if (!item) return <View style={{ width: ITEM_WIDTH }} />
          return (
            <PosterCard
              item={item}
              width={ITEM_WIDTH}
              onPress={() => router.push(`/media/${item.tmdb_id}?type=${item.media_type}`)}
            />
          )
        }}
      />

      {/* ── Top-right floating pill: home | filter | profile ── */}
      <View style={[s.pillWrap, { top: insets.top + 8 }]}>
        <View style={s.pill}>
          <BlurView intensity={isDark ? 72 : 88} tint={tint} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, s.pillSpecular, { borderColor: specular }]} />

          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={s.navBtn} activeOpacity={0.75}>
            <Ionicons name="telescope-outline" size={18} color={theme.textMut} />
          </TouchableOpacity>

          <View style={[s.divider, { backgroundColor: dividerBg }]} />

          <TouchableOpacity onPress={() => setFilterOpen(true)} style={s.filterBtn} activeOpacity={0.75}>
            <Ionicons name="options-outline" size={18} color={isFiltered ? theme.gold : theme.textMut} />
            {isFiltered && <View style={s.badge} />}
          </TouchableOpacity>

          <View style={[s.divider, { backgroundColor: dividerBg }]} />

          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={s.navBtn} activeOpacity={0.75}>
            <Ionicons name="person-outline" size={18} color={theme.textMut} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter sheet ── */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setFilterOpen(false)}>
          <Pressable onPress={() => {}} style={[s.sheet, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
            <Text style={[s.sheetTitle, { color: theme.textMut }]}>SHOW</Text>
            {FILTERS.map(f => {
              const active = filter === f.value
              return (
                <TouchableOpacity
                  key={f.value}
                  onPress={() => { setFilter(f.value); setFilterOpen(false) }}
                  style={[s.sheetOption, { borderBottomColor: theme.border }, active && { backgroundColor: theme.bg2 }]}
                >
                  <Text style={[s.sheetOptionText, { color: active ? theme.gold : theme.text, fontWeight: active ? '800' : '500' }]}>
                    {f.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={16} color={theme.gold} />}
                </TouchableOpacity>
              )
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  flex:        { flex: 1 },
  center:      { alignItems: 'center', paddingVertical: 80 },
  list:        { paddingHorizontal: 16 },
  row:         { gap: GAP, marginBottom: GAP },
  headerBlock: { marginBottom: 16 },
  title:       { fontSize: 24, fontWeight: '800' },
  subtitle:    { fontSize: 13, marginTop: 4 },
  empty:       { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji:  { fontSize: 48, marginBottom: 16 },
  emptyTitle:  { fontSize: 17, marginBottom: 8 },
  emptyLink:   {},

  pillWrap: {
    position: 'absolute', right: 16, zIndex: 100,
    borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 18, elevation: 8,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 28, overflow: 'hidden',
  },
  pillSpecular: {
    borderRadius: 28, borderWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    paddingHorizontal: 12, paddingVertical: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 9,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 4,
  },
  badge: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#dc2626',
    position: 'absolute', top: 6, right: 6,
  },
  divider: {
    width: 1, height: 16, marginHorizontal: 2,
  },

  // Filter sheet
  backdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:           { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingBottom: 32 },
  sheetTitle:      { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sheetOption:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionText: { fontSize: 15 },
})
