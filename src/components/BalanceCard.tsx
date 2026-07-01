import type { GroupBalance } from '../lib/types'

interface BalanceCardProps {
  balance: GroupBalance | null
  loading?: boolean
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function BalanceCard({ balance, loading }: BalanceCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
        <p className="text-slate-500 dark:text-slate-400">Загрузка баланса...</p>
      </div>
    )
  }

  if (!balance) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-rose-600 p-5 text-white shadow-sm">
          <p className="text-sm text-rose-100">Расходы</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(balance.totalExpenses)}</p>
        </div>
        <div className="rounded-2xl bg-sky-600 p-5 text-white shadow-sm">
          <p className="text-sm text-sky-100">Доходы</p>
          <p className="mt-1 text-2xl font-bold">{formatMoney(balance.totalIncome ?? 0)}</p>
        </div>
      </div>
    </div>
  )
}
