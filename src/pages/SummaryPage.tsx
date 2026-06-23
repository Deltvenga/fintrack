import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Expense, FinancialSummary, GroupBalance } from '../lib/types'
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

export function SummaryPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balance, setBalance] = useState<GroupBalance | null>(null)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!groupId) return

    async function load(currentGroupId: string) {
      setLoading(true)
      setError('')

      try {
        const [expensesRes, balanceRes, plansRes] = await Promise.all([
          api.getExpenses(currentGroupId),
          api.getBalance(currentGroupId),
          api.getPlans(currentGroupId),
        ])

        setExpenses(expensesRes.expenses)
        setBalance(balanceRes.balance)
        setSummary(plansRes.summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
      } finally {
        setLoading(false)
      }
    }

    load(groupId)
  }, [groupId])

  if (!groupId) {
    return null
  }

  const net = (summary?.totalIncome ?? 0) - (summary?.totalExpenses ?? 0)

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link to="/groups" className="text-sm font-medium text-emerald-700">
          ← К группам
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Сводка</h1>
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <section className="mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-sm">
          <p className="text-sm text-violet-100">Текущий баланс</p>
          <p className="mt-1 text-3xl font-bold">
            {loading ? '...' : formatMoney(summary?.currentBalance ?? 0)}
          </p>
          {!loading && summary ? (
            <p className="mt-2 text-xs text-violet-200">
              {formatMoney(summary.totalIncome)} доходы − {formatMoney(summary.totalExpenses)}{' '}
              расходы − {formatMoney(summary.plannedRemaining)} план
            </p>
          ) : null}
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100">
          <p className="text-xs text-sky-600">Доходы</p>
          <p className="mt-1 text-lg font-bold text-sky-700">
            {formatMoney(summary?.totalIncome ?? balance?.totalIncome ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100">
          <p className="text-xs text-rose-600">Расходы</p>
          <p className="mt-1 text-lg font-bold text-rose-700">
            {formatMoney(summary?.totalExpenses ?? balance?.totalExpenses ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-100">
          <p className="text-xs text-violet-600">План</p>
          <p className="mt-1 text-lg font-bold text-violet-700">
            {formatMoney(summary?.plannedRemaining ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4 ring-1 ring-slate-200">
          <p className="text-xs text-slate-600">Итого</p>
          <p
            className={`mt-1 text-lg font-bold ${
              net >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {net >= 0 ? '+' : ''}
            {formatMoney(net)}
          </p>
        </div>
      </section>

      <section className="mb-6">
        <CategoryPieChart expenses={expenses} loading={loading} />
      </section>

      <section>
        <BalanceCard balance={balance} loading={loading} />
      </section>

      <BottomNav groupId={groupId} />
    </div>
  )
}
