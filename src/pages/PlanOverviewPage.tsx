import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import {
  buildPlanOverviewByMonth,
  buildPlanOverviewTotals,
} from '../lib/planOverview'
import type { Expense, PlannedExpense } from '../lib/types'
import { BottomNav } from '../components/BottomNav'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function OverviewRow({
  label,
  amount,
  spent,
  remaining,
  colorClass,
}: {
  label: string
  amount: number
  spent: number
  remaining: number
  colorClass: string
}) {
  if (amount === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <div className="text-right">
        <p className={`font-semibold ${colorClass}`}>{formatMoney(amount)}</p>
        <p className="text-xs text-slate-400">
          потрачено {formatMoney(spent)} · осталось {formatMoney(remaining)}
        </p>
      </div>
    </div>
  )
}

export function PlanOverviewPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [plans, setPlans] = useState<PlannedExpense[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!groupId) return

    async function load(currentGroupId: string) {
      setLoading(true)
      setError('')

      try {
        const [plansRes, expensesRes] = await Promise.all([
          api.getPlans(currentGroupId),
          api.getExpenses(currentGroupId),
        ])
        setPlans(plansRes.plans)
        setExpenses(expensesRes.expenses)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
      } finally {
        setLoading(false)
      }
    }

    load(groupId)
  }, [groupId])

  const months = useMemo(
    () => buildPlanOverviewByMonth(plans, expenses, groupId),
    [plans, expenses, groupId],
  )
  const totals = useMemo(() => buildPlanOverviewTotals(months), [months])

  if (!groupId) {
    return null
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link
          to={`/groups/${groupId}/planning`}
          className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          ← К планированию
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Планы по месяцам</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Сколько занимают ежемесячные, разовые и все планы в каждом месяце.
        </p>
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      <section className="mb-6 rounded-2xl bg-violet-600 p-5 text-white shadow-sm">
        <p className="text-sm text-violet-100">Всего по всем месяцам</p>
        <p className="mt-1 text-3xl font-bold">{formatMoney(totals.totalAmount)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-violet-100">Ежемесячные</p>
            <p className="font-semibold">{formatMoney(totals.monthlyAmount)}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-violet-100">Разовые</p>
            <p className="font-semibold">{formatMoney(totals.onceAmount)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-violet-200">
          Потрачено по планам: {formatMoney(totals.totalSpent)} · осталось{' '}
          {formatMoney(totals.totalRemaining)}
        </p>
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          Загрузка...
        </div>
      ) : months.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          Планов пока нет.{' '}
          <Link to={`/groups/${groupId}/planning`} className="font-medium text-violet-600 dark:text-violet-400">
            Добавьте первый
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {months.map((month) => {
            const spentPercent =
              month.totalAmount > 0
                ? Math.min(100, Math.round((month.totalSpent / month.totalAmount) * 100))
                : 0

            return (
              <article
                key={month.targetMonth}
                className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold capitalize text-slate-900 dark:text-slate-100">
                      {month.label}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {month.monthlyCount + month.onceCount} план(ов)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Итого</p>
                    <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                      {formatMoney(month.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="mb-1 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${spentPercent}%` }}
                    title={`Выполнено: ${spentPercent}%`}
                  />
                </div>
                <p className="mb-4 text-xs text-slate-400">
                  Выполнено {spentPercent}% — потрачено {formatMoney(month.totalSpent)} из{' '}
                  {formatMoney(month.totalAmount)}
                </p>

                <div className="space-y-3">
                  <OverviewRow
                    label={`Ежемесячные (${month.monthlyCount})`}
                    amount={month.monthlyAmount}
                    spent={month.monthlySpent}
                    remaining={month.monthlyRemaining}
                    colorClass="text-violet-700 dark:text-violet-300"
                  />
                  <OverviewRow
                    label={`Разовые (${month.onceCount})`}
                    amount={month.onceAmount}
                    spent={month.onceSpent}
                    remaining={month.onceRemaining}
                    colorClass="text-indigo-600"
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}

      <BottomNav groupId={groupId} />
    </div>
  )
}
