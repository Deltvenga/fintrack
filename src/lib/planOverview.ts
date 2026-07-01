import type { Expense, PlannedExpense } from './types'
import {
  currentMonthValue,
  formatTargetMonth,
  getPlanStartMonth,
  listMonthsInclusive,
  planAppliesToMonth,
} from './period'

export interface MonthPlanOverview {
  targetMonth: string
  label: string
  monthlyAmount: number
  onceAmount: number
  totalAmount: number
  monthlySpent: number
  onceSpent: number
  totalSpent: number
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
  monthlySpent: number
  onceSpent: number
  totalSpent: number
  monthlyRemaining: number
  onceRemaining: number
  totalRemaining: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function uniquePlans(plans: PlannedExpense[]): PlannedExpense[] {
  const byId = new Map<string, PlannedExpense>()
  for (const plan of plans) {
    byId.set(plan.id, plan)
  }
  return Array.from(byId.values())
}

function getPlanSpentInMonth(
  planIds: Set<string>,
  expenses: Expense[],
  month: string,
  groupId?: string,
): number {
  return expenses
    .filter(
      (expense) =>
        (!groupId || expense.groupId === groupId) &&
        Boolean(expense.planId) &&
        planIds.has(expense.planId!) &&
        (expense.type ?? 'expense') === 'expense' &&
        expense.date.startsWith(month),
    )
    .reduce((sum, expense) => sum + expense.amount, 0)
}

export function buildPlanOverviewByMonth(
  plans: PlannedExpense[],
  expenses: Expense[] = [],
  groupId?: string,
): MonthPlanOverview[] {
  const byMonth = new Map<string, MonthPlanOverview>()
  const currentMonth = currentMonthValue()
  const normalizedPlans = uniquePlans(plans)

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
      monthlySpent: 0,
      onceSpent: 0,
      totalSpent: 0,
      monthlyRemaining: 0,
      onceRemaining: 0,
      totalRemaining: 0,
      monthlyCount: 0,
      onceCount: 0,
    }

    byMonth.set(targetMonth, created)
    return created
  }

  for (const plan of normalizedPlans) {
    const startMonth = getPlanStartMonth(plan)

    if (plan.recurrence === 'monthly') {
      for (const targetMonth of listMonthsInclusive(startMonth, currentMonth)) {
        const month = ensureMonth(targetMonth)
        month.monthlyAmount += plan.amount
        month.monthlyCount += 1
        month.totalAmount += plan.amount
      }
      continue
    }

    const month = ensureMonth(startMonth)
    month.onceAmount += plan.amount
    month.onceCount += 1
    month.totalAmount += plan.amount
  }

  for (const month of byMonth.values()) {
    const monthlyPlanIds = new Set(
      normalizedPlans
        .filter(
          (plan) => plan.recurrence === 'monthly' && planAppliesToMonth(plan, month.targetMonth),
        )
        .map((plan) => plan.id),
    )
    const oncePlanIds = new Set(
      normalizedPlans
        .filter(
          (plan) => plan.recurrence === 'once' && planAppliesToMonth(plan, month.targetMonth),
        )
        .map((plan) => plan.id),
    )

    month.monthlySpent = getPlanSpentInMonth(monthlyPlanIds, expenses, month.targetMonth, groupId)
    month.onceSpent = getPlanSpentInMonth(oncePlanIds, expenses, month.targetMonth, groupId)
    month.totalSpent = month.monthlySpent + month.onceSpent
    month.monthlyRemaining = Math.max(0, month.monthlyAmount - month.monthlySpent)
    month.onceRemaining = Math.max(0, month.onceAmount - month.onceSpent)
    month.totalRemaining = Math.max(0, month.totalAmount - month.totalSpent)
  }

  return Array.from(byMonth.values())
    .map((month) => ({
      ...month,
      monthlyAmount: roundMoney(month.monthlyAmount),
      onceAmount: roundMoney(month.onceAmount),
      totalAmount: roundMoney(month.totalAmount),
      monthlySpent: roundMoney(month.monthlySpent),
      onceSpent: roundMoney(month.onceSpent),
      totalSpent: roundMoney(month.totalSpent),
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
      monthlySpent: acc.monthlySpent + month.monthlySpent,
      onceSpent: acc.onceSpent + month.onceSpent,
      totalSpent: acc.totalSpent + month.totalSpent,
      monthlyRemaining: acc.monthlyRemaining + month.monthlyRemaining,
      onceRemaining: acc.onceRemaining + month.onceRemaining,
      totalRemaining: acc.totalRemaining + month.totalRemaining,
    }),
    {
      monthlyAmount: 0,
      onceAmount: 0,
      totalAmount: 0,
      monthlySpent: 0,
      onceSpent: 0,
      totalSpent: 0,
      monthlyRemaining: 0,
      onceRemaining: 0,
      totalRemaining: 0,
    },
  )

  return {
    monthlyAmount: roundMoney(totals.monthlyAmount),
    onceAmount: roundMoney(totals.onceAmount),
    totalAmount: roundMoney(totals.totalAmount),
    monthlySpent: roundMoney(totals.monthlySpent),
    onceSpent: roundMoney(totals.onceSpent),
    totalSpent: roundMoney(totals.totalSpent),
    monthlyRemaining: roundMoney(totals.monthlyRemaining),
    onceRemaining: roundMoney(totals.onceRemaining),
    totalRemaining: roundMoney(totals.totalRemaining),
  }
}
