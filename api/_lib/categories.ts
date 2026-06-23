const CUSTOM_COLORS = [
  '#6366f1',
  '#84cc16',
  '#f43f5e',
  '#0ea5e9',
  '#eab308',
  '#d946ef',
  '#14b8a6',
  '#f97316',
]

const CUSTOM_ICONS = ['🏷️', '✨', '🎁', '🐾', '💊', '🎓', '⚡', '🌿']

export function pickCustomColor(index: number): string {
  return CUSTOM_COLORS[index % CUSTOM_COLORS.length]
}

export function pickCustomIcon(index: number): string {
  return CUSTOM_ICONS[index % CUSTOM_ICONS.length]
}

export const CUSTOM_ICON_OPTIONS = CUSTOM_ICONS
