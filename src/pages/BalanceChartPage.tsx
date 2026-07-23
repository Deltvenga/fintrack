import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BalanceChart } from '../components/BalanceChart'
import { BottomNav } from '../components/BottomNav'
import { api } from '../lib/api'
import {
  computeDailyBalances,
  computeOpeningBalance,
  getPeriodRange,
  isCurrentPeriod,
  isFuturePeriod,
  shiftReferenceDate,
} from '../lib/period'
import type { Expense } from '../lib/types'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseReferenceDate(value: string | null): Date {
  if (!value) {
    return new Date()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function BalanceChartPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const referenceDate = parseReferenceDate(searchParams.get('ref'))
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!groupId) return

    async function load(currentGroupId: string) {
      setLoading(true)
      setError('')

      try {
        const expensesRes = await api.getExpenses(currentGroupId)
        setExpenses(expensesRes.expenses)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
      } finally {
        setLoading(false)
      }
    }

    void load(groupId)
  }, [groupId])

  const periodRange = useMemo(() => getPeriodRange('month', referenceDate), [referenceDate])
  const dailyBalances = useMemo(
    () => computeDailyBalances(expenses, referenceDate),
    [expenses, referenceDate],
  )

  const openingBalance = useMemo(
    () => computeOpeningBalance(expenses, periodRange.start),
    [expenses, periodRange.start],
  )

  const endBalance =
    dailyBalances.length > 0
      ? dailyBalances[dailyBalances.length - 1].balance
      : openingBalance
  const monthDelta = endBalance - openingBalance

  const atCurrentPeriod = isCurrentPeriod('month', referenceDate)
  const nextDisabled = isFuturePeriod('month', shiftReferenceDate('month', referenceDate, 1))

  function shiftMonth(direction: 1 | -1) {
    const nextDate = shiftReferenceDate('month', referenceDate, direction)
    setSearchParams({ ref: toDateParam(nextDate) })
  }

  function returnToCurrentMonth() {
    setSearchParams({ ref: toDateParam(new Date()) })
  }

  if (!groupId) {
    return null
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link
          to={`/groups/${groupId}/summary?period=month&ref=${toDateParam(referenceDate)}`}
          className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← К сводке
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">График баланса</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Как менялся баланс в течение месяца
        </p>
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      <section className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Предыдущий месяц"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            ‹
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
              {periodRange.label}
            </p>
            {!atCurrentPeriod ? (
              <button
                type="button"
                onClick={returnToCurrentMonth}
                className="mt-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Вернуться к текущему
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(1)}
            disabled={nextDisabled}
            aria-label="Следующий месяц"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </section>

      <section className="mb-6 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-sm">
        <p className="text-sm text-violet-100">Изменение за месяц</p>
        <p className="mt-1 text-3xl font-bold">
          {loading ? '...' : `${monthDelta >= 0 ? '+' : ''}${formatMoney(monthDelta)}`}
        </p>
        <p className="mt-2 text-xs text-violet-200/90">
          {loading
            ? '...'
            : `${formatMoney(openingBalance)} → ${formatMoney(endBalance)}`}
        </p>
      </section>

      <section>
        <BalanceChart points={dailyBalances} loading={loading} />
      </section>

      <BottomNav groupId={groupId} />
    </div>
  )
}
