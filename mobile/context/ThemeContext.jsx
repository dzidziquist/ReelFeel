import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { DARK, LIGHT } from '../constants/theme'

const PREF_KEY = 'theme_mode'

const ThemeContext = createContext({
  theme:  DARK,
  isDark: true,
  mode:   'system',
  setMode: () => {},
})

export function ThemeProvider({ children }) {
  const systemScheme  = useColorScheme()                          // 'light' | 'dark' | null
  const [mode, setModeState] = useState('system')                 // 'system' | 'dark' | 'light'

  // Load persisted preference on mount
  useEffect(() => {
    SecureStore.getItemAsync(PREF_KEY)
      .then(saved => { if (saved) setModeState(saved) })
      .catch(() => {})
  }, [])

  const setMode = useCallback(async (newMode) => {
    setModeState(newMode)
    try { await SecureStore.setItemAsync(PREF_KEY, newMode) } catch (_) {}
  }, [])

  // Resolve effective scheme
  const effectiveScheme =
    mode === 'system' ? (systemScheme ?? 'dark') : mode

  const isDark = effectiveScheme === 'dark'
  const theme  = isDark ? DARK : LIGHT

  return (
    <ThemeContext.Provider value={{ theme, isDark, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
