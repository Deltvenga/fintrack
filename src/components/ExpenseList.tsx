import type { Expense } from '../lib/types'

interface ExpenseListProps {
  expenses: Expense[]
  loading?: boolean
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export function ExpenseList({ expenses, loading }: ExpenseListProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
        Загрузка расходов...
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
        Расходов пока нет. Добавьте первый!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <article
          key={expense.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{expense.category}</p>
              {expense.description ? (
                <p className="mt-1 text-sm text-slate-500">{expense.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-400">
                {formatDate(expense.date)} · оплатил {expense.paidByUsername}
              </p>
            </div>
            <p className="text-lg font-semibold text-emerald-700">
              {formatMoney(expense.amount)}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
