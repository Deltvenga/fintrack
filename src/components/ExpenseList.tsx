import { useState } from 'react'
import { api } from '../lib/api'
import type { CustomCategory, Expense } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'
import { ConfirmDialog } from './ConfirmDialog'

interface ExpenseListProps {
  expenses: Expense[]
  customCategories?: CustomCategory[]
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

export function ExpenseList({ expenses, customCategories = [], loading, onDeleted }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function confirmDelete() {
    if (!pendingDelete) return

    setDeleteError('')
    setDeletingId(pendingDelete.id)
    try {
      await api.deleteExpense(pendingDelete.id)
      onDeleted?.(pendingDelete.id)
      setPendingDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить')
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

  const pendingLabel = pendingDelete?.type === 'income' ? 'доход' : 'расход'
  const pendingName = pendingDelete?.planName ?? pendingDelete?.category ?? ''

  return (
    <>
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
                  customCategories={customCategories}
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
                        onClick={() => {
                          setDeleteError('')
                          setPendingDelete(expense)
                        }}
                        disabled={deletingId === expense.id}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label={`Удалить ${isIncome ? 'доход' : 'расход'}`}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Удалить ${pendingLabel}?`}
        message="Это действие нельзя отменить. Запись будет удалена из группы."
        detail={
          pendingDelete
            ? `${pendingName} · ${formatMoney(pendingDelete.amount)}`
            : undefined
        }
        loading={deletingId === pendingDelete?.id}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (deletingId) return
          setPendingDelete(null)
          setDeleteError('')
        }}
      />
    </>
  )
}
