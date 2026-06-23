import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { CustomCategory, Expense, FinancialSummary, GroupBalance, PlannedExpense } from '../lib/types'
import {
  computePeriodTotals,
  filterExpensesByPeriod,
  getPeriodRange,
  planMatchesPeriod,
  type SummaryPeriod,
} from '../lib/period'
import { BalanceCard } from '../components/BalanceCard'
import { BottomNav } from '../components/BottomNav'
import { CategoryPieChart } from '../components/CategoryPieChart'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

const PERIOD_LABELS: Record<SummaryPeriod, string> = {
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
}

export function SummaryPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [plans, setPlans] = useState<PlannedExpense[]>([])
  const [balance, setBalance] = useState<GroupBalance | null>(null)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [period, setPeriod] = useState<SummaryPeriod>('month')

  useEffect(() => {
    if (!groupId) return

    async function load(currentGroupId: string) {
      setLoading(true)
      setError('')

      try {
        const [expensesRes, balanceRes, plansRes, categoriesRes] = await Promise.all([
          api.getExpenses(currentGroupId),
          api.getBalance(currentGroupId),
          api.getPlans(currentGroupId),
          api.getCategories(currentGroupId),
        ])

        setExpenses(expensesRes.expenses)
        setBalance(balanceRes.balance)
        setSummary(plansRes.summary)
        setPlans(plansRes.plans)
        setCustomCategories(categoriesRes.categories)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
      } finally {
        setLoading(false)
      }
    }

    load(groupId)
  }, [groupId])

  const periodRange = useMemo(() => getPeriodRange(period), [period])

  const periodExpenses = useMemo(
    () => filterExpensesByPeriod(expenses, period),
    [expenses, period],
  )

  const periodTotals = useMemo(
    () => computePeriodTotals(periodExpenses),
    [periodExpenses],
  )

  const periodPlans = useMemo(
    () => plans.filter((plan) => planMatchesPeriod(plan, period)),
    [plans, period],
  )

  const periodPlannedRemaining = useMemo(
    () => periodPlans.reduce((sum, plan) => sum + plan.remaining, 0),
    [periodPlans],
  )

  const periodBalance = periodTotals.net - periodPlannedRemaining

  if (!groupId) {
    return null
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link to="/groups" className="text-sm font-medium text-emerald-700">
          ← К группам
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Сводка</h1>
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <section className="mb-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
          {(Object.keys(PERIOD_LABELS) as SummaryPeriod[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                period === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">{periodRange.label}</p>
      </section>

      <section className="mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-sm">
          <p className="text-sm text-violet-100">Баланс за период</p>
          <p className="mt-1 text-3xl font-bold">
            {loading ? '...' : formatMoney(periodBalance)}
          </p>
          {!loading ? (
            <p className="mt-2 text-xs text-violet-200">
              {formatMoney(periodTotals.totalIncome)} доходы −{' '}
              {formatMoney(periodTotals.totalExpenses)} расходы −{' '}
              {formatMoney(periodPlannedRemaining)} план
            </p>
          ) : null}
        </div>
      </section>

      <section className="mb-6 rounded-2xl bg-slate-100 p-4 ring-1 ring-slate-200">
        <p className="text-xs font-medium text-slate-500">Всего (с начала)</p>
        <p className="mt-1 text-lg font-bold text-slate-900">
          {formatMoney(summary?.currentBalance ?? 0)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Доходы − расходы − план на текущий месяц
        </p>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
          <p className="text-xs text-sky-600">Доходы</p>
          <p className="mt-1 text-lg font-bold text-sky-700">
            {formatMoney(periodTotals.totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
          <p className="text-xs text-rose-600">Расходы</p>
          <p className="mt-1 text-lg font-bold text-rose-700">
            {formatMoney(periodTotals.totalExpenses)}
          </p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
          <p className="text-xs text-violet-600">План</p>
          <p className="mt-1 text-lg font-bold text-violet-700">
            {formatMoney(periodPlannedRemaining)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4 ring-1 ring-slate-200">
          <p className="text-xs text-slate-600">Итого</p>
          <p
            className={`mt-1 text-lg font-bold ${
              periodTotals.net >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {periodTotals.net >= 0 ? '+' : ''}
            {formatMoney(periodTotals.net)}
          </p>
        </div>
      </section>

      <section className="mb-6">
        <CategoryPieChart
          expenses={periodExpenses}
          customCategories={customCategories}
          loading={loading}
        />
      </section>

      <section>
        <BalanceCard balance={balance} loading={loading} />
      </section>

      <BottomNav groupId={groupId} />
    </div>
  )
}
