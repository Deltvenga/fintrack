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

export function planMatchesPeriod(
  plan: PlannedExpense,
  period: SummaryPeriod,
  referenceDate = new Date(),
): boolean {
  const targetMonth = plan.targetMonth ?? plan.createdAt.slice(0, 7)

  if (period === 'year') {
    return targetMonth.startsWith(String(referenceDate.getFullYear()))
  }

  if (period === 'month' || period === 'day') {
    return targetMonth === monthPrefix(referenceDate)
  }

  const { start, end } = getPeriodRange('week', referenceDate)
  const startMonth = start.slice(0, 7)
  const endMonth = end.slice(0, 7)
  return targetMonth === startMonth || targetMonth === endMonth
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
