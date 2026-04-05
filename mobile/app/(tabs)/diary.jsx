import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  Alert, RefreshControl, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getDiary, deleteEntry, getInsights } from '../../lib/queries'
import EntryCard from '../../components/EntryCard'
import { C } from '../../constants/theme'

// Group entries by "Month YYYY"
function groupByMonth(entries) {
  const groups = []
  const map    = new Map()
  for (const e of entries) {
    const d = new Date(e.watched_on + 'T00:00:00')
    const key = d.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!map.has(key)) { map.set(key, []); groups.push(key) }
    map.get(key).push(e)
  }
  return groups.map(k => ({ month: k, entries: map.get(k) }))
}

function InsightsBar({ insights }) {
  if (!insights) return null
  const { totalMovies, totalTV, avgRating, thisMonth } = insights
  return (
    <View style={s.insightsBar}>
      <View style={s.stat}>
        <Text style={s.statVal}>{totalMovies}</Text>
        <Text style={s.statLbl}>Films</Text>
      </View>
      <View style={s.divider} />
      <View style={s.stat}>
        <Text style={s.statVal}>{totalTV}</Text>
        <Text style={s.statLbl}>TV Shows</Text>
      </View>
      <View style={s.divider} />
      <View style={s.stat}>
        <Text style={s.statVal}>{avgRating ? avgRating.toFixed(1) : '—'}</Text>
        <Text style={s.statLbl}>Avg ★</Text>
      </View>
      <View style={s.divider} />
      <View style={s.stat}>
        <Text style={s.statVal}>{thisMonth}</Text>
        <Text style={s.statLbl}>This Month</Text>
      </View>
    </View>
  )
}

export default function Diary() {
  const [entries,   setEntries]   = useState([])
  const [insights,  setInsights]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)
  const [error,     setError]     = useState('')
  const router = useRouter()

  const load = useCallback(async () => {
    setError('')
    try {
      const [data, ins] = await Promise.all([getDiary(), getInsights()])
      setEntries(data)
      setInsights(ins)
    } catch (err) {
      if (err?.code === 'PGRST205' || err?.message?.includes('schema cache')) {
        setError('Database tables not found. Please run supabase/schema.sql in your Supabase SQL Editor.')
      } else {
        setError(err.message)
      }
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function handleDelete(id) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteEntry(id)
          setEntries(prev => prev.filter(e => e.id !== id))
          const ins = insights
          if (ins) setInsights({ ...ins, totalEntries: ins.totalEntries - 1 })
        },
      },
    ])
  }

  const groups = groupByMonth(entries)

  // Build flat list data: section headers + entries
  const listData = []
  for (const g of groups) {
    listData.push({ type: 'header', month: g.month, key: `h-${g.month}` })
    for (const e of g.entries) {
      listData.push({ type: 'entry', entry: e, key: `e-${e.id}` })
    }
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={C.gold} /></View>
  }

  return (
    <View style={s.flex}>
      <FlatList
        data={listData}
        keyExtractor={item => item.key}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.gold} colors={[C.gold]} />
        }
        ListHeaderComponent={
          <View style={s.headerBlock}>
            <View style={s.titleRow}>
              <Text style={s.title}>My Diary</Text>
              <TouchableOpacity onPress={() => router.push('/log')} style={s.logBtn}>
                <Text style={s.logBtnText}>+ Log</Text>
              </TouchableOpacity>
            </View>
            {error ? (
              <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
            ) : (
              <InsightsBar insights={insights} />
            )}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📔</Text>
              <Text style={s.emptyTitle}>No entries yet.</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Text style={s.emptyLink}>Search for something to watch</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={s.monthHeader}>{item.month}</Text>
          }
          return (
            <View style={{ marginBottom: 10 }}>
              <EntryCard entry={item.entry} onDelete={handleDelete} />
            </View>
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:        { flex: 1, backgroundColor: C.bg0 },
  center:      { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center' },
  list:        { padding: 16, paddingBottom: 48 },
  headerBlock: { marginBottom: 16 },
  titleRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title:       { color: C.text, fontSize: 24, fontWeight: '800' },
  logBtn:      { backgroundColor: C.red, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  logBtnText:  { color: C.text, fontWeight: '700', fontSize: 13 },
  insightsBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg1, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  stat:        { flex: 1, alignItems: 'center' },
  statVal:     { color: C.gold, fontSize: 18, fontWeight: '700' },
  statLbl:     { color: C.textMut, fontSize: 10, marginTop: 2 },
  divider:     { width: 1, height: 30, backgroundColor: C.border },
  monthHeader: {
    color: C.textMut, fontSize: 12, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 20, marginBottom: 10,
    paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  empty:       { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji:  { fontSize: 48, marginBottom: 16 },
  emptyTitle:  { color: C.textSub, fontSize: 17, marginBottom: 8 },
  emptyLink:   { color: C.gold },
  errorBox:    { backgroundColor: '#3f0000', borderWidth: 1, borderColor: C.red, borderRadius: 12, padding: 14 },
  errorText:   { color: '#fca5a5', fontSize: 13, lineHeight: 18 },
})
