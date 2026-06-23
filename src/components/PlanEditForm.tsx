import type { FormEvent } from 'react'
import { useState } from 'react'
import { api } from '../lib/api'
import type { PlannedExpense, PlanRecurrence } from '../lib/types'
import { PLAN_DISPLAY } from '../lib/categories'
import { PlanEmojiField } from './PlanEmojiField'

interface PlanEditFormProps {
  plan: PlannedExpense
  onSaved: () => void
  onCancel: () => void
}

export function PlanEditForm({ plan, onSaved, onCancel }: PlanEditFormProps) {
  const [amount, setAmount] = useState(String(plan.amount))
  const [targetMonth, setTargetMonth] = useState(plan.targetMonth)
  const [recurrence, setRecurrence] = useState<PlanRecurrence>(plan.recurrence)
  const [description, setDescription] = useState(plan.description)
  const [icon, setIcon] = useState(plan.icon ?? PLAN_DISPLAY.icon)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    const parsedAmount = Number(amount.replace(',', '.'))
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Введите корректную сумму')
      return
    }

    setSubmitting(true)
    try {
      await api.updatePlan(plan.id, {
        amount: parsedAmount,
        targetMonth,
        recurrence,
        description,
        icon,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-slate-100 pt-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Сумма, ₽</label>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Месяц</label>
        <input
          type="month"
          value={targetMonth}
          onChange={(e) => setTargetMonth(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Периодичность</label>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRecurrence('monthly')}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              recurrence === 'monthly'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Ежемесячно
          </button>
          <button
            type="button"
            onClick={() => setRecurrence('once')}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              recurrence === 'once'
                ? 'bg-white text-violet-700 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            Разово
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Описание</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
          placeholder="Необязательно"
        />
      </div>

      <PlanEmojiField value={icon} onChange={setIcon} />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {submitting ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </form>
  )
}
