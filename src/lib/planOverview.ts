import type { Expense, PlannedExpense } from './types'
import { currentMonthValue, formatTargetMonth, getPlanStartMonth, listMonthsInclusive } from './period'

export interface MonthPlanOverview {
  targetMonth: string
  label: string
  monthlyAmount: number
  onceAmount: number
  totalAmount: number
  monthlyRemaining: number
  onceRemaining: number
  totalRemaining: number
  monthlyCount: number
  onceCount: number
}

export interface PlanOverviewTotals {
  monthlyAmount: number
  onceAmount: number
  totalAmount: number
  monthlyRemaining: number
  onceRemaining: number
  totalRemaining: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function getPlanSpentInMonth(plan: PlannedExpense, expenses: Expense[], month: string): number {
  return expenses
    .filter(
      (expense) =>
        expense.planId === plan.id &&
        (expense.type ?? 'expense') === 'expense' &&
        expense.date.startsWith(month),
    )
    .reduce((sum, expense) => sum + expense.amount, 0)
}

export function buildPlanOverviewByMonth(
  plans: PlannedExpense[],
  expenses: Expense[] = [],
): MonthPlanOverview[] {
  const byMonth = new Map<string, MonthPlanOverview>()
  const currentMonth = currentMonthValue()

  function ensureMonth(targetMonth: string): MonthPlanOverview {
    const existing = byMonth.get(targetMonth)
    if (existing) {
      return existing
    }

    const created: MonthPlanOverview = {
      targetMonth,
      label: formatTargetMonth(targetMonth),
      monthlyAmount: 0,
      onceAmount: 0,
      totalAmount: 0,
      monthlyRemaining: 0,
      onceRemaining: 0,
      totalRemaining: 0,
      monthlyCount: 0,
      onceCount: 0,
    }

    byMonth.set(targetMonth, created)
    return created
  }

  for (const plan of plans) {
    const startMonth = getPlanStartMonth(plan)

    if (plan.recurrence === 'monthly') {
      for (const targetMonth of listMonthsInclusive(startMonth, currentMonth)) {
        const month = ensureMonth(targetMonth)
        const spent = getPlanSpentInMonth(plan, expenses, targetMonth)
        const remaining = Math.max(0, plan.amount - Math.min(plan.amount, spent))

        month.monthlyAmount += plan.amount
        month.monthlyRemaining += remaining
        month.monthlyCount += 1
        month.totalAmount += plan.amount
        month.totalRemaining += remaining
      }
      continue
    }

    const month = ensureMonth(startMonth)
    const spent = getPlanSpentInMonth(plan, expenses, startMonth)
    const remaining = Math.max(0, plan.amount - Math.min(plan.amount, spent))

    month.onceAmount += plan.amount
    month.onceRemaining += remaining
    month.onceCount += 1
    month.totalAmount += plan.amount
    month.totalRemaining += remaining
  }

  return Array.from(byMonth.values())
    .map((month) => ({
      ...month,
      monthlyAmount: roundMoney(month.monthlyAmount),
      onceAmount: roundMoney(month.onceAmount),
      totalAmount: roundMoney(month.totalAmount),
      monthlyRemaining: roundMoney(month.monthlyRemaining),
      onceRemaining: roundMoney(month.onceRemaining),
      totalRemaining: roundMoney(month.totalRemaining),
    }))
    .sort((a, b) => a.targetMonth.localeCompare(b.targetMonth))
}

export function buildPlanOverviewTotals(months: MonthPlanOverview[]): PlanOverviewTotals {
  const totals = months.reduce(
    (acc, month) => ({
      monthlyAmount: acc.monthlyAmount + month.monthlyAmount,
      onceAmount: acc.onceAmount + month.onceAmount,
      totalAmount: acc.totalAmount + month.totalAmount,
      monthlyRemaining: acc.monthlyRemaining + month.monthlyRemaining,
      onceRemaining: acc.onceRemaining + month.onceRemaining,
      totalRemaining: acc.totalRemaining + month.totalRemaining,
    }),
    {
      monthlyAmount: 0,
      onceAmount: 0,
      totalAmount: 0,
      monthlyRemaining: 0,
      onceRemaining: 0,
      totalRemaining: 0,
    },
  )

  return {
    monthlyAmount: roundMoney(totals.monthlyAmount),
    onceAmount: roundMoney(totals.onceAmount),
    totalAmount: roundMoney(totals.totalAmount),
    monthlyRemaining: roundMoney(totals.monthlyRemaining),
    onceRemaining: roundMoney(totals.onceRemaining),
    totalRemaining: roundMoney(totals.totalRemaining),
  }
}
