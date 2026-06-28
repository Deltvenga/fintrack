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
import { getPlanName } from '../_lib/plans.js'
import { getRouteId } from '../_lib/request.js'

interface CreateExpenseBody {
  groupId?: string
  type?: 'expense' | 'income'
  amount?: number
  category?: string
  planId?: string
  description?: string
  date?: string
}

interface UpdateExpenseBody {
  amount?: number
  category?: string
  description?: string
  date?: string
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function mapExpense(
  db: Awaited<ReturnType<typeof readDb>>,
  expenseId: string,
) {
  const expense = db.expenses.find((e) => e.id === expenseId)
  if (!expense) {
    return null
  }

  const payer = db.users.find((u) => u.id === expense.paidByUserId)
  const plan = expense.planId
    ? (db.plans ?? []).find((p) => p.id === expense.planId)
    : undefined

  return {
    id: expense.id,
    groupId: expense.groupId,
    type: expense.type ?? 'expense',
    amount: expense.amount,
    category: expense.category,
    planId: expense.planId,
    planName: plan ? getPlanName(plan) : undefined,
    description: expense.description,
    paidByUserId: expense.paidByUserId,
    paidByUsername: payer?.username ?? 'Unknown',
    date: expense.date,
    createdAt: expense.createdAt,
  }
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

    const expenses = db.expenses
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .map((e) => mapExpense(db, e.id))
      .filter(Boolean)

    return json(res, 200, { expenses })
  }

  if (req.method === 'POST') {
    const { groupId, type, amount, category, planId, description, date } =
      parseBody<CreateExpenseBody>(req)

    if (!groupId) {
      return error(res, 400, 'groupId is required')
    }

    const transactionType = type === 'income' ? 'income' : 'expense'

    if (!amount || amount <= 0) {
      return error(res, 400, 'Amount must be greater than 0')
    }

    if (transactionType === 'income' && planId) {
      return error(res, 400, 'Income cannot be linked to a plan')
    }

    const db = await readDb()
    if (!isGroupMember(db, groupId, user.id)) {
      return error(res, 403, 'Forbidden')
    }

    let resolvedCategory = category?.trim() ?? ''
    let resolvedPlanId: string | undefined

    if (planId) {
      const plan = (db.plans ?? []).find((p) => p.id === planId && p.groupId === groupId)
      if (!plan) {
        return error(res, 400, 'Plan not found')
      }
      resolvedPlanId = plan.id
      resolvedCategory = getPlanName(plan)
    } else if (!resolvedCategory) {
      return error(res, 400, 'Category is required')
    }

    const expenseId = randomUUID()
    const createdAt = new Date().toISOString()
    const expenseDate = date ?? createdAt.slice(0, 10)

    await updateDb((freshDb) => {
      freshDb.expenses.push({
        id: expenseId,
        groupId,
        type: transactionType,
        amount: Math.round(amount * 100) / 100,
        category: resolvedCategory,
        planId: resolvedPlanId,
        description: description?.trim() ?? '',
        paidByUserId: user.id,
        date: expenseDate,
        createdAt,
      })
    })

    const freshDb = await readDb()
    const expense = mapExpense(freshDb, expenseId)
    return json(res, 201, { expense })
  }

  if (req.method === 'PATCH') {
    const expenseId = getRouteId(req, 'expenses')
    if (!expenseId) {
      return error(res, 400, 'Expense id is required')
    }

    const { amount, category, description, date } =
      parseBody<UpdateExpenseBody>(req)

    const db = await readDb()
    const expense = db.expenses.find((e) => e.id === expenseId)
    if (!expense) {
      return error(res, 404, 'Expense not found')
    }

    if (!isGroupMember(db, expense.groupId, user.id)) {
      return error(res, 403, 'Forbidden')
    }

    if (amount !== undefined && (!amount || amount <= 0)) {
      return error(res, 400, 'Amount must be greater than 0')
    }

    if (date !== undefined && !isValidDate(date)) {
      return error(res, 400, 'date must be YYYY-MM-DD')
    }

    const isPlanned = Boolean(expense.planId)
    if (category !== undefined && !isPlanned && !category.trim()) {
      return error(res, 400, 'Category is required')
    }

    await updateDb((freshDb) => {
      const current = freshDb.expenses.find((e) => e.id === expenseId)
      if (!current) {
        return
      }

      if (amount !== undefined) {
        current.amount = Math.round(amount * 100) / 100
      }

      if (description !== undefined) {
        current.description = description.trim()
      }

      if (date !== undefined) {
        current.date = date
      }

      // Категория редактируется только у обычных операций;
      // у привязанных к плану название определяется планом.
      if (category !== undefined && !current.planId) {
        current.category = category.trim()
      }
    })

    const freshDb = await readDb()
    const updated = mapExpense(freshDb, expenseId)
    return json(res, 200, { expense: updated })
  }

  if (req.method === 'DELETE') {
    const expenseId = getRouteId(req, 'expenses')
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

  return error(res, 405, 'Method not allowed')
}
