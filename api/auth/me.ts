import type { VercelRequest, VercelResponse } from '@vercel/node'
import { error, json, requireAuth, sanitizeUser } from '../_lib/auth.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed')
  }

  const user = await requireAuth(req, res)
  if (!user) {
    return
  }

  return json(res, 200, { user: sanitizeUser(user) })
}
