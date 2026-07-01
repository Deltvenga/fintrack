export type Theme = 'light' | 'dark' | 'girly' | 'girly2' | 'synth' | 'system'

export type ResolvedTheme = 'light' | 'dark' | 'girly' | 'girly2' | 'synth'

export type DecorativeTheme = 'girly' | 'girly2' | 'synth'

export const THEME_STORAGE_KEY = 'fintrack-theme'

const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#059669',
  dark: '#020617',
  girly: '#f9a8d4',
  girly2: '#c4b5fd',
  synth: '#12082a',
}

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (
    stored === 'light' ||
    stored === 'dark' ||
    stored === 'girly' ||
    stored === 'girly2' ||
    stored === 'synth' ||
    stored === 'system'
  ) {
    return stored
  }
  return 'system'
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'girly' || theme === 'girly2' || theme === 'synth') {
    return theme
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
  root.classList.remove('dark', 'girly', 'girly2', 'synth')
  root.style.colorScheme = resolved === 'dark' || resolved === 'synth' ? 'dark' : 'light'

  if (resolved === 'dark') {
    root.classList.add('dark')
  }

  if (resolved === 'girly') {
    root.classList.add('girly')
  }

  if (resolved === 'girly2') {
    root.classList.add('girly2')
  }

  if (resolved === 'synth') {
    root.classList.add('synth')
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
  if (theme === 'girly') return 'girly2'
  if (theme === 'girly2') return 'synth'
  return 'system'
}

export function isDecorativeTheme(resolved: ResolvedTheme): resolved is DecorativeTheme {
  return resolved === 'girly' || resolved === 'girly2' || resolved === 'synth'
}
