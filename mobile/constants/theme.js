// ── Dark theme (default) ─────────────────────────────────────
export const DARK = {
  bg0:       '#000000',
  bg1:       '#111111',
  bg2:       '#1c1c1e',
  bg3:       '#2c2c2e',
  border:    '#2a2a2a',
  text:      '#ffffff',
  textSub:   '#a3a3a3',
  textMut:   '#6b6b6b',
  red:       '#dc2626',
  redL:      '#ef4444',
  gold:      '#d4af37',
  goldL:     '#f0c842',
  violet:    '#7c3aed',
  violetL:   '#a78bfa',
  pink:      '#ec4899',
  pinkL:     '#f472b6',
  success:   '#22c55e',
  info:      '#3b82f6',
  card:      '#111111',
  inputBg:   '#1c1c1e',
  tabBg:     '#000000',
  headerBg:  '#111111',
  shadowColor: '#ffffff',
  shadowOpacity: 0.18,
  statusBar: 'light-content',
}

// ── Light theme ───────────────────────────────────────────────
export const LIGHT = {
  bg0:       '#f2f2f7',
  bg1:       '#ffffff',
  bg2:       '#e5e5ea',
  bg3:       '#d1d1d6',
  border:    '#c6c6c8',
  text:      '#000000',
  textSub:   '#1c1c1e',
  textMut:   '#3c3c43',
  red:       '#dc2626',
  redL:      '#ef4444',
  gold:      '#b8860b',
  goldL:     '#d4af37',
  violet:    '#7c3aed',
  violetL:   '#8b5cf6',
  pink:      '#db2777',
  pinkL:     '#ec4899',
  success:   '#16a34a',
  info:      '#2563eb',
  card:      '#ffffff',
  inputBg:   '#f2f2f7',
  tabBg:     '#f8f8f8',
  headerBg:  '#ffffff',
  shadowColor: '#000000',
  shadowOpacity: 0.8,
  statusBar: 'dark-content',
}

// Theme variant matrix: brightness → theme
export const THEME_VARIANTS = {
  dark:  DARK,
  light: LIGHT,
}

// Default export stays DARK for backward-compat with existing imports
export const C = DARK
