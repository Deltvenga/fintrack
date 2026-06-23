import { useTheme } from './ThemeProvider'

const LABELS = {
  light: 'Светлая тема',
  dark: 'Тёмная тема',
  system: 'Системная тема',
} as const

const ICONS = {
  light: '☀️',
  dark: '🌙',
  system: '💻',
} as const

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
    >
      {ICONS[theme]}
    </button>
  )
}
