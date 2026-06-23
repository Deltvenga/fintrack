const FALLBACK_ICON = '📌'

export function normalizeEmojiIcon(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    return FALLBACK_ICON
  }

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    const first = [...segmenter.segment(trimmed)][0]?.segment
    if (first) {
      return first
    }
  }

  const match = trimmed.match(/\p{Extended_Pictographic}/u)
  if (match?.[0]) {
    return match[0]
  }

  return trimmed.slice(0, 2) || FALLBACK_ICON
}
