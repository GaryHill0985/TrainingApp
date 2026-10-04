export type ThemeName = 'athletic_dark' | 'light_highcontrast'
const KEY = 'lt.theme'

export function getTheme(): ThemeName {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'athletic_dark' || v === 'light_highcontrast') return v
  } catch { /* storage unavailable */ }
  return 'athletic_dark'
}

export function applyTheme(name: ThemeName) {
  document.documentElement.dataset.theme = name === 'light_highcontrast' ? 'light' : 'dark'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', name === 'light_highcontrast' ? '#FFFFFF' : '#0E1116')
}

export function setTheme(name: ThemeName) {
  try { localStorage.setItem(KEY, name) } catch { /* ignore */ }
  applyTheme(name)
}

/** Which position-chip palette matches the current theme. */
export function chipPalette(): 'dark' | 'light' {
  return getTheme() === 'light_highcontrast' ? 'light' : 'dark'
}
