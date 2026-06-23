import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  clearAuthCookie,
  error,
  getTokenFromRequest,
  json,
} from '../_lib/auth.js'
import { updateDb } from '../_lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return error(res, 405, 'Method not allowed')
  }

  const token = getTokenFromRequest(req)

  if (token) {
    await updateDb((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token)
    })
  }

  clearAuthCookie(res, req)
  return json(res, 200, { ok: true })
}
