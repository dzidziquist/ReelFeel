import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { DARK, THEME_VARIANTS } from '../constants/theme'

const PREF_KEY       = 'theme_mode'
const NAV_LABELS_KEY = 'navbar_show_labels'

const ThemeContext = createContext({
  theme:               DARK,
  isDark:              true,
  mode:                'system',
  setMode:             () => {},
  navbarShowLabels:    false,
  setNavbarShowLabels: () => {},
})

export function ThemeProvider({ children }) {
  const systemScheme   = useColorScheme()
  const [mode,             setModeState] = useState('system')
  const [navbarShowLabels, setNavLabels] = useState(false)

  useEffect(() => {
    SecureStore.getItemAsync(PREF_KEY)
      .then(saved => { if (saved) setModeState(saved) })
      .catch(() => {})
    SecureStore.getItemAsync(NAV_LABELS_KEY)
      .then(saved => { if (saved !== null) setNavLabels(saved === 'true') })
      .catch(() => {})
  }, [])

  const setMode = useCallback((newMode) => {
    setModeState(newMode)
    SecureStore.setItemAsync(PREF_KEY, newMode).catch(() => {})
  }, [])

  const setNavbarShowLabels = useCallback((val) => {
    setNavLabels(val)
    SecureStore.setItemAsync(NAV_LABELS_KEY, String(val)).catch(() => {})
  }, [])

  const brightness = mode === 'system' ? (systemScheme ?? 'dark') : mode
  const isDark     = brightness === 'dark'
  const theme      = THEME_VARIANTS[brightness] ?? DARK

  const value = useMemo(
    () => ({ theme, isDark, mode, setMode, navbarShowLabels, setNavbarShowLabels }),
    [theme, isDark, mode, navbarShowLabels]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
