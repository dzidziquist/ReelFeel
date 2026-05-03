// ── Dark theme (default) ─────────────────────────────────────
export const DARK = {
  bg0:       '#000000',   // page backgrounds
  bg1:       '#111111',   // card / header backgrounds
  bg2:       '#1c1c1e',   // inputs, secondary surfaces
  bg3:       '#2c2c2e',   // elevated surfaces
  border:    '#2a2a2a',   // subtle border
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
  // Semantic
  card:      '#111111',
  inputBg:   '#1c1c1e',
  tabBg:     '#000000',
  headerBg:  '#111111',
  // Status bar
  statusBar: 'light-content',
}

// ── Light theme ───────────────────────────────────────────────
export const LIGHT = {
  bg0:       '#f2f2f7',   // page backgrounds
  bg1:       '#ffffff',   // card / header backgrounds
  bg2:       '#e5e5ea',   // inputs, secondary surfaces
  bg3:       '#d1d1d6',   // elevated surfaces
  border:    '#c6c6c8',   // subtle border
  text:      '#000000',
  textSub:   '#1c1c1e',   // near-black — primary secondary text
  textMut:   '#3c3c43',   // dark gray — muted/hint text
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
  // Semantic
  card:      '#ffffff',
  inputBg:   '#f2f2f7',
  tabBg:     '#f8f8f8',
  headerBg:  '#ffffff',
  // Status bar
  statusBar: 'dark-content',
}

// Default export stays DARK for backward-compat with existing imports
export const C = DARK
