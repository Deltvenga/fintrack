export interface Category {
  id: string
  icon: string
  color: string
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

const expenseMap = new Map(EXPENSE_CATEGORIES.map((c) => [c.id, c]))
const incomeMap = new Map(INCOME_CATEGORIES.map((c) => [c.id, c]))

export function getCategoryInfo(
  category: string,
  type: 'expense' | 'income' = 'expense',
): Category {
  const map = type === 'income' ? incomeMap : expenseMap
  return map.get(category) ?? { id: category, icon: '📌', color: '#94a3b8' }
}
