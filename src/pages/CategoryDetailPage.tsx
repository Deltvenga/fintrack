import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import {
  decodeCategoryKey,
  filterExpensesByCategoryKey,
  getCategorySliceInfo,
} from '../lib/categorySlices'
import {
  filterExpensesByPeriod,
  getPeriodRange,
  type SummaryPeriod,
} from '../lib/period'
import type { CustomCategory, Expense } from '../lib/types'
import { BottomNav } from '../components/BottomNav'
import { ExpenseList } from '../components/ExpenseList'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

const PERIOD_LABELS: Record<SummaryPeriod, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
}

function parsePeriod(value: string | null): SummaryPeriod {
  if (value === 'day' || value === 'week' || value === 'month' || value === 'year') {
    return value
  }
  return 'month'
}

function parseReferenceDate(value: string | null): Date {
  if (!value) {
    return new Date()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function CategoryDetailPage() {
  const { groupId, categoryKey = '' } = useParams<{ groupId: string; categoryKey: string }>()
  const [searchParams] = useSearchParams()
  const period = parsePeriod(searchParams.get('period'))
  const referenceDate = parseReferenceDate(searchParams.get('ref'))

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const summarySearch = searchParams.toString()
  const summaryLink = summarySearch
    ? `/groups/${groupId}/summary?${summarySearch}`
    : `/groups/${groupId}/summary`

  const loadData = useCallback(async (currentGroupId: string) => {
    setLoading(true)
    setError('')

    try {
      const [expensesRes, categoriesRes] = await Promise.all([
        api.getExpenses(currentGroupId),
        api.getCategories(currentGroupId),
      ])

      setExpenses(expensesRes.expenses)
      setCustomCategories(categoriesRes.categories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!groupId) return
    void loadData(groupId)
  }, [groupId, loadData])

  const periodRange = useMemo(
    () => getPeriodRange(period, referenceDate),
    [period, referenceDate],
  )

  const periodExpenses = useMemo(
    () => filterExpensesByPeriod(expenses, period, referenceDate),
    [expenses, period, referenceDate],
  )

  const categoryExpenses = useMemo(
    () => filterExpensesByCategoryKey(periodExpenses, categoryKey),
    [periodExpenses, categoryKey],
  )

  const categoryInfo = useMemo(
    () => getCategorySliceInfo(categoryKey, customCategories),
    [categoryKey, customCategories],
  )

  const totalAmount = useMemo(
    () => categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [categoryExpenses],
  )

  async function handleDeleted(expenseId: string) {
    setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId))
  }

  async function handleUpdated(updated: Expense) {
    setExpenses((prev) => prev.map((expense) => (expense.id === updated.id ? updated : expense)))
  }

  if (!groupId || !categoryKey) {
    return null
  }

  const decoded = decodeCategoryKey(categoryKey)

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link
          to={summaryLink}
          className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← К сводке
        </Link>

        <div className="mt-4 flex items-start gap-3">
          <span className="text-3xl" aria-hidden>
            {categoryInfo.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {categoryInfo.category}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {PERIOD_LABELS[period]} · {periodRange.label}
            </p>
            {decoded.isPlannedGroup ? (
              <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
                Все расходы, привязанные к планам
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      <section className="mb-6 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Сумма за период</p>
        <p className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-300">
          {loading ? '...' : formatMoney(totalAmount)}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {loading ? '...' : `${categoryExpenses.length} операций`}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Операции</h2>
        <ExpenseList
          expenses={categoryExpenses}
          customCategories={customCategories}
          loading={loading}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      </section>

      <BottomNav groupId={groupId} />
    </div>
  )
}
