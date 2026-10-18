import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, AppState, Alert } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as Linking from 'expo-linking'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import ErrorBoundary from '../components/ErrorBoundary'
import { supabase } from '../lib/supabase'
import { getDiary, getWatchlist, getInsights, invalidateInsightsCache } from '../lib/queries'
import { updateWidgetEntry, updateWidgetWatchlist, updateWidgetStats, clearWidget } from '../lib/widgetBridge'

function WidgetRefresher() {
  const { user } = useAuth()
  const lastRefresh = useRef(0)

  async function refresh(force = false) {
    if (!user) return
    const now = Date.now()
    if (!force && now - lastRefresh.current < 5 * 60 * 1000) return
    lastRefresh.current = now
    try {
      const [diary, watchlist, insights] = await Promise.all([getDiary(), getWatchlist(), getInsights()])
      updateWidgetEntry(diary)
      updateWidgetWatchlist(watchlist)
      updateWidgetStats(insights)
    } catch (_) {}
  }

  useEffect(() => {
    if (!user) {
      invalidateInsightsCache()
      clearWidget()
      return
    }
    refresh(true)
  }, [user])

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
      if (!params.access_token || !params.refresh_token) return
      const apply = () => supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      }).catch(() => {})

      // A crafted link could carry someone else's tokens. Never silently swap
      // out the signed-in account: ask first if the link is for another user.
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { await apply(); return }
      const { data: { user: linkUser } } = await supabase.auth.getUser(params.access_token)
      if (!linkUser) return
      if (linkUser.id === session.user.id) { await apply(); return }
      Alert.alert(
        'Switch account?',
        `This link signs you in as ${linkUser.email ?? 'a different account'}. You are signed in as ${session.user.email}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch', style: 'destructive', onPress: apply },
        ]
      )
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
