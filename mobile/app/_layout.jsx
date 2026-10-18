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
  const { user, loading, recoverySession } = useAuth()
  const segments = useSegments()
  const router   = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === '(auth)'
    if (!user && !inAuth) router.replace('/(auth)/login')
    // A password-reset session is signed in but must stay on the reset screen
    else if (user && inAuth && !recoverySession) router.replace('/(tabs)')
  }, [user, loading, recoverySession])

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
      <DeepLinkHandler />
      <WidgetRefresher />
      <AppStack />
    </>
  )
}

function DeepLinkHandler() {
  const { beginRecovery, cancelRecovery } = useAuth()
  const router  = useRouter()
  const handled = useRef(new Set())

  useEffect(() => {
    // Email links (PKCE flow) arrive as reelfeel://reset-password?code=...
    // Tokens in a URL fragment (the old implicit flow) are deliberately
    // ignored: anyone could craft such a link with their own account's tokens.
    const handleUrl = async ({ url }) => {
      if (!url) return
      const { hostname, path, queryParams = {} } = Linking.parse(url)
      // reelfeel://reset-password parses as hostname, https://…/reset-password as path
      const isReset = [hostname, path].some(p => (p ?? '').replace(/^\/+|\/+$/g, '') === 'reset-password')

      if (queryParams.error) {
        Alert.alert('Link expired', 'This link is invalid or has expired. Please request a new one.')
        if (isReset) router.replace('/(auth)/forgot-password')
        return
      }

      const code = queryParams.code
      if (!code || handled.current.has(code)) return
      handled.current.add(code)

      if (isReset) beginRecovery()
      const { data, error } = await supabase.auth.exchangeCodeForSession(String(code))
        .catch(err => ({ data: null, error: err }))
      if (error) {
        if (isReset) cancelRecovery()
        Alert.alert(
          'Could not open link',
          'Open the email link on the same device you requested it from, or request a new one.',
        )
        if (isReset) router.replace('/(auth)/forgot-password')
        return
      }
      if (data?.redirectType === 'PASSWORD_RECOVERY' && !isReset) {
        beginRecovery()
        router.replace('/(auth)/reset-password')
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
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
