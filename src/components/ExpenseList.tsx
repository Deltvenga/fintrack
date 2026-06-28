import { useState } from 'react'
import { api } from '../lib/api'
import type { CustomCategory, Expense } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'
import { ConfirmDialog } from './ConfirmDialog'
import { EditExpenseDialog } from './EditExpenseDialog'

interface ExpenseListProps {
  expenses: Expense[]
  customCategories?: CustomCategory[]
  loading?: boolean
  onDeleted?: (expenseId: string) => void
  onUpdated?: (expense: Expense) => void
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

export function ExpenseList({
  expenses,
  customCategories = [],
  loading,
  onDeleted,
  onUpdated,
}: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [editing, setEditing] = useState<Expense | null>(null)

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
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
        Загрузка...
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
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
              className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
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
                        <p className="font-medium text-slate-900 dark:text-slate-100">{displayName}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isIncome
                              ? 'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                              : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isIncome ? 'Доход' : 'Расход'}
                        </span>
                        {isPlanned ? (
                          <span className="rounded-full bg-violet-100 dark:bg-violet-950/50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                            По плану
                          </span>
                        ) : null}
                      </div>
                      {expense.description ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{expense.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(expense.date)} · {isIncome ? 'получил' : 'оплатил'}{' '}
                        {expense.paidByUsername}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p
                        className={`text-lg font-semibold ${
                          isIncome ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '−'}
                        {formatMoney(expense.amount)}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(expense)}
                          disabled={deletingId === expense.id}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-50"
                          aria-label={`Изменить ${isIncome ? 'доход' : 'расход'}`}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError('')
                            setPendingDelete(expense)
                          }}
                          disabled={deletingId === expense.id}
                          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-400 disabled:opacity-50"
                          aria-label={`Удалить ${isIncome ? 'доход' : 'расход'}`}
                        >
                          Удалить
                        </button>
                      </div>
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

      <EditExpenseDialog
        expense={editing}
        onClose={() => setEditing(null)}
        onUpdated={(updated) => onUpdated?.(updated)}
      />
    </>
  )
}
