import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { StarDisplay } from './StarRating'

export default function EntryCard({ entry, showUser = false, onDelete }) {
  const { media } = entry
  const router = useRouter()

  return (
    <View className="bg-gray-900 rounded-xl flex-row gap-3 p-3">
      {/* Poster */}
      <TouchableOpacity onPress={() => router.push(`/media/${media.tmdb_id}`)}>
        {media.poster_url
          ? <Image source={{ uri: media.poster_url }} style={{ width: 56, height: 80, borderRadius: 8 }} resizeMode="cover" />
          : (
            <View className="bg-gray-700 rounded-lg items-center justify-center" style={{ width: 56, height: 80 }}>
              <Text className="text-2xl">🎬</Text>
            </View>
          )
        }
      </TouchableOpacity>

      {/* Info */}
      <View className="flex-1 min-w-0">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 min-w-0">
            <TouchableOpacity onPress={() => router.push(`/media/${media.tmdb_id}`)}>
              <Text className="text-white font-semibold" numberOfLines={1}>{media.title}</Text>
            </TouchableOpacity>
            <View className="flex-row items-center gap-1.5 mt-0.5 flex-wrap">
              {media.year ? <Text className="text-gray-500 text-xs">({media.year})</Text> : null}
              <View
                className="rounded border px-1 py-0.5"
                style={{ borderColor: media.media_type === 'film' ? '#1e3a8a' : '#581c87' }}
              >
                <Text className="text-xs" style={{ color: media.media_type === 'film' ? '#60a5fa' : '#c084fc' }}>
                  {media.media_type === 'film' ? 'Film' : 'TV'}
                </Text>
              </View>
              {entry.rewatch
                ? (
                  <View className="rounded border border-yellow-800 px-1 py-0.5">
                    <Text className="text-yellow-500 text-xs">rewatch</Text>
                  </View>
                )
                : null
              }
              {showUser && entry.user
                ? (
                  <TouchableOpacity onPress={() => router.push(`/users/${entry.user.id}`)}>
                    <Text className="text-gray-500 text-xs">by <Text className="text-orange-400">{entry.user.username}</Text></Text>
                  </TouchableOpacity>
                )
                : null
              }
            </View>
          </View>
          <Text className="text-gray-500 text-xs flex-shrink-0">{entry.watched_on}</Text>
        </View>

        <View className="flex-row items-center gap-2 mt-1.5">
          <StarDisplay rating={entry.rating} />
          <Text className="text-orange-400 font-mono text-sm">{entry.rating}/5</Text>
        </View>

        {entry.emotions.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mt-2">
            {entry.emotions.map(e => (
              <View
                key={e.id}
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: e.color + '22', borderWidth: 1, borderColor: e.color + '55' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: e.color }}>
                  {e.icon} {e.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {entry.review
          ? <Text className="text-gray-400 text-xs mt-1.5 italic" numberOfLines={2}>"{entry.review}"</Text>
          : null
        }
      </View>

      {/* Delete action */}
      {onDelete && (
        <View className="justify-start gap-2 flex-shrink-0">
          <TouchableOpacity onPress={() => router.push(`/log?edit=${entry.id}`)}>
            <Text className="text-gray-500 text-xs">edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(entry.id)}>
            <Text className="text-red-500 text-xs">del</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
