import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as Linking from 'expo-linking'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import ErrorBoundary from '../components/ErrorBoundary'
import { supabase } from '../lib/supabase'

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
      <Stack.Screen name="media/[tmdbId]" options={{ headerShown: false }} />
    </Stack>
  )
}

function AppContent() {
  const { theme } = useTheme()
  const { loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg0, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.red} />
      </View>
    )
  }

  return (
    <>
      <AuthGuard />
      <AppStack />
    </>
  )
}

function DeepLinkHandler() {
  useEffect(() => {
    const handleUrl = async ({ url }) => {
      if (!url) return
      const hash = url.split('#')[1]
      if (!hash) return
      const params = Object.fromEntries(new URLSearchParams(hash))
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        })
      }
    }
    Linking.getInitialURL().then(url => { if (url) handleUrl({ url }) })
    const sub = Linking.addEventListener('url', handleUrl)
    return () => sub.remove()
  }, [])
  return null
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <DeepLinkHandler />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
