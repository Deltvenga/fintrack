import type { CustomCategory, TransactionType } from './types'

export interface Category {
  id: string
  icon: string
  color: string
  custom?: boolean
  customId?: string
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'Еда', icon: '🍔', color: '#f97316' },
  { id: 'Транспорт', icon: '🚗', color: '#3b82f6' },
  { id: 'Жильё', icon: '🏠', color: '#8b5cf6' },
  { id: 'Развлечения', icon: '🎬', color: '#ec4899' },
  { id: 'Покупки', icon: '🛍️', color: '#14b8a6' },
  { id: 'Другое', icon: '📦', color: '#64748b' },
]

export const INCOME_CATEGORIES: Category[] = [
  { id: 'Зарплата', icon: '💼', color: '#10b981' },
  { id: 'Фриланс', icon: '💻', color: '#06b6d4' },
  { id: 'Возврат', icon: '↩️', color: '#a855f7' },
  { id: 'Другое', icon: '💰', color: '#64748b' },
]

export const PLAN_DISPLAY = { id: 'plan', icon: '📋', color: '#8b5cf6' } as const

export const CUSTOM_ICON_OPTIONS = ['🏷️', '✨', '🎁', '🐾', '💊', '🎓', '⚡', '🌿'] as const

const expenseMap = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c]))
const incomeMap = new Map(INCOME_CATEGORIES.map((c) => [c.id, c]))

export function customToCategory(custom: CustomCategory): Category {
  return {
    id: custom.name,
    icon: custom.icon,
    color: custom.color,
    custom: true,
    customId: custom.id,
  }
}

export function mergeCategories(
  type: TransactionType,
  customCategories: CustomCategory[] = [],
): Category[] {
  const builtin = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const builtinNames = new Set(builtin.map((c) => c.id.toLowerCase()))

  const custom = customCategories
    .filter((c) => c.type === type)
    .filter((c) => !builtinNames.has(c.name.toLowerCase()))
    .map(customToCategory)

  return [...builtin, ...custom]
}

export function getCategoryInfo(
  category: string,
  type: TransactionType = 'expense',
  customCategories: CustomCategory[] = [],
): Category {
  const custom = customCategories.find(
    (c) => c.type === type && c.name.toLowerCase() === category.toLowerCase(),
  )
  if (custom) {
    return customToCategory(custom)
  }

  const map = type === 'income' ? incomeMap : expenseMap
  return map.get(category) ?? { id: category, icon: '📌', color: '#94a3b8' }
}
