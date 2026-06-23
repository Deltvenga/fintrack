import type { PlannedExpense } from './types'

export function getPlanDisplay(plan: PlannedExpense) {
  const title = plan.name?.trim() || 'Без названия'
  const description = plan.description?.trim()
  const subtitle = description && description !== title ? description : undefined

  return { title, subtitle }
}
