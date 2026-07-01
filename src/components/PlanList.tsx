import { Link } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../lib/api'
import { PLAN_DISPLAY } from '../lib/categories'
import { formatTargetMonth } from '../lib/period'
import { getPlanDisplay } from '../lib/plans'
import type { PlannedExpense } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'
import { ConfirmDialog } from './ConfirmDialog'
import { PlanEditForm } from './PlanEditForm'

interface PlanListProps {
  plans: PlannedExpense[]
  groupId: string
  loading?: boolean
  onDeleted?: () => void
  onUpdated?: () => void
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PlanList({ plans, groupId, loading, onDeleted, onUpdated }: PlanListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PlannedExpense | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function confirmDelete() {
    if (!pendingDelete) return

    setDeleteError('')
    setDeletingId(pendingDelete.id)
    try {
      await api.deletePlan(pendingDelete.id)
      setPendingDelete(null)
      onDeleted?.()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
        Загрузка планов...
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
        Обязательных расходов пока нет. Добавьте первый план!
      </div>
    )
  }

  const pendingDisplay = pendingDelete ? getPlanDisplay(pendingDelete) : null

  return (
    <>
      <div className="space-y-3">
        {plans.map((plan) => {
          const isComplete = plan.percent >= 100
          const isEditing = editingId === plan.id
          const { title, subtitle } = getPlanDisplay(plan)

          return (
            <article
              key={plan.id}
              className="rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
            >
              <div className="flex items-start gap-3">
                <CategoryIcon category={title} isPlan planIcon={plan.icon} size="md" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
                      <span className="rounded-full bg-violet-100 dark:bg-violet-950/50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                        {formatTargetMonth(
                          plan.recurrence === 'monthly'
                            ? (plan.progressMonth ?? plan.targetMonth)
                            : plan.targetMonth,
                        )}
                      </span>
                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {plan.recurrence === 'monthly' ? 'Ежемесячно' : 'Разово'}
                      </span>
                        {isComplete ? (
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Выполнено
                          </span>
                        ) : null}
                      </div>
                      {subtitle ? (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-400">
                        План: {formatMoney(plan.amount)} · Потрачено: {formatMoney(plan.spent)} ·
                        Осталось: {formatMoney(plan.remaining)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <Link
                        to={`/groups/${groupId}/add?planId=${plan.id}`}
                        className="rounded-md bg-violet-100 dark:bg-violet-950/50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300"
                      >
                        + Расход
                      </Link>
                      <span className="text-slate-200">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(isEditing ? null : plan.id)
                        }}
                        disabled={deletingId === plan.id}
                        className="rounded-md px-1 py-0.5 text-[11px] font-medium text-slate-400 transition hover:text-violet-700 dark:text-violet-300 disabled:opacity-50"
                        aria-label={isEditing ? 'Свернуть редактирование' : 'Изменить план'}
                      >
                        {isEditing ? 'Свернуть' : 'Изм.'}
                      </button>
                      <span className="text-slate-200">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('')
                          setPendingDelete(plan)
                        }}
                        disabled={deletingId === plan.id}
                        className="rounded-md px-1 py-0.5 text-[11px] font-medium text-slate-400 transition hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-400 disabled:opacity-50"
                        aria-label="Удалить план"
                      >
                        Удал.
                      </button>
                    </div>
                  </div>

                  {!isEditing ? (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${plan.percent}%`,
                            backgroundColor: isComplete ? '#10b981' : PLAN_DISPLAY.color,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {plan.percent}% — засчитываются только расходы, привязанные к «{title}»
                      </p>
                    </div>
                  ) : (
                    <PlanEditForm
                      plan={plan}
                      onSaved={() => {
                        setEditingId(null)
                        onUpdated?.()
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Удалить план?"
        message="Обязательный расход будет удалён из планирования."
        detail={
          pendingDisplay
            ? `${pendingDisplay.title} · ${formatMoney(pendingDelete!.amount)} · ${
                pendingDelete!.recurrence === 'monthly' ? 'ежемесячно' : 'разово'
              }`
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
