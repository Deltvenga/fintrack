import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  createUserSession,
  error,
  json,
  parseBody,
  sanitizeUser,
  setAuthCookie,
  verifyPassword,
} from '../_lib/auth.js'
import { readDb } from '../_lib/db.js'

interface LoginBody {
  username?: string
  password?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return error(res, 405, 'Method not allowed')
  }

  const { username, password } = parseBody<LoginBody>(req)

  if (!username?.trim() || !password) {
    return error(res, 400, 'Username and password are required')
  }

  const normalizedUsername = username.trim().toLowerCase()
  const db = await readDb()
  const user = db.users.find((u) => u.username === normalizedUsername)

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return error(res, 401, 'Invalid username or password')
  }

  const token = await createUserSession(user.id)
  setAuthCookie(res, req, token)

  return json(res, 200, { user: sanitizeUser(user) })
}
