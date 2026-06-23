import type { Expense, PlannedExpense } from './types.js'

export type PlanRecurrence = 'monthly' | 'once'

export interface PlanProgress {
  id: string
  groupId: string
  category: string
  amount: number
  recurrence: PlanRecurrence
  description: string
  spent: number
  remaining: number
  percent: number
  createdAt: string
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  plannedRemaining: number
  currentBalance: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function currentMonthPrefix(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function getCategorySpentInPeriod(
  plan: PlannedExpense,
  expenses: Expense[],
): number {
  const categoryExpenses = expenses.filter(
    (e) =>
      e.groupId === plan.groupId &&
      (e.type ?? 'expense') === 'expense' &&
      e.category === plan.category,
  )

  if (plan.recurrence === 'monthly') {
    const prefix = currentMonthPrefix()
    return categoryExpenses
      .filter((e) => e.date.startsWith(prefix))
      .reduce((sum, e) => sum + e.amount, 0)
  }

  const planDate = plan.createdAt.slice(0, 10)
  return categoryExpenses
    .filter((e) => e.date >= planDate)
    .reduce((sum, e) => sum + e.amount, 0)
}

function poolKey(plan: PlannedExpense): string {
  if (plan.recurrence === 'monthly') {
    return `${plan.category}:monthly:${currentMonthPrefix()}`
  }
  return `${plan.category}:once:${plan.id}`
}

export function calculatePlansProgress(
  plans: PlannedExpense[],
  expenses: Expense[],
  groupId: string,
): PlanProgress[] {
  const groupPlans = plans
    .filter((p) => p.groupId === groupId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const groupExpenses = expenses.filter((e) => e.groupId === groupId)
  const pools = new Map<string, number>()

  return groupPlans.map((plan) => {
    const key = poolKey(plan)
    if (!pools.has(key)) {
      pools.set(key, getCategorySpentInPeriod(plan, groupExpenses))
    }

    const available = pools.get(key) ?? 0
    const spent = Math.min(plan.amount, available)
    pools.set(key, Math.max(0, available - spent))

    const remaining = Math.max(0, plan.amount - spent)
    const percent =
      plan.amount > 0 ? Math.min(100, Math.round((spent / plan.amount) * 100)) : 0

    return {
      id: plan.id,
      groupId: plan.groupId,
      category: plan.category,
      amount: plan.amount,
      recurrence: plan.recurrence,
      description: plan.description,
      spent: roundMoney(spent),
      remaining: roundMoney(remaining),
      percent,
      createdAt: plan.createdAt,
    }
  })
}

export function calculateFinancialSummary(
  expenses: Expense[],
  plans: PlannedExpense[],
  groupId: string,
): FinancialSummary {
  const groupExpenses = expenses.filter((e) => e.groupId === groupId)

  let totalIncome = 0
  let totalExpenses = 0

  for (const transaction of groupExpenses) {
    if ((transaction.type ?? 'expense') === 'income') {
      totalIncome += transaction.amount
    } else {
      totalExpenses += transaction.amount
    }
  }

  const plansProgress = calculatePlansProgress(plans, expenses, groupId)
  const plannedRemaining = plansProgress.reduce((sum, plan) => sum + plan.remaining, 0)

  totalIncome = roundMoney(totalIncome)
  totalExpenses = roundMoney(totalExpenses)
  const planned = roundMoney(plannedRemaining)
  const currentBalance = roundMoney(totalIncome - totalExpenses - planned)

  return {
    totalIncome,
    totalExpenses,
    plannedRemaining: planned,
    currentBalance,
  }
}
