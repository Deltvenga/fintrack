import type { VercelRequest, VercelResponse } from '@vercel/node'
import { error, isGroupMember, json, requireAuth } from '../_lib/auth.js'
import { readDb, updateDb } from '../_lib/db.js'
import {
  calculateFinancialSummary,
  calculatePlansProgress,
} from '../_lib/plans.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return error(res, 405, 'Method not allowed')
  }

  const user = await requireAuth(req, res)
  if (!user) {
    return
  }

  const planId = req.query.id as string | undefined
  if (!planId) {
    return error(res, 400, 'Plan id is required')
  }

  const db = await readDb()
  const plan = (db.plans ?? []).find((p) => p.id === planId)
  if (!plan) {
    return error(res, 404, 'Plan not found')
  }

  if (!isGroupMember(db, plan.groupId, user.id)) {
    return error(res, 403, 'Forbidden')
  }

  const groupId = plan.groupId

  await updateDb((freshDb) => {
    if (!freshDb.plans) {
      freshDb.plans = []
      return
    }

    const index = freshDb.plans.findIndex((p) => p.id === planId)
    if (index !== -1) {
      freshDb.plans.splice(index, 1)
    }
  })

  const freshDb = await readDb()
  const plans = calculatePlansProgress(freshDb.plans ?? [], freshDb.expenses, groupId)
  const summary = calculateFinancialSummary(
    freshDb.expenses,
    freshDb.plans ?? [],
    groupId,
  )

  return json(res, 200, { plans, summary })
}
