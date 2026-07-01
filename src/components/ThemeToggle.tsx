import { useTheme } from './ThemeProvider'
import { ThemeSparkleBurst } from './GirlyAmbience'
import { isDecorativeTheme, type DecorativeTheme } from '../lib/theme'

const LABELS = {
  light: 'Светлая тема',
  dark: 'Тёмная тема',
  girly: 'Девчачья тема (розовая)',
  girly2: 'Девчачья тема (лавандовая)',
  synth: 'Синтвейв',
  acid: 'Кислота',
  system: 'Системная тема',
} as const

const ICONS = {
  light: '☀️',
  dark: '🌙',
  girly: '💖',
  girly2: '💜',
  synth: '🌆',
  acid: '🌀',
  system: '💻',
} as const

const TOGGLE_ICON_CLASS: Partial<Record<DecorativeTheme, string>> = {
  girly: 'girly-toggle-icon',
  girly2: 'girly2-toggle-icon',
  synth: 'synth-toggle-icon',
  acid: 'acid-toggle-icon',
}

export function ThemeToggle() {
  const { theme, resolved, toggleTheme } = useTheme()
  const isDecorative = isDecorativeTheme(resolved)
  const toggleIconClass = isDecorative ? TOGGLE_ICON_CLASS[resolved] : undefined

  return (
    <>
      <ThemeSparkleBurst />
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle fixed right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-700 dark:hover:bg-slate-700"
        aria-label={LABELS[theme]}
        title={LABELS[theme]}
      >
        <span className={isDecorative ? toggleIconClass : undefined}>{ICONS[theme]}</span>
      </button>
    </>
  )
}
