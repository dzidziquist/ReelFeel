import '../global.css'
import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../context/AuthContext'

function AuthGuard() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!user && !inAuth) {
      router.replace('/(auth)/login')
    } else if (user && inAuth) {
      router.replace('/(tabs)')
    }
  }, [user, loading])

  return null
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="log"
          options={{ presentation: 'modal', title: 'Log Entry', headerStyle: { backgroundColor: '#111827' }, headerTintColor: '#fff' }}
        />
        <Stack.Screen
          name="media/[tmdbId]"
          options={{ title: '', headerStyle: { backgroundColor: '#111827' }, headerTintColor: '#fff' }}
        />
        <Stack.Screen
          name="users/index"
          options={{ title: 'People', headerStyle: { backgroundColor: '#111827' }, headerTintColor: '#fff' }}
        />
        <Stack.Screen
          name="users/[id]"
          options={{ title: '', headerStyle: { backgroundColor: '#111827' }, headerTintColor: '#fff' }}
        />
      </Stack>
    </AuthProvider>
  )
}
