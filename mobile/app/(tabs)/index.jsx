import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../api/client'
import EntryCard from '../../components/EntryCard'
import { useAuth } from '../../context/AuthContext'

export default function Diary() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    api.getDiary()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.deleteEntry(id)
          setEntries(prev => prev.filter(e => e.id !== id))
        },
      },
    ])
  }

  if (loading) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator color="#f97316" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-950">
      <FlatList
        data={entries}
        keyExtractor={e => String(e.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white text-2xl font-bold">My Diary</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => router.push('/log')}>
                <Text className="text-orange-400 font-semibold">+ Log</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={logout}>
                <Text className="text-gray-500 text-sm">Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-5xl mb-4">🎥</Text>
            <Text className="text-gray-400 text-lg mb-2">No entries yet.</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text className="text-orange-400">Search for something to watch</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <EntryCard entry={item} onDelete={handleDelete} />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </View>
  )
}
