import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { DARK, THEME_VARIANTS, UI_STYLES } from '../constants/theme'

const PREF_KEY       = 'theme_mode'
const NAV_LABELS_KEY = 'navbar_show_labels'
const UI_STYLE_KEY   = 'ui_style'

const ThemeContext = createContext({
  theme:               DARK,
  isDark:              true,
  mode:                'system',
  setMode:             () => {},
  navbarShowLabels:    false,
  setNavbarShowLabels: () => {},
  uiStyle:             'classic',
  setUiStyle:          () => {},
})

export function ThemeProvider({ children }) {
  const systemScheme   = useColorScheme()
  const [mode,             setModeState] = useState('system')
  const [navbarShowLabels, setNavLabels] = useState(false)
  const [uiStyle,          setStyleState] = useState('classic')

  useEffect(() => {
    SecureStore.getItemAsync(PREF_KEY)
      .then(saved => { if (saved) setModeState(saved) })
      .catch(() => {})
    SecureStore.getItemAsync(NAV_LABELS_KEY)
      .then(saved => { if (saved !== null) setNavLabels(saved === 'true') })
      .catch(() => {})
    SecureStore.getItemAsync(UI_STYLE_KEY)
      .then(saved => { if (UI_STYLES.includes(saved)) setStyleState(saved) })
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

  const setUiStyle = useCallback((val) => {
    setStyleState(val)
    SecureStore.setItemAsync(UI_STYLE_KEY, val).catch(() => {})
  }, [])

  const brightness = mode === 'system' ? (systemScheme ?? 'dark') : mode
  const isDark     = brightness === 'dark'
  const theme      = THEME_VARIANTS[uiStyle]?.[brightness] ?? DARK

  const value = useMemo(
    () => ({ theme, isDark, mode, setMode, navbarShowLabels, setNavbarShowLabels, uiStyle, setUiStyle }),
    [theme, isDark, mode, navbarShowLabels, uiStyle]
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
