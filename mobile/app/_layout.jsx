import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import ErrorBoundary from '../components/ErrorBoundary'

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
