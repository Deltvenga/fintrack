export const PENDING_INVITE_KEY = 'fintrack_pending_invite'

export function buildInviteLink(inviteCode: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/join/${inviteCode}`
}

export function normalizeInviteCode(value: string): string {
  return value.trim().toUpperCase()
}

export function extractInviteCode(input: string): string {
  const value = input.trim()
  if (!value) return ''

  const match = value.match(/\/join\/([^/?#\s]+)/i)
  if (match) {
    return normalizeInviteCode(decodeURIComponent(match[1]))
  }

  return normalizeInviteCode(value)
}
