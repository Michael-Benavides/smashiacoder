const THEME_KEY = 'wi_theme'
const ACCENT_KEY = 'wi_accent_color'
const DENSITY_KEY = 'wi_density'

const ACCENT_CLASSES = [
  'accent-zinc', 'accent-blue', 'accent-green',
  'accent-orange', 'accent-red', 'accent-violet',
]

export const ACCENT_OPTIONS = [
  { id: 'zinc', label: 'Zinc', swatch: '#18181B' },
  { id: 'blue', label: 'Azul', swatch: '#2563EB' },
  { id: 'green', label: 'Verde', swatch: '#16A34A' },
  { id: 'orange', label: 'Naranja', swatch: '#EA580C' },
  { id: 'red', label: 'Rojo', swatch: '#DC2626' },
  { id: 'violet', label: 'Violeta', swatch: '#7C3AED' },
]

export function applyAccentColor(color) {
  const root = document.documentElement
  root.classList.remove(...ACCENT_CLASSES)
  root.classList.add(`accent-${color}`)
  root.dataset.accent = color
  localStorage.setItem(ACCENT_KEY, color)
  return color
}

function resolveDark(mode) {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyDarkMode(mode) {
  const root = document.documentElement
  const isDark = resolveDark(mode)
  root.classList.toggle('dark', isDark)
  localStorage.setItem(THEME_KEY, mode)
  return mode
}

export function applyDensity(density) {
  document.documentElement.dataset.density = density
  localStorage.setItem(DENSITY_KEY, density)
  return density
}

export function getStoredTheme() {
  return {
    mode: localStorage.getItem(THEME_KEY) || 'light',
    accent: localStorage.getItem(ACCENT_KEY) || 'zinc',
    density: localStorage.getItem(DENSITY_KEY) || 'normal',
  }
}

export function applyTheme(partial = {}) {
  const stored = getStoredTheme()
  const mode = partial.mode ?? stored.mode
  const accent = partial.accent ?? stored.accent
  const density = partial.density ?? stored.density

  applyDarkMode(mode)
  applyAccentColor(accent)
  applyDensity(density)

  return { mode, accent, density }
}

let systemListenerAttached = false

export function initPreferences() {
  const stored = getStoredTheme()

  applyDarkMode(stored.mode)
  applyAccentColor(stored.accent)
  applyDensity(stored.density)

  if (!systemListenerAttached && stored.mode === 'system') {
    systemListenerAttached = true
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (localStorage.getItem(THEME_KEY) === 'system') {
        applyDarkMode('system')
      }
    })
  }

  return stored
}

/** @deprecated use initPreferences */
export function initTheme() {
  return initPreferences()
}
