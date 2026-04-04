import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { api } from '../../api/client'
import EntryCard from '../../components/EntryCard'

export default function UserProfile() {
  const { id } = useLocalSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProfile(id)
      .then(setData)
      .finally(() => setLoading(false))
  }, [id])

  async function toggleFollow() {
    if (!data) return
    try {
      if (data.user.is_following) {
        await api.unfollow(data.user.id)
      } else {
        await api.follow(data.user.id)
      }
      setData(prev => ({ ...prev, user: { ...prev.user, is_following: !prev.user.is_following } }))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator color="#f97316" />
      </View>
    )
  }
  if (!data) return null

  const { user, entries } = data

  return (
    <View className="flex-1 bg-gray-950">
      <FlatList
        data={entries}
        keyExtractor={e => String(e.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View>
            {/* Profile header */}
            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-row items-center gap-4">
                <View className="w-16 h-16 rounded-full bg-gray-800 items-center justify-center">
                  <Text className="text-white text-2xl font-bold">{user.username[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">{user.username}</Text>
                  <Text className="text-gray-500 text-sm">Joined {new Date(user.date_joined).toLocaleDateString()}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={toggleFollow}
                className="px-5 py-2 rounded-xl border"
                style={{ borderColor: user.is_following ? '#4b5563' : '#0d9488' }}
              >
                <Text className="font-medium" style={{ color: user.is_following ? '#9ca3af' : '#2dd4bf' }}>
                  {user.is_following ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-white text-lg font-semibold mb-3 pb-2 border-b border-gray-800">
              Recent watches <Text className="text-gray-500 font-normal">({entries.length})</Text>
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="text-gray-500 text-center py-8">No entries yet.</Text>
        }
        renderItem={({ item }) => <EntryCard entry={item} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
      />
    </View>
  )
}
