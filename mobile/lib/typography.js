// Style-specific type overrides. Classic returns null so existing styles are
// untouched; Ticket Stub swaps in its embedded fonts. Custom fonts carry their
// own weight, so fontWeight is reset to avoid iOS picking a fallback face.

// Screen titles and big numbers: condensed poster lettering.
export function displayType(theme) {
  if (!theme.fonts?.display) return null
  return { fontFamily: theme.fonts.display, fontWeight: 'normal', letterSpacing: 0.5, textTransform: 'uppercase' }
}

// Body copy at a given weight: 'regular' | 'medium' | 'semibold' | 'bold'.
export function bodyType(theme, weight = 'regular') {
  if (!theme.fonts?.body) return null
  const family = weight === 'regular' ? theme.fonts.body : theme.fonts[weight]
  return { fontFamily: family ?? theme.fonts.body, fontWeight: 'normal' }
}

// Dates, counts, ticket numbers.
export function monoType(theme, bold = false) {
  if (!theme.fonts?.mono) return null
  return { fontFamily: bold ? theme.fonts.monoBold : theme.fonts.mono, fontWeight: 'normal' }
}
