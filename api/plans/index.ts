import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import {
  error,
  isGroupMember,
  json,
  parseBody,
  requireAuth,
} from '../_lib/auth.js'
import { readDb, updateDb } from '../_lib/db.js'
import {
  calculateFinancialSummary,
  calculatePlansProgress,
} from '../_lib/plans.js'
import { getRouteId } from '../_lib/request.js'
import type { PlanRecurrence } from '../_lib/types.js'

interface CreatePlanBody {
  groupId?: string
  name?: string
  amount?: number
  recurrence?: PlanRecurrence
  targetMonth?: string
  description?: string
}

function isValidTargetMonth(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res)
  if (!user) {
    return
  }

  if (req.method === 'GET') {
    const groupId = req.query.groupId as string | undefined
    if (!groupId) {
      return error(res, 400, 'groupId is required')
    }

    const db = await readDb()
    if (!isGroupMember(db, groupId, user.id)) {
      return error(res, 403, 'Forbidden')
    }

    const plans = calculatePlansProgress(db.plans ?? [], db.expenses, groupId)
    const summary = calculateFinancialSummary(db.expenses, db.plans ?? [], groupId)

    return json(res, 200, { plans, summary })
  }

  if (req.method === 'POST') {
    const { groupId, name, amount, recurrence, targetMonth, description } =
      parseBody<CreatePlanBody>(req)

    if (!groupId) {
      return error(res, 400, 'groupId is required')
    }

    if (!amount || amount <= 0) {
      return error(res, 400, 'Amount must be greater than 0')
    }

    if (!name?.trim()) {
      return error(res, 400, 'Name is required')
    }

    if (recurrence !== 'monthly' && recurrence !== 'once') {
      return error(res, 400, 'recurrence must be monthly or once')
    }

    const planTargetMonth = targetMonth?.trim() || new Date().toISOString().slice(0, 7)
    if (!isValidTargetMonth(planTargetMonth)) {
      return error(res, 400, 'targetMonth must be YYYY-MM')
    }

    const db = await readDb()
    if (!isGroupMember(db, groupId, user.id)) {
      return error(res, 403, 'Forbidden')
    }

    const planId = randomUUID()
    const createdAt = new Date().toISOString()

    await updateDb((freshDb) => {
      if (!freshDb.plans) {
        freshDb.plans = []
      }

      freshDb.plans.push({
        id: planId,
        groupId,
        name: name.trim(),
        amount: Math.round(amount * 100) / 100,
        recurrence,
        targetMonth: planTargetMonth,
        description: description?.trim() ?? '',
        createdAt,
      })
    })

    const freshDb = await readDb()
    const plans = calculatePlansProgress(freshDb.plans ?? [], freshDb.expenses, groupId)
    const plan = plans.find((p) => p.id === planId)
    const summary = calculateFinancialSummary(
      freshDb.expenses,
      freshDb.plans ?? [],
      groupId,
    )

    return json(res, 201, { plan, summary })
  }

  if (req.method === 'DELETE') {
    const planId = getRouteId(req, 'plans')
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

  return error(res, 405, 'Method not allowed')
}
