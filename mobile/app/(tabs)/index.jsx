import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { getDiary, deleteEntry } from '../../lib/queries'
import EntryCard from '../../components/EntryCard'
import { useAuth } from '../../context/AuthContext'
import { C } from '../../constants/theme'

export default function Diary() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    getDiary().then(setEntries).finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteEntry(id)
          setEntries(prev => prev.filter(e => e.id !== id))
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={C.gold} />
      </View>
    )
  }

  return (
    <View style={s.flex}>
      <FlatList
        data={entries}
        keyExtractor={e => String(e.id)}
        contentContainerStyle={s.list}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.title}>My Diary</Text>
            <View style={s.headerActions}>
              <TouchableOpacity onPress={() => router.push('/log')}>
                <Text style={s.logBtn}>+ Log</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={logout}>
                <Text style={s.signOut}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🎥</Text>
            <Text style={s.emptyTitle}>No entries yet.</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text style={s.emptyLink}>Search for something to watch</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <EntryCard entry={item} onDelete={handleDelete} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  )
}

const s = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: C.bg0 },
  center:        { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center' },
  list:          { padding: 16, paddingBottom: 40 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:         { color: C.text, fontSize: 22, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 12 },
  logBtn:        { color: C.gold, fontWeight: '600' },
  signOut:       { color: C.textMut, fontSize: 13 },
  empty:         { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:    { color: C.textSub, fontSize: 17, marginBottom: 8 },
  emptyLink:     { color: C.gold },
})
