/** Local calendar date as YYYY-MM-DD (never UTC, so a late session stays on the right day). */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Monday-start week. Returns the YYYY-MM-DD of the Monday for the given date. */
export function weekStartKey(d: Date = new Date()): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (copy.getDay() + 6) % 7 // Mon=0 … Sun=6
  copy.setDate(copy.getDate() - dow)
  return todayKey(copy)
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return todayKey(d)
}

export function formatLong(key: string): string {
  return parseKey(key).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatShort(key: string): string {
  return parseKey(key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function daysBetween(fromKey: string, toKey: string): number {
  const a = parseKey(fromKey).getTime()
  const b = parseKey(toKey).getTime()
  return Math.round((b - a) / 86_400_000)
}
