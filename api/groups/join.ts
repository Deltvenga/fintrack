import type { VercelRequest, VercelResponse } from '@vercel/node'
import { error, json, parseBody, requireAuth } from '../_lib/auth.js'
import { readDb, updateDb } from '../_lib/db.js'

interface JoinBody {
  inviteCode?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return error(res, 405, 'Method not allowed')
  }

  const user = await requireAuth(req, res)
  if (!user) {
    return
  }

  const { inviteCode } = parseBody<JoinBody>(req)
  const code = inviteCode?.trim().toUpperCase()

  if (!code) {
    return error(res, 400, 'Invite code is required')
  }

  const db = await readDb()
  const group = db.groups.find((g) => g.inviteCode === code)

  if (!group) {
    return error(res, 404, 'Group not found')
  }

  if (group.memberIds.includes(user.id)) {
    return json(res, 200, {
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
      },
    })
  }

  await updateDb((freshDb) => {
    const target = freshDb.groups.find((g) => g.id === group.id)
    if (target && !target.memberIds.includes(user.id)) {
      target.memberIds.push(user.id)
    }
  })

  return json(res, 200, {
    group: {
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode,
    },
  })
}
