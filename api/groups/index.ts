import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import {
  error,
  generateInviteCode,
  isGroupMember,
  json,
  parseBody,
  requireAuth,
} from '../_lib/auth.js'
import { readDb, updateDb } from '../_lib/db.js'

interface CreateGroupBody {
  name?: string
}

function mapGroupForUser(
  db: Awaited<ReturnType<typeof readDb>>,
  groupId: string,
  userId: string,
) {
  const group = db.groups.find((g) => g.id === groupId)
  if (!group || !isGroupMember(db, groupId, userId)) {
    return null
  }

  const expenseTotal = db.expenses
    .filter((e) => e.groupId === groupId)
    .reduce((sum, e) => sum + e.amount, 0)

  return {
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    memberCount: group.memberIds.length,
    expenseTotal: Math.round(expenseTotal * 100) / 100,
    createdAt: group.createdAt,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res)
  if (!user) {
    return
  }

  if (req.method === 'GET') {
    const db = await readDb()
    const groups = db.groups
      .filter((g) => g.memberIds.includes(user.id))
      .map((g) => mapGroupForUser(db, g.id, user.id))
      .filter(Boolean)

    return json(res, 200, { groups })
  }

  if (req.method === 'POST') {
    const { name } = parseBody<CreateGroupBody>(req)

    if (!name?.trim()) {
      return error(res, 400, 'Group name is required')
    }

    const groupId = randomUUID()
    const createdAt = new Date().toISOString()
    let inviteCode = generateInviteCode()

    await updateDb((db) => {
      while (db.groups.some((g) => g.inviteCode === inviteCode)) {
        inviteCode = generateInviteCode()
      }

      db.groups.push({
        id: groupId,
        name: name.trim(),
        inviteCode,
        memberIds: [user.id],
        createdAt,
      })
    })

    const db = await readDb()
    const group = mapGroupForUser(db, groupId, user.id)
    return json(res, 201, { group })
  }

  return error(res, 405, 'Method not allowed')
}
