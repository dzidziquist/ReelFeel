import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'

function AuthGuard() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router   = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!user && !inAuth) router.replace('/(auth)/login')
    else if (user && inAuth) router.replace('/(tabs)')
  }, [user, loading])

  return null
}

function AppStack() {
  const { theme } = useTheme()
  const hdr = { backgroundColor: theme.headerBg }
  return (
    <Stack>
      <Stack.Screen name="(auth)"         options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)"         options={{ headerShown: false }} />
      <Stack.Screen name="log"            options={{ presentation: 'modal', title: 'Log Entry', headerStyle: hdr, headerTintColor: theme.text }} />
      <Stack.Screen name="media/[tmdbId]" options={{ title: '', headerStyle: hdr, headerTintColor: theme.text }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard />
        <AppStack />
      </AuthProvider>
    </ThemeProvider>
  )
}
