import type { Database } from './types.js'

export interface MemberBalance {
  userId: string
  username: string
  net: number
}

export interface Settlement {
  fromUserId: string
  fromUsername: string
  toUserId: string
  toUsername: string
  amount: number
}

export interface GroupBalance {
  members: MemberBalance[]
  settlements: Settlement[]
  totalExpenses: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function usernameFor(db: Database, userId: string): string {
  return db.users.find((u) => u.id === userId)?.username ?? 'Unknown'
}

export function calculateGroupBalance(db: Database, groupId: string): GroupBalance | null {
  const group = db.groups.find((g) => g.id === groupId)
  if (!group || group.memberIds.length === 0) {
    return null
  }

  const memberCount = group.memberIds.length
  const nets = new Map<string, number>()
  for (const memberId of group.memberIds) {
    nets.set(memberId, 0)
  }

  const expenses = db.expenses.filter((e) => e.groupId === groupId)
  let totalExpenses = 0

  for (const expense of expenses) {
    totalExpenses += expense.amount
    const share = expense.amount / memberCount

    for (const memberId of group.memberIds) {
      const current = nets.get(memberId) ?? 0
      if (memberId === expense.paidByUserId) {
        nets.set(memberId, current + expense.amount - share)
      } else {
        nets.set(memberId, current - share)
      }
    }
  }

  const members: MemberBalance[] = group.memberIds.map((userId) => ({
    userId,
    username: usernameFor(db, userId),
    net: roundMoney(nets.get(userId) ?? 0),
  }))

  const creditors = members
    .filter((m) => m.net > 0.01)
    .map((m) => ({ ...m, amount: m.net }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = members
    .filter((m) => m.net < -0.01)
    .map((m) => ({ ...m, amount: -m.net }))
    .sort((a, b) => b.amount - a.amount)

  const settlements: Settlement[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const pay = Math.min(creditors[ci].amount, debtors[di].amount)
    if (pay > 0.01) {
      settlements.push({
        fromUserId: debtors[di].userId,
        fromUsername: debtors[di].username,
        toUserId: creditors[ci].userId,
        toUsername: creditors[ci].username,
        amount: roundMoney(pay),
      })
    }

    creditors[ci].amount -= pay
    debtors[di].amount -= pay

    if (creditors[ci].amount < 0.01) ci++
    if (debtors[di].amount < 0.01) di++
  }

  return {
    members,
    settlements,
    totalExpenses: roundMoney(totalExpenses),
  }
}
