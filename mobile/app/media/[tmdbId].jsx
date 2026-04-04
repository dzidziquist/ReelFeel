import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, ImageBackground,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { api } from '../../api/client'
import EntryCard from '../../components/EntryCard'
import { StarDisplay } from '../../components/StarRating'

export default function MediaDetail() {
  const { tmdbId } = useLocalSearchParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMedia(tmdbId)
      .then(setData)
      .catch(() => router.back())
      .finally(() => setLoading(false))
  }, [tmdbId])

  async function handleDelete(id) {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await api.deleteEntry(id)
          setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
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
  if (!data) return null

  const { media, entries, avg_rating } = data

  return (
    <ScrollView className="flex-1 bg-gray-950" contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Backdrop */}
      {media.backdrop_url
        ? (
          <ImageBackground
            source={{ uri: media.backdrop_url }}
            style={{ height: 180 }}
            resizeMode="cover"
          >
            <View className="absolute inset-0" style={{ backgroundColor: 'rgba(17,24,39,0.65)' }} />
          </ImageBackground>
        )
        : null
      }

      {/* Header */}
      <View className="flex-row gap-4 px-4 pt-4 pb-4" style={{ marginTop: media.backdrop_url ? -60 : 0 }}>
        {media.poster_url
          ? (
            <Image
              source={{ uri: media.poster_url }}
              style={{ width: 100, height: 150, borderRadius: 12, elevation: 8 }}
              resizeMode="cover"
            />
          )
          : null
        }
        <View className="flex-1 pt-2">
          <Text className="text-white text-2xl font-bold leading-tight">{media.title}</Text>
          {media.year ? <Text className="text-gray-400 text-base">({media.year})</Text> : null}
          <View className="flex-row flex-wrap gap-2 mt-1">
            <View
              className="rounded border px-1.5 py-0.5"
              style={{ borderColor: media.media_type === 'film' ? '#1d4ed8' : '#7e22ce' }}
            >
              <Text className="text-xs" style={{ color: media.media_type === 'film' ? '#60a5fa' : '#c084fc' }}>
                {media.media_type === 'film' ? 'Film' : 'TV Show'}
              </Text>
            </View>
            {(media.genres || []).map(g => (
              <Text key={g} className="text-gray-500 text-xs">{g}</Text>
            ))}
          </View>
          {media.runtime ? <Text className="text-gray-500 text-xs mt-1">{media.runtime} min</Text> : null}

          <View className="flex-row gap-4 mt-3 items-center">
            {avg_rating != null && (
              <View>
                <Text className="text-orange-400 text-2xl font-bold font-mono">{avg_rating}</Text>
                <Text className="text-gray-500 text-xs">your avg</Text>
              </View>
            )}
            {media.tmdb_rating && (
              <View>
                <Text className="text-yellow-400 text-xl font-bold font-mono">{media.tmdb_rating.toFixed(1)}</Text>
                <Text className="text-gray-500 text-xs">TMDB / 10</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {media.overview
        ? <Text className="text-gray-300 text-sm px-4 mb-4 leading-relaxed">{media.overview}</Text>
        : null
      }

      <TouchableOpacity
        onPress={() => router.push(`/log?tmdb_id=${media.tmdb_id}&type=${media.media_type}`)}
        className="mx-4 mb-6 bg-orange-600 rounded-xl py-3 items-center"
      >
        <Text className="text-white font-semibold">+ Log entry</Text>
      </TouchableOpacity>

      {/* Entries */}
      <View className="px-4">
        <Text className="text-white text-lg font-semibold mb-3 pb-2 border-b border-gray-800">
          Your entries <Text className="text-gray-500 font-normal text-base">({entries.length})</Text>
        </Text>
        {entries.length === 0
          ? <Text className="text-gray-500 text-center py-8">You haven't logged this yet.</Text>
          : entries.map((e, i) => (
            <View key={e.id} style={{ marginBottom: i < entries.length - 1 ? 12 : 0 }}>
              <EntryCard entry={e} onDelete={handleDelete} />
            </View>
          ))
        }
      </View>
    </ScrollView>
  )
}
