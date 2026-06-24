import { useMemo, useState } from 'react'
import { getCategoryInfo } from '../lib/categories'
import type { CustomCategory, Expense } from '../lib/types'

interface CategorySlice {
  category: string
  amount: number
  color: string
  icon: string
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

  return Array.from(totals.entries())
    .map(([category, amount]) => {
      const info = getCategoryInfo(category, 'expense', customCategories)
      return {
        category,
        amount,
        color: info.color,
        icon: info.icon,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

function buildConicGradient(slices: Array<{ color: string; percent: number }>): string {
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
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const slices = useMemo(
    () => buildSlices(expenses, customCategories),
    [expenses, customCategories],
  )

  const activeSlices = slices.filter((slice) => !excluded.has(slice.category))
  const activeTotal = activeSlices.reduce((sum, slice) => sum + slice.amount, 0)

  const gradientSlices = activeSlices.map((slice) => ({
    color: slice.color,
    percent: activeTotal > 0 ? (slice.amount / activeTotal) * 100 : 0,
  }))

  function toggleCategory(category: string) {
    setExcluded((current) => {
      const next = new Set(current)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
        Загрузка сводки...
      </div>
    )
  }

  if (slices.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
        Нет расходов для сводки
      </div>
    )
  }

  return (
    <div className="category-pie-chart rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Расходы по категориям</h3>
        {excluded.size > 0 ? (
          <button
            type="button"
            onClick={() => setExcluded(new Set())}
            className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Сбросить
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="pie-chart-frame relative h-44 w-44 shrink-0">
          <div
            className="pie-chart-ring h-full w-full rounded-full shadow-inner ring-2 ring-white dark:ring-slate-900"
            style={{
              backgroundImage:
                activeSlices.length > 0
                  ? buildConicGradient(gradientSlices)
                  : undefined,
              backgroundColor: activeSlices.length === 0 ? '#e2e8f0' : undefined,
            }}
          />
          <div className="pie-chart-hole absolute inset-6 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900 text-center shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Всего</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatMoney(activeTotal)}</p>
          </div>
        </div>

        <ul className="w-full space-y-3">
          {slices.map((slice) => {
            const isExcluded = excluded.has(slice.category)
            const percent =
              activeTotal > 0 && !isExcluded
                ? Math.round((slice.amount / activeTotal) * 100)
                : 0

            return (
              <li key={slice.category}>
                <button
                  type="button"
                  onClick={() => toggleCategory(slice.category)}
                  aria-pressed={!isExcluded}
                  className={`flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    isExcluded ? 'opacity-40' : ''
                  }`}
                >
                  <span
                    className="pie-chart-legend-dot h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-lg" aria-hidden>
                    {slice.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium text-slate-900 dark:text-slate-100 ${
                        isExcluded ? 'line-through' : ''
                      }`}
                    >
                      {slice.category}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isExcluded ? 'исключено' : `${percent}%`}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatMoney(slice.amount)}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
