import { getCategoryInfo } from '../lib/categories'
import type { CustomCategory, Expense } from '../lib/types'

interface CategorySlice {
  category: string
  amount: number
  color: string
  icon: string
  percent: number
}

interface CategoryPieChartProps {
  expenses: Expense[]
  customCategories?: CustomCategory[]
  loading?: boolean
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function buildSlices(expenses: Expense[], customCategories: CustomCategory[]): CategorySlice[] {
  const expenseOnly = expenses.filter((e) => (e.type ?? 'expense') === 'expense')
  const totals = new Map<string, number>()

  for (const expense of expenseOnly) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount)
  }

  const total = Array.from(totals.values()).reduce((sum, value) => sum + value, 0)
  if (total === 0) {
    return []
  }

  return Array.from(totals.entries())
    .map(([category, amount]) => {
      const info = getCategoryInfo(category, 'expense', customCategories)
      return {
        category,
        amount,
        color: info.color,
        icon: info.icon,
        percent: Math.round((amount / total) * 100),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function buildConicGradient(slices: CategorySlice[]): string {
  let cumulative = 0
  const stops: string[] = []

  for (const slice of slices) {
    const start = cumulative
    cumulative += slice.percent
    stops.push(`${slice.color} ${start}% ${cumulative}%`)
  }

  return `conic-gradient(${stops.join(', ')})`
}

export function CategoryPieChart({ expenses, customCategories = [], loading }: CategoryPieChartProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
        Загрузка сводки...
      </div>
    )
  }

  const slices = buildSlices(expenses, customCategories)
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0)

  if (slices.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
        Нет расходов для сводки
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h3 className="font-semibold text-slate-900">Расходы по категориям</h3>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-44 w-44 shrink-0">
          <div
            className="h-full w-full rounded-full shadow-inner"
            style={{ background: buildConicGradient(slices) }}
          />
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
            <p className="text-xs text-slate-500">Всего</p>
            <p className="text-sm font-bold text-slate-900">{formatMoney(total)}</p>
          </div>
        </div>

        <ul className="w-full space-y-3">
          {slices.map((slice) => (
            <li key={slice.category} className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-lg" aria-hidden>
                {slice.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{slice.category}</p>
                <p className="text-xs text-slate-500">{slice.percent}%</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{formatMoney(slice.amount)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
