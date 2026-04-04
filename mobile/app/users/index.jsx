import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../api/client'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  async function toggleFollow(user) {
    try {
      if (user.is_following) {
        await api.unfollow(user.id)
      } else {
        await api.follow(user.id)
      }
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, is_following: !u.is_following } : u
      ))
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

  return (
    <View className="flex-1 bg-gray-950">
      <FlatList
        data={users}
        keyExtractor={u => String(u.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text className="text-5xl mb-4">👤</Text>
            <Text className="text-gray-400">No other users yet. Share the app!</Text>
          </View>
        }
        renderItem={({ item: u }) => (
          <View className="bg-gray-900 rounded-xl flex-row items-center justify-between p-4 mb-3">
            <TouchableOpacity
              className="flex-row items-center gap-3"
              onPress={() => router.push(`/users/${u.id}`)}
            >
              <View className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center">
                <Text className="text-gray-300 font-bold text-lg">{u.username[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text className="text-white font-medium">{u.username}</Text>
                <Text className="text-gray-500 text-xs">Joined {new Date(u.date_joined).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleFollow(u)}
              className="px-4 py-1.5 rounded-lg border"
              style={{
                borderColor: u.is_following ? '#4b5563' : '#0d9488',
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: u.is_following ? '#9ca3af' : '#2dd4bf' }}
              >
                {u.is_following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  )
}
