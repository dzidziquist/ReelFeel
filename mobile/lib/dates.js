// 'YYYY-MM-DD' in the device's local timezone. Never use toISOString() for
// calendar days: it converts to UTC and shifts the date for non-UTC users.
export function toLocalDateString(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Shift a 'YYYY-MM-DD' string by n calendar days.
export function addDaysToDateString(str, n) {
  const d = new Date(str + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return toLocalDateString(d)
}
