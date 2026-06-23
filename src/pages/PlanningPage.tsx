import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { FinancialSummary, PlannedExpense, PlanRecurrence } from '../lib/types'
import { currentMonthValue } from '../lib/period'
import { BottomNav } from '../components/BottomNav'
import { PlanList } from '../components/PlanList'
import { PlanEmojiField } from '../components/PlanEmojiField'
import { PLAN_DISPLAY } from '../lib/categories'

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

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [recurrence, setRecurrence] = useState<PlanRecurrence>('monthly')
  const [targetMonth, setTargetMonth] = useState(currentMonthValue())
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState<string>(PLAN_DISPLAY.icon)
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

    if (!name.trim()) {
      setFormError('Введите название')
      setSubmitting(false)
      return
    }

    try {
      const res = await api.createPlan({
        groupId,
        name: name.trim(),
        amount: parsedAmount,
        recurrence,
        targetMonth,
        description,
        icon,
      })
      setPlans((prev) => [...prev, res.plan])
      setSummary(res.summary)
      setName('')
      setAmount('')
      setTargetMonth(currentMonthValue())
      setDescription('')
      setIcon(PLAN_DISPLAY.icon)
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

  async function handleUpdated() {
    if (!groupId) return
    await loadData(groupId)
  }

  if (!groupId) {
    return null
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link to="/groups" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          ← К группам
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Планирование</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Каждый план — отдельная статья расходов. При добавлении траты выберите нужный план,
          чтобы сумма засчиталась именно в него.
        </p>
        <Link
          to={`/groups/${groupId}/planning/overview`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-violet-700 dark:text-violet-300"
        >
          Обзор по месяцам →
        </Link>
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

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
          className="mb-6 space-y-4 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
        >
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 dark:ring-violet-900 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Например: Аренда, Интернет, Подписки"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Сумма, ₽</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 dark:ring-violet-900 dark:bg-slate-800 dark:text-slate-100"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Месяц</label>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 dark:ring-violet-900 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Периодичность</label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setRecurrence('monthly')}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  recurrence === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Ежемесячно
              </button>
              <button
                type="button"
                onClick={() => setRecurrence('once')}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  recurrence === 'once'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Разово
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Описание</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-violet-500 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Необязательно"
            />
          </div>

          <PlanEmojiField value={icon} onChange={setIcon} />

          {formError ? <p className="text-sm text-rose-600 dark:text-rose-400">{formError}</p> : null}

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
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Обязательные расходы</h2>
        <PlanList
          plans={plans}
          groupId={groupId}
          loading={loading}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      </section>

      <BottomNav groupId={groupId} />
    </div>
  )
}
