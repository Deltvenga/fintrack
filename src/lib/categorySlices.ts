import { getCategoryInfo, PLAN_DISPLAY } from './categories'
import type { CustomCategory, Expense } from './types'

export const PLANNED_CATEGORY_KEY = '__planned__'
export const PLANNED_CATEGORY_LABEL = 'Плановые расходы'

export interface CategorySlice {
  key: string
  category: string
  amount: number
  color: string
  icon: string
  isPlannedGroup?: boolean
}

export function encodeCategoryKey(category: string, isPlannedGroup = false): string {
  if (isPlannedGroup) {
    return PLANNED_CATEGORY_KEY
  }
  return encodeURIComponent(category)
}

export function decodeCategoryKey(key: string): { category: string; isPlannedGroup: boolean } {
  if (key === PLANNED_CATEGORY_KEY) {
    return { category: PLANNED_CATEGORY_LABEL, isPlannedGroup: true }
  }
  return { category: decodeURIComponent(key), isPlannedGroup: false }
}

export function buildCategorySlices(
  expenses: Expense[],
  customCategories: CustomCategory[],
): CategorySlice[] {
  const expenseOnly = expenses.filter((expense) => (expense.type ?? 'expense') === 'expense')
  const totals = new Map<string, number>()
  let plannedTotal = 0

  for (const expense of expenseOnly) {
    if (expense.planId) {
      plannedTotal += expense.amount
      continue
    }
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount)
  }

  const slices: CategorySlice[] = Array.from(totals.entries()).map(([category, amount]) => {
    const info = getCategoryInfo(category, 'expense', customCategories)
    return {
      key: encodeCategoryKey(category),
      category,
      amount,
      color: info.color,
      icon: info.icon,
    }
  })

  if (plannedTotal > 0) {
    slices.push({
      key: PLANNED_CATEGORY_KEY,
      category: PLANNED_CATEGORY_LABEL,
      amount: plannedTotal,
      color: PLAN_DISPLAY.color,
      icon: PLAN_DISPLAY.icon,
      isPlannedGroup: true,
    })
  }

  return slices.sort((a, b) => b.amount - a.amount)
}

export function filterExpensesByCategoryKey(expenses: Expense[], categoryKey: string): Expense[] {
  const { category, isPlannedGroup } = decodeCategoryKey(categoryKey)
  const expenseOnly = expenses.filter((expense) => (expense.type ?? 'expense') === 'expense')

  if (isPlannedGroup) {
    return expenseOnly.filter((expense) => Boolean(expense.planId))
  }

  return expenseOnly.filter((expense) => !expense.planId && expense.category === category)
}

export function getCategorySliceInfo(
  categoryKey: string,
  customCategories: CustomCategory[] = [],
): Pick<CategorySlice, 'category' | 'color' | 'icon' | 'isPlannedGroup'> {
  const decoded = decodeCategoryKey(categoryKey)

  if (decoded.isPlannedGroup) {
    return {
      category: PLANNED_CATEGORY_LABEL,
      color: PLAN_DISPLAY.color,
      icon: PLAN_DISPLAY.icon,
      isPlannedGroup: true,
    }
  }

  const info = getCategoryInfo(decoded.category, 'expense', customCategories)
  return {
    category: decoded.category,
    color: info.color,
    icon: info.icon,
    isPlannedGroup: false,
  }
}
