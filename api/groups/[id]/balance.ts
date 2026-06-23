import type { VercelRequest, VercelResponse } from '@vercel/node'
import { calculateGroupBalance } from '../_lib/balance.js'
import { error, isGroupMember, json, requireAuth } from '../_lib/auth.js'
import { readDb } from '../_lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return error(res, 405, 'Method not allowed')
  }

  const user = await requireAuth(req, res)
  if (!user) {
    return
  }

  const groupId = req.query.id as string | undefined
  if (!groupId) {
    return error(res, 400, 'Group id is required')
  }

  const db = await readDb()
  const group = db.groups.find((g) => g.id === groupId)

  if (!group) {
    return error(res, 404, 'Group not found')
  }

  if (!isGroupMember(db, groupId, user.id)) {
    return error(res, 403, 'Forbidden')
  }

  const balance = calculateGroupBalance(db, groupId)
  if (!balance) {
    return error(res, 404, 'Group not found')
  }

  return json(res, 200, { balance })
}
