import type { Expense, PlannedExpense } from './types'

export type SummaryPeriod = 'day' | 'week' | 'month' | 'year'

export interface PeriodRange {
  start: string
  end: string
  label: string
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function monthPrefix(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return end
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getPeriodRange(
  period: SummaryPeriod,
  referenceDate = new Date(),
): PeriodRange {
  if (period === 'day') {
    const date = toDateString(referenceDate)
    return {
      start: date,
      end: date,
      label: formatFullDate(referenceDate),
    }
  }

  if (period === 'week') {
    const start = startOfWeek(referenceDate)
    const end = endOfWeek(referenceDate)
    return {
      start: toDateString(start),
      end: toDateString(end),
      label: `${formatShortDate(start)} – ${formatShortDate(end)}`,
    }
  }

  if (period === 'month') {
    const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
    const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)
    return {
      start: toDateString(start),
      end: toDateString(end),
      label: formatMonthYear(referenceDate),
    }
  }

  const start = new Date(referenceDate.getFullYear(), 0, 1)
  const end = new Date(referenceDate.getFullYear(), 11, 31)
  return {
    start: toDateString(start),
    end: toDateString(end),
    label: String(referenceDate.getFullYear()),
  }
}

export function filterExpensesByPeriod(
  expenses: Expense[],
  period: SummaryPeriod,
  referenceDate = new Date(),
): Expense[] {
  const { start, end } = getPeriodRange(period, referenceDate)
  return expenses.filter((expense) => expense.date >= start && expense.date <= end)
}

export function getPlanStartMonth(plan: PlannedExpense): string {
  return plan.targetMonth ?? plan.createdAt.slice(0, 7)
}

export function planAppliesToMonth(plan: PlannedExpense, month: string): boolean {
  const startMonth = getPlanStartMonth(plan)
  if (plan.recurrence === 'monthly') {
    return month >= startMonth
  }
  return month === startMonth
}

function nextMonthValue(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(year, monthNumber, 1)
  return monthPrefix(date)
}

export function listMonthsInclusive(startMonth: string, endMonth: string): string[] {
  if (startMonth > endMonth) {
    return []
  }

  const months: string[] = []
  let current = startMonth

  while (current <= endMonth) {
    months.push(current)
    current = nextMonthValue(current)
  }

  return months
}

export function planMatchesPeriod(
  plan: PlannedExpense,
  period: SummaryPeriod,
  referenceDate = new Date(),
): boolean {
  if (period === 'day') {
    return false
  }

  const refMonth = monthPrefix(referenceDate)

  if (period === 'year') {
    const year = String(referenceDate.getFullYear())
    if (plan.recurrence === 'monthly') {
      return getPlanStartMonth(plan).slice(0, 4) === year && refMonth >= getPlanStartMonth(plan)
    }
    return getPlanStartMonth(plan).startsWith(year)
  }

  if (period === 'month') {
    return planAppliesToMonth(plan, refMonth)
  }

  const { start } = getPeriodRange('week', referenceDate)
  return planAppliesToMonth(plan, start.slice(0, 7))
}

export function shiftReferenceDate(
  period: SummaryPeriod,
  referenceDate: Date,
  direction: 1 | -1,
): Date {
  const result = new Date(referenceDate)

  if (period === 'day') {
    result.setDate(result.getDate() + direction)
  } else if (period === 'week') {
    result.setDate(result.getDate() + direction * 7)
  } else if (period === 'month') {
    result.setMonth(result.getMonth() + direction)
  } else {
    result.setFullYear(result.getFullYear() + direction)
  }

  return result
}

export function isCurrentPeriod(
  period: SummaryPeriod,
  referenceDate: Date,
): boolean {
  return getPeriodRange(period, referenceDate).start === getPeriodRange(period, new Date()).start
}

export function isFuturePeriod(
  period: SummaryPeriod,
  referenceDate: Date,
): boolean {
  return getPeriodRange(period, referenceDate).start > getPeriodRange(period, new Date()).start
}

export function formatTargetMonth(targetMonth: string): string {
  const [year, month] = targetMonth.split('-').map(Number)
  if (!year || !month) return targetMonth
  return new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })
}

export function currentMonthValue(): string {
  return monthPrefix(new Date())
}

export function computePeriodTotals(expenses: Expense[]) {
  let totalIncome = 0
  let totalExpenses = 0

  for (const transaction of expenses) {
    if ((transaction.type ?? 'expense') === 'income') {
      totalIncome += transaction.amount
    } else {
      totalExpenses += transaction.amount
    }
  }

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    net: Math.round((totalIncome - totalExpenses) * 100) / 100,
  }
}

export function filterExpensesBeforeDate(expenses: Expense[], beforeDate: string): Expense[] {
  return expenses.filter((expense) => expense.date < beforeDate)
}

export function filterExpensesUpToDate(expenses: Expense[], endDate: string): Expense[] {
  return expenses.filter((expense) => expense.date <= endDate)
}

export function computeOpeningBalance(expenses: Expense[], periodStart: string): number {
  return computePeriodTotals(filterExpensesBeforeDate(expenses, periodStart)).net
}

export function computeCumulativeTotals(expenses: Expense[], endDate: string) {
  return computePeriodTotals(filterExpensesUpToDate(expenses, endDate))
}

export interface DailyBalancePoint {
  date: string
  day: number
  balance: number
  change: number
}

function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function computeDailyBalances(
  expenses: Expense[],
  referenceDate = new Date(),
): DailyBalancePoint[] {
  const { start, end } = getPeriodRange('month', referenceDate)
  const opening = computeOpeningBalance(expenses, start)
  const today = toDateString(new Date())
  const lastDate = end <= today ? end : today

  if (lastDate < start) {
    return []
  }

  const dailyNet = new Map<string, number>()

  for (const expense of expenses) {
    if (expense.date < start || expense.date > end) {
      continue
    }

    const delta = (expense.type ?? 'expense') === 'income' ? expense.amount : -expense.amount
    const next = (dailyNet.get(expense.date) ?? 0) + delta
    dailyNet.set(expense.date, Math.round(next * 100) / 100)
  }

  const points: DailyBalancePoint[] = []
  let running = opening

  for (let cursor = parseLocalDate(start); toDateString(cursor) <= lastDate; cursor.setDate(cursor.getDate() + 1)) {
    const date = toDateString(cursor)
    const change = dailyNet.get(date) ?? 0
    running = Math.round((running + change) * 100) / 100

    points.push({
      date,
      day: cursor.getDate(),
      balance: running,
      change,
    })
  }

  return points
}
