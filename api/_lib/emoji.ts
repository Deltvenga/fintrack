const FALLBACK_ICON = '📌'

export function normalizeEmojiIcon(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    return FALLBACK_ICON
  }

  const match = trimmed.match(/\p{Extended_Pictographic}/u)
  if (match?.[0]) {
    return match[0]
  }

  return trimmed.slice(0, 2) || FALLBACK_ICON
}
