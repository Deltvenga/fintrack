import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { CustomCategory, Expense, FinancialSummary, GroupBalance, PlannedExpense } from '../lib/types'
import {
  computeCumulativeTotals,
  computeOpeningBalance,
  computePeriodTotals,
  filterExpensesByPeriod,
  getPeriodRange,
  isCurrentPeriod,
  isFuturePeriod,
  planMatchesPeriod,
  shiftReferenceDate,
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
  day: 'День',
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
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date())
  const [includePlan, setIncludePlan] = useState(true)

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

  const periodRange = useMemo(
    () => getPeriodRange(period, referenceDate),
    [period, referenceDate],
  )

  const periodExpenses = useMemo(
    () => filterExpensesByPeriod(expenses, period, referenceDate),
    [expenses, period, referenceDate],
  )

  const periodTotals = useMemo(
    () => computePeriodTotals(periodExpenses),
    [periodExpenses],
  )

  const periodPlans = useMemo(
    () => plans.filter((plan) => planMatchesPeriod(plan, period, referenceDate)),
    [plans, period, referenceDate],
  )

  const atCurrentPeriod = isCurrentPeriod(period, referenceDate)
  const nextDisabled = isFuturePeriod(period, shiftReferenceDate(period, referenceDate, 1))

  const periodPlannedRemaining = useMemo(
    () =>
      periodPlans.reduce((sum, plan) => {
        const spent = periodExpenses
          .filter(
            (expense) =>
              expense.planId === plan.id && (expense.type ?? 'expense') === 'expense',
          )
          .reduce((total, expense) => total + expense.amount, 0)

        return sum + Math.max(0, plan.amount - Math.min(plan.amount, spent))
      }, 0),
    [periodPlans, periodExpenses],
  )

  const periodPlannedSpent = useMemo(
    () =>
      periodExpenses
        .filter((e) => (e.type ?? 'expense') === 'expense' && Boolean(e.planId))
        .reduce((sum, e) => sum + e.amount, 0),
    [periodExpenses],
  )

  const openingBalance = useMemo(
    () => computeOpeningBalance(expenses, periodRange.start),
    [expenses, periodRange.start],
  )

  const cumulativeTotals = useMemo(
    () => computeCumulativeTotals(expenses, periodRange.end),
    [expenses, periodRange.end],
  )

  const planApplies = period !== 'day' && includePlan
  const periodBalance =
    cumulativeTotals.net - (planApplies ? periodPlannedRemaining : 0)

  if (!groupId) {
    return null
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link to="/groups" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          ← К группам
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Сводка</h1>
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      <section className="mb-4">
        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
          {(Object.keys(PERIOD_LABELS) as SummaryPeriod[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition ${
                period === key
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setReferenceDate((current) => shiftReferenceDate(period, current, -1))}
            aria-label="Предыдущий период"
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
                onClick={() => setReferenceDate(new Date())}
                className="mt-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Вернуться к текущему
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setReferenceDate((current) => shiftReferenceDate(period, current, 1))}
            disabled={nextDisabled}
            aria-label="Следующий период"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-lg font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </section>

      <section className="mb-6">
        <button
          type="button"
          onClick={() => setIncludePlan((current) => !current)}
          disabled={period === 'day'}
          className="w-full rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-left text-white shadow-sm transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-default disabled:hover:from-violet-600 disabled:hover:to-indigo-600"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-violet-100">
              {planApplies ? 'Баланс за период (с планом)' : 'Фактический баланс'}
            </p>
            {period !== 'day' ? (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-violet-50">
                {planApplies ? 'с планом' : 'факт'}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-3xl font-bold">
            {loading ? '...' : formatMoney(periodBalance)}
          </p>
          {!loading ? (
            <p className="mt-2 text-xs text-violet-200">
              {openingBalance !== 0 ? (
                <>
                  {formatMoney(openingBalance)} перенос +{' '}
                </>
              ) : null}
              {formatMoney(periodTotals.totalIncome)} доходы −{' '}
              {formatMoney(periodTotals.totalExpenses)} расходы
              {planApplies ? <> − {formatMoney(periodPlannedRemaining)} остаток плана</> : null}
            </p>
          ) : null}
          {!loading && period === 'day' && periodPlannedSpent > 0 ? (
            <p className="mt-1 text-xs text-violet-200/80">
              Из них плановые {formatMoney(periodPlannedSpent)}
            </p>
          ) : null}
          {period !== 'day' ? (
            <p className="mt-2 text-[11px] text-violet-200/80">
              {planApplies
                ? 'Нажмите, чтобы увидеть фактический баланс (без остатка плана)'
                : 'Остаток на картах: перенос + доходы − расходы, план не вычитается'}
            </p>
          ) : null}
        </button>
      </section>

      <section className="mb-6 rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 ring-1 ring-slate-200 dark:ring-slate-700">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Всего (с начала)</p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
          {formatMoney(summary?.currentBalance ?? 0)}
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Доходы − расходы − план на текущий месяц
        </p>
      </section>

      <section className={`mb-6 grid gap-3 ${period === 'day' ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-950/40 p-4 ring-1 ring-sky-100 dark:ring-sky-900">
          <p className="text-xs text-sky-600 dark:text-sky-400">Доходы</p>
          <p className="mt-1 text-lg font-bold text-sky-700 dark:text-sky-300">
            {formatMoney(periodTotals.totalIncome)}
          </p>
        </div>
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 p-4 ring-1 ring-rose-100 dark:ring-rose-900">
          <p className="text-xs text-rose-600 dark:text-rose-400">Расходы</p>
          <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-300">
            {formatMoney(periodTotals.totalExpenses)}
          </p>
        </div>
        {period !== 'day' ? (
          <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/40 p-4 ring-1 ring-violet-100 dark:ring-violet-900">
            <p className="text-xs text-violet-600 dark:text-violet-400">План</p>
            <p className="mt-1 text-lg font-bold text-violet-700 dark:text-violet-300">
              {formatMoney(periodPlannedRemaining)}
            </p>
          </div>
        ) : null}
        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 ring-1 ring-slate-200 dark:ring-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400">Итого</p>
          <p
            className={`mt-1 text-lg font-bold ${
              periodTotals.net >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {periodTotals.net >= 0 ? '+' : ''}
            {formatMoney(periodTotals.net)}
          </p>
        </div>
      </section>

      <section className="mb-6">
        <CategoryPieChart
          groupId={groupId}
          expenses={periodExpenses}
          customCategories={customCategories}
          period={period}
          referenceDate={referenceDate}
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
