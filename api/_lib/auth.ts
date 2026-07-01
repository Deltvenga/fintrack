import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { Database, Session, User } from './types.js'
import { readDb, updateDb } from './db.js'

export const COOKIE_NAME = 'fintrack_token'
const SESSION_DAYS = 30
const BCRYPT_ROUNDS = 10

export function json(res: VercelResponse, status: number, data: unknown): void {
  res.status(status).json(data)
}

export function error(res: VercelResponse, status: number, message: string): void {
  json(res, status, { error: message })
}

export function parseBody<T = Record<string, unknown>>(req: VercelRequest): T {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T
  }
  return (req.body ?? {}) as T
}

function parseCookies(req: VercelRequest): Record<string, string> {
  const header = req.headers.cookie ?? ''
  const cookies: Record<string, string> = {}

  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key) {
      cookies[key] = decodeURIComponent(rest.join('='))
    }
  }

  return cookies
}

export function getTokenFromRequest(req: VercelRequest): string | null {
  return parseCookies(req)[COOKIE_NAME] ?? null
}

function isSecureRequest(req: VercelRequest): boolean {
  return (
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.VERCEL === '1'
  )
}

export function setAuthCookie(res: VercelResponse, req: VercelRequest, token: string): void {
  const secure = isSecureRequest(req) ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_DAYS * 86400}; SameSite=Lax${secure}`,
  )
}

export function clearAuthCookie(res: VercelResponse, req: VercelRequest): void {
  const secure = isSecureRequest(req) ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`,
  )
}

function createSessionExpiry(): string {
  const date = new Date()
  date.setDate(date.getDate() + SESSION_DAYS)
  return date.toISOString()
}

export function createSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function findValidSession(db: Database, token: string): Session | null {
  const session = db.sessions.find((s) => s.token === token)
  if (!session) {
    return null
  }

  if (new Date(session.expiresAt) < new Date()) {
    return null
  }

  return session
}

export async function getAuthUser(req: VercelRequest): Promise<User | null> {
  const token = getTokenFromRequest(req)
  if (!token) {
    return null
  }

  const db = await readDb()
  const session = findValidSession(db, token)
  if (!session) {
    return null
  }

  return db.users.find((u) => u.id === session.userId) ?? null
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<User | null> {
  const user = await getAuthUser(req)
  if (!user) {
    error(res, 401, 'Unauthorized')
    return null
  }
  return user
}

export async function createUserSession(
  userId: string,
): Promise<string> {
  const token = createSessionToken()
  const expiresAt = createSessionExpiry()

  await updateDb((db) => {
    db.sessions.push({ token, userId, expiresAt })
  })

  return token
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  }
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = randomBytes(6)
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return code
}

export function isGroupMember(db: Database, groupId: string, userId: string): boolean {
  const group = db.groups.find((g) => g.id === groupId)
  return Boolean(group?.memberIds.includes(userId))
}
