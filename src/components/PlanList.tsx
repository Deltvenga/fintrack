import { useState } from 'react'
import { api } from '../lib/api'
import { getCategoryInfo } from '../lib/categories'
import type { PlannedExpense } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'

interface PlanListProps {
  plans: PlannedExpense[]
  loading?: boolean
  onDeleted?: () => void
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PlanList({ plans, loading, onDeleted }: PlanListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(plan: PlannedExpense) {
    const period = plan.recurrence === 'monthly' ? 'ежемесячный' : 'разовый'
    if (
      !window.confirm(
        `Удалить ${period} план «${plan.category}» на ${formatMoney(plan.amount)}?`,
      )
    ) {
      return
    }

    setDeletingId(plan.id)
    try {
      await api.deletePlan(plan.id)
      onDeleted?.()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Не удалось удалить')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
        Загрузка планов...
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm">
        Обязательных расходов пока нет. Добавьте первый план!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const info = getCategoryInfo(plan.category, 'expense')
        const isComplete = plan.percent >= 100

        return (
          <article
            key={plan.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
          >
            <div className="flex items-start gap-3">
              <CategoryIcon category={plan.category} type="expense" />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{plan.category}</p>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                        {plan.recurrence === 'monthly' ? 'Ежемесячно' : 'Разово'}
                      </span>
                      {isComplete ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Выполнено
                        </span>
                      ) : null}
                    </div>
                    {plan.description ? (
                      <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-400">
                      План: {formatMoney(plan.amount)} · Потрачено: {formatMoney(plan.spent)} ·
                      Осталось: {formatMoney(plan.remaining)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(plan)}
                    disabled={deletingId === plan.id}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    {deletingId === plan.id ? '...' : 'Удалить'}
                  </button>
                </div>

                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${plan.percent}%`,
                        backgroundColor: isComplete ? '#10b981' : info.color,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {plan.percent}% — расходы в категории «{plan.category}» засчитываются в план
                  </p>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
