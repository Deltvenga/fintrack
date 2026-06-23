import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import {
  createUserSession,
  error,
  hashPassword,
  json,
  parseBody,
  setAuthCookie,
} from '../_lib/auth.js'
import { updateDb } from '../_lib/db.js'

interface RegisterBody {
  username?: string
  password?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return error(res, 405, 'Method not allowed')
  }

  const { username, password } = parseBody<RegisterBody>(req)

  if (!username?.trim() || !password) {
    return error(res, 400, 'Username and password are required')
  }

  if (password.length < 4) {
    return error(res, 400, 'Password must be at least 4 characters')
  }

  const normalizedUsername = username.trim().toLowerCase()

  try {
    const passwordHash = await hashPassword(password)
    const userId = randomUUID()
    const createdAt = new Date().toISOString()

    await updateDb((db) => {
      const exists = db.users.some((u) => u.username === normalizedUsername)
      if (exists) {
        throw new Error('USERNAME_EXISTS')
      }

      db.users.push({
        id: userId,
        username: normalizedUsername,
        passwordHash,
        createdAt,
      })
    })

    const token = await createUserSession(userId)
    setAuthCookie(res, req, token)

    return json(res, 201, {
      user: {
        id: userId,
        username: normalizedUsername,
        createdAt,
      },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'USERNAME_EXISTS') {
      return error(res, 409, 'Username already taken')
    }
    throw err
  }
}
