import type { PlannedExpense } from './types'
import { formatTargetMonth } from './period'

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

export function buildPlanOverviewByMonth(plans: PlannedExpense[]): MonthPlanOverview[] {
  const byMonth = new Map<string, MonthPlanOverview>()

  for (const plan of plans) {
    const targetMonth = plan.targetMonth ?? plan.createdAt.slice(0, 7)
    const existing = byMonth.get(targetMonth) ?? {
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

    if (plan.recurrence === 'monthly') {
      existing.monthlyAmount += plan.amount
      existing.monthlyRemaining += plan.remaining
      existing.monthlyCount += 1
    } else {
      existing.onceAmount += plan.amount
      existing.onceRemaining += plan.remaining
      existing.onceCount += 1
    }

    existing.totalAmount += plan.amount
    existing.totalRemaining += plan.remaining
    byMonth.set(targetMonth, existing)
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
