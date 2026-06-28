import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Expense } from '../lib/types'
import { CategoryPicker } from './CategoryPicker'

interface EditExpenseDialogProps {
  expense: Expense | null
  onClose: () => void
  onUpdated: (expense: Expense) => void
}

export function EditExpenseDialog({ expense, onClose, onUpdated }: EditExpenseDialogProps) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const open = expense !== null
  const isIncome = expense?.type === 'income'
  const isPlanned = Boolean(expense?.planId)

  useEffect(() => {
    if (!expense) return
    setAmount(String(expense.amount))
    setCategory(expense.category)
    setDescription(expense.description ?? '')
    setDate(expense.date.slice(0, 10))
    setError('')
  }, [expense])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, saving, onClose])

  if (!expense) {
    return null
  }

  async function handleSave() {
    if (!expense) return

    setError('')

    const parsedAmount = Number(amount.replace(',', '.'))
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Введите корректную сумму')
      return
    }

    if (!isPlanned && !category.trim()) {
      setError('Выберите категорию')
      return
    }

    setSaving(true)
    try {
      const res = await api.updateExpense(expense.id, {
        amount: parsedAmount,
        ...(isPlanned ? {} : { category }),
        description,
        date,
      })
      onUpdated(res.expense)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить изменения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={saving ? undefined : onClose}
        disabled={saving}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-expense-title"
        className="relative max-h-[90dvh] w-full max-w-md animate-[slideUp_0.2s_ease-out] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700"
      >
        <h2 id="edit-expense-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {isIncome ? 'Изменить доход' : 'Изменить расход'}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Сумма, ₽</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 dark:bg-slate-800 dark:text-slate-100"
              placeholder="0"
            />
          </div>

          {isPlanned ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Категория</label>
              <div className="rounded-xl bg-violet-50 dark:bg-violet-950/40 px-4 py-3 text-sm text-violet-700 dark:text-violet-300">
                По плану: {expense.planName ?? expense.category}
              </div>
            </div>
          ) : (
            <CategoryPicker
              groupId={expense.groupId}
              type={expense.type ?? 'expense'}
              value={category}
              onChange={setCategory}
            />
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Описание</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-emerald-500 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Необязательно"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-emerald-500 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
