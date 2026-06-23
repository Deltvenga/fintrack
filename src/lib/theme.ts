export type Theme = 'light' | 'dark' | 'girly' | 'system'

export type ResolvedTheme = 'light' | 'dark' | 'girly'

export const THEME_STORAGE_KEY = 'fintrack-theme'

const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#059669',
  dark: '#020617',
  girly: '#e879f9',
}

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'girly' || stored === 'system') {
    return stored
  }
  return 'system'
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'girly') {
    return 'girly'
  }

  if (theme === 'light') {
    return 'light'
  }

  if (theme === 'dark') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove('dark', 'girly')
  root.style.colorScheme = resolved === 'dark' ? 'dark' : 'light'

  if (resolved === 'dark') {
    root.classList.add('dark')
  }

  if (resolved === 'girly') {
    root.classList.add('girly')
  }

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', THEME_COLORS[resolved])
  }
}

export function applyTheme(theme: Theme) {
  applyResolvedTheme(resolveTheme(theme))
}

export function cycleTheme(theme: Theme): Theme {
  if (theme === 'system') return 'light'
  if (theme === 'light') return 'dark'
  if (theme === 'dark') return 'girly'
  return 'system'
}
