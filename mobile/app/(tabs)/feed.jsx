import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../api/client'
import EntryCard from '../../components/EntryCard'

export default function Feed() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    api.getFeed()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

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
            <Text className="text-white text-2xl font-bold">Friends' Activity</Text>
            <TouchableOpacity onPress={() => router.push('/users')}>
              <Text className="text-orange-400 text-sm">Find friends →</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-5xl mb-4">👥</Text>
            <Text className="text-gray-400 text-lg mb-2">Nothing to show yet.</Text>
            <TouchableOpacity onPress={() => router.push('/users')}>
              <Text className="text-orange-400">Follow some friends</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <EntryCard entry={item} showUser />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </View>
  )
}
