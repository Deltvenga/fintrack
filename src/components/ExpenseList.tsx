import { useState } from 'react'
import { api } from '../lib/api'
import type { Expense } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'

interface ExpenseListProps {
  expenses: Expense[]
  loading?: boolean
  onDeleted?: (expenseId: string) => void
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

export function ExpenseList({ expenses, loading, onDeleted }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(expense: Expense) {
    const label = expense.type === 'income' ? 'доход' : 'расход'
    if (!window.confirm(`Удалить ${label} «${expense.planName ?? expense.category}» на ${formatMoney(expense.amount)}?`)) {
      return
    }

    setDeletingId(expense.id)
    try {
      await api.deleteExpense(expense.id)
      onDeleted?.(expense.id)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Не удалось удалить')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
        Загрузка...
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
        Записей пока нет. Добавьте расход или доход!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const isIncome = expense.type === 'income'
        const isPlanned = Boolean(expense.planId)
        const displayName = expense.planName ?? expense.category

        return (
          <article
            key={expense.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex items-start gap-3">
              <CategoryIcon
                category={displayName}
                type={expense.type ?? 'expense'}
                isPlan={isPlanned}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{displayName}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isIncome
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isIncome ? 'Доход' : 'Расход'}
                      </span>
                      {isPlanned ? (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          По плану
                        </span>
                      ) : null}
                    </div>
                    {expense.description ? (
                      <p className="mt-1 text-sm text-slate-500">{expense.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(expense.date)} · {isIncome ? 'получил' : 'оплатил'}{' '}
                      {expense.paidByUsername}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p
                      className={`text-lg font-semibold ${
                        isIncome ? 'text-sky-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '−'}
                      {formatMoney(expense.amount)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense)}
                      disabled={deletingId === expense.id}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      aria-label={`Удалить ${isIncome ? 'доход' : 'расход'}`}
                    >
                      {deletingId === expense.id ? '...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
