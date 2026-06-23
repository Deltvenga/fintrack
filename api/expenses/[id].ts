import type { VercelRequest, VercelResponse } from '@vercel/node'
import { error, isGroupMember, json, requireAuth } from '../_lib/auth.js'
import { readDb, updateDb } from '../_lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return error(res, 405, 'Method not allowed')
  }

  const user = await requireAuth(req, res)
  if (!user) {
    return
  }

  const expenseId = req.query.id as string | undefined
  if (!expenseId) {
    return error(res, 400, 'Expense id is required')
  }

  const db = await readDb()
  const expense = db.expenses.find((e) => e.id === expenseId)
  if (!expense) {
    return error(res, 404, 'Expense not found')
  }

  if (!isGroupMember(db, expense.groupId, user.id)) {
    return error(res, 403, 'Forbidden')
  }

  await updateDb((freshDb) => {
    const index = freshDb.expenses.findIndex((e) => e.id === expenseId)
    if (index !== -1) {
      freshDb.expenses.splice(index, 1)
    }
  })

  return json(res, 200, { ok: true })
}
