import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { EXPENSE_CATEGORIES } from '../lib/categories'
import type { FinancialSummary, PlannedExpense, PlanRecurrence } from '../lib/types'
import { BottomNav } from '../components/BottomNav'
import { CategoryIcon } from '../components/CategoryIcon'
import { PlanList } from '../components/PlanList'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PlanningPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [plans, setPlans] = useState<PlannedExpense[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].id)
  const [recurrence, setRecurrence] = useState<PlanRecurrence>('monthly')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const loadData = useCallback(async (currentGroupId: string) => {
    setLoading(true)
    setError('')

    try {
      const res = await api.getPlans(currentGroupId)
      setPlans(res.plans)
      setSummary(res.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!groupId) return
    loadData(groupId)
  }, [groupId, loadData])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!groupId) return

    setFormError('')
    setSubmitting(true)

    const parsedAmount = Number(amount.replace(',', '.'))
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Введите корректную сумму')
      setSubmitting(false)
      return
    }

    try {
      const res = await api.createPlan({
        groupId,
        category,
        amount: parsedAmount,
        recurrence,
        description,
      })
      setPlans((prev) => [...prev, res.plan])
      setSummary(res.summary)
      setAmount('')
      setDescription('')
      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось добавить план')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleted() {
    if (!groupId) return
    await loadData(groupId)
  }

  if (!groupId) {
    return null
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link to="/groups" className="text-sm font-medium text-emerald-700">
          ← К группам
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Планирование</h1>
        <p className="mt-1 text-sm text-slate-500">
          Обязательные расходы учитываются в текущем балансе. Фактические траты по категории
          засчитываются в план.
        </p>
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      {summary ? (
        <section className="mb-6 rounded-2xl bg-violet-600 p-5 text-white shadow-sm">
          <p className="text-sm text-violet-100">Текущий баланс</p>
          <p className="mt-1 text-3xl font-bold">{formatMoney(summary.currentBalance)}</p>
          <p className="mt-2 text-xs text-violet-200">
            {formatMoney(summary.totalIncome)} доходы − {formatMoney(summary.totalExpenses)}{' '}
            расходы − {formatMoney(summary.plannedRemaining)} план
          </p>
        </section>
      ) : null}

      <section className="mb-4">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          {showForm ? 'Скрыть форму' : '+ Добавить обязательный расход'}
        </button>
      </section>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Сумма, ₽</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="0"
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
            <label className="mb-2 block text-sm font-medium text-slate-700">Категория</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${
                    category === item.id
                      ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CategoryIcon category={item.id} type="expense" size="sm" />
                  <span className="font-medium text-slate-800">{item.id}</span>
                </button>
              ))}
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

          {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {submitting ? 'Сохранение...' : 'Добавить план'}
          </button>
        </form>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Обязательные расходы</h2>
        <PlanList plans={plans} loading={loading} onDeleted={handleDeleted} />
      </section>

      <BottomNav groupId={groupId} />
    </div>
  )
}
