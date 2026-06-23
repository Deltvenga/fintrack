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

interface CreateExpenseBody {
  groupId?: string
  type?: 'expense' | 'income'
  amount?: number
  category?: string
  description?: string
  date?: string
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

  return {
    id: expense.id,
    groupId: expense.groupId,
    type: expense.type ?? 'expense',
    amount: expense.amount,
    category: expense.category,
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
    const { groupId, type, amount, category, description, date } =
      parseBody<CreateExpenseBody>(req)

    if (!groupId) {
      return error(res, 400, 'groupId is required')
    }

    const transactionType = type === 'income' ? 'income' : 'expense'

    if (!amount || amount <= 0) {
      return error(res, 400, 'Amount must be greater than 0')
    }

    if (!category?.trim()) {
      return error(res, 400, 'Category is required')
    }

    const db = await readDb()
    if (!isGroupMember(db, groupId, user.id)) {
      return error(res, 403, 'Forbidden')
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
        category: category.trim(),
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

  return error(res, 405, 'Method not allowed')
}
