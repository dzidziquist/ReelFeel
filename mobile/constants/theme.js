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
  style:     'classic',
  fonts:     {},
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
  style:     'classic',
  fonts:     {},
}

// ── Ticket Stub style (opt-in) ────────────────────────────────
// Warm ink ground, paper-coloured "tickets", condensed display type.
// Font names are the PostScript names embedded via the expo-font plugin.
const TICKET_FONTS = {
  display:  'Anton-Regular',
  body:     'IBMPlexSans-Regular',
  medium:   'IBMPlexSans-Medium',
  semibold: 'IBMPlexSans-SemiBold',
  bold:     'IBMPlexSans-Bold',
  mono:     'IBMPlexMono-Medium',
  monoBold: 'IBMPlexMono-SemiBold',
}

export const TICKET_DARK = {
  ...DARK,
  bg0:       '#141110',
  bg1:       '#1d1917',
  bg2:       '#241f1c',
  bg3:       '#3a3330',
  border:    '#3a3330',
  text:      '#efe7d6',
  textSub:   '#c9c0b4',
  textMut:   '#958d83',
  red:       '#e8463c',
  redL:      '#f0675e',
  gold:      '#e0b23f',
  goldL:     '#ecc560',
  card:      '#1d1917',
  inputBg:   '#241f1c',
  tabBg:     '#0d0b0a',
  headerBg:  '#1d1917',
  shadowColor: '#000000',
  shadowOpacity: 0,
  paper:     '#efe7d6',
  ink:       '#141110',
  inkSub:    '#4a423c',
  perforation: '#8a8279',
  style:     'ticket',
  fonts:     TICKET_FONTS,
}

export const TICKET_LIGHT = {
  ...LIGHT,
  bg0:       '#f3ede1',
  bg1:       '#fbf8f1',
  bg2:       '#e8e0d0',
  bg3:       '#d9cfbc',
  border:    '#cfc4ae',
  text:      '#1a1614',
  textSub:   '#3a332e',
  textMut:   '#5c534c',
  red:       '#c8302b',
  redL:      '#b3261e',
  gold:      '#85600f',
  goldL:     '#b8892b',
  card:      '#fbf8f1',
  inputBg:   '#fbf8f1',
  tabBg:     '#fbf8f1',
  headerBg:  '#fbf8f1',
  shadowColor: '#000000',
  shadowOpacity: 0,
  paper:     '#fbf8f1',
  ink:       '#1a1614',
  inkSub:    '#5c534c',
  perforation: '#a89d8a',
  style:     'ticket',
  fonts:     TICKET_FONTS,
}

export const UI_STYLES = ['classic', 'ticket']

// Theme variant matrix: style → brightness → theme
export const THEME_VARIANTS = {
  classic: { dark: DARK,        light: LIGHT },
  ticket:  { dark: TICKET_DARK, light: TICKET_LIGHT },
}

// Default export stays DARK for backward-compat with existing imports
export const C = DARK
