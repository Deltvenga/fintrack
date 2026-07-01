import type { Expense, PlannedExpense } from './types.js'

export type PlanRecurrence = 'monthly' | 'once'

export interface PlanProgress {
  id: string
  groupId: string
  name: string
  amount: number
  recurrence: PlanRecurrence
  targetMonth: string
  description: string
  icon?: string
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

export function getPlanStartMonth(plan: PlannedExpense): string {
  return plan.targetMonth ?? plan.createdAt.slice(0, 7)
}

/** @deprecated use getPlanStartMonth */
export function getPlanTargetMonth(plan: PlannedExpense): string {
  return getPlanStartMonth(plan)
}

export function planAppliesToMonth(plan: PlannedExpense, month: string): boolean {
  const startMonth = getPlanStartMonth(plan)
  if (plan.recurrence === 'monthly') {
    return month >= startMonth
  }
  return month === startMonth
}

export function getPlanEvaluationMonth(
  plan: PlannedExpense,
  referenceMonth = currentMonthPrefix(),
): string {
  if (plan.recurrence === 'monthly') {
    return referenceMonth
  }
  return getPlanStartMonth(plan)
}

/** @deprecated old plans used `category` instead of `name` */
export function getPlanName(plan: PlannedExpense & { category?: string }): string {
  if (plan.name?.trim()) {
    return plan.name.trim()
  }
  if (plan.description?.trim()) {
    return plan.description.trim()
  }
  if (plan.category?.trim()) {
    return plan.category.trim()
  }
  return 'Без названия'
}

export function getPlanSubtitle(
  plan: PlannedExpense & { category?: string },
  title = getPlanName(plan),
): string | undefined {
  const description = plan.description?.trim()
  if (!description || description === title) {
    return undefined
  }
  return description
}

export function migrateLegacyPlans(plans: PlannedExpense[]): void {
  for (const plan of plans as Array<PlannedExpense & { category?: string }>) {
    if (!plan.targetMonth) {
      plan.targetMonth = plan.createdAt.slice(0, 7)
    }

    if (plan.name?.trim()) {
      continue
    }

    const fromDescription = plan.description?.trim()
    const fromCategory = plan.category?.trim()

    if (fromDescription) {
      plan.name = fromDescription
      plan.description = ''
    } else if (fromCategory) {
      plan.name = fromCategory
    }
  }
}

function getPlanSpentInPeriod(
  plan: PlannedExpense,
  expenses: Expense[],
  evaluationMonth: string,
): number {
  const linkedExpenses = expenses.filter(
    (e) =>
      e.groupId === plan.groupId &&
      (e.type ?? 'expense') === 'expense' &&
      e.planId === plan.id &&
      e.date.startsWith(evaluationMonth),
  )

  return linkedExpenses.reduce((sum, e) => sum + e.amount, 0)
}

export function calculatePlansProgress(
  plans: PlannedExpense[],
  expenses: Expense[],
  groupId: string,
  monthFilter?: string,
): PlanProgress[] {
  const evaluationReferenceMonth = monthFilter ?? currentMonthPrefix()

  const groupPlans = plans
    .filter((p) => p.groupId === groupId)
    .filter((p) => !monthFilter || planAppliesToMonth(p, monthFilter))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const groupExpenses = expenses.filter((e) => e.groupId === groupId)

  return groupPlans.map((plan) => {
    const evaluationMonth = getPlanEvaluationMonth(plan, evaluationReferenceMonth)
    const spent = Math.min(
      plan.amount,
      getPlanSpentInPeriod(plan, groupExpenses, evaluationMonth),
    )
    const remaining = Math.max(0, plan.amount - spent)
    const percent =
      plan.amount > 0 ? Math.min(100, Math.round((spent / plan.amount) * 100)) : 0

    return {
      id: plan.id,
      groupId: plan.groupId,
      name: getPlanName(plan),
      amount: plan.amount,
      recurrence: plan.recurrence,
      targetMonth: evaluationMonth,
      description: plan.description,
      icon: plan.icon,
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

  const currentMonth = currentMonthPrefix()
  const plansProgress = calculatePlansProgress(plans, expenses, groupId, currentMonth)
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
