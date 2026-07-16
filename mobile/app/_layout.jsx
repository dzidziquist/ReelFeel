import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, AppState } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as Linking from 'expo-linking'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import ErrorBoundary from '../components/ErrorBoundary'
import { supabase } from '../lib/supabase'
import { getDiary, getWatchlist, getInsights } from '../lib/queries'
import { updateWidgetEntry, updateWidgetWatchlist, updateWidgetStats } from '../lib/widgetBridge'

function WidgetRefresher() {
  const { user } = useAuth()

  async function refresh() {
    if (!user) return
    try {
      const [diary, watchlist, insights] = await Promise.all([getDiary(), getWatchlist(), getInsights()])
      updateWidgetEntry(diary)
      updateWidgetWatchlist(watchlist)
      updateWidgetStats(insights)
    } catch (_) {}
  }

  useEffect(() => { refresh() }, [user])

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh()
    })
    return () => sub.remove()
  }, [user])

  return null
}

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
      <WidgetRefresher />
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
