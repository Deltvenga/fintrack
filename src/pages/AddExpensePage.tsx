import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../lib/categories'
import type { PlannedExpense, TransactionType } from '../lib/types'
import { getPlanDisplay } from '../lib/plans'
import { BottomNav } from '../components/BottomNav'
import { CategoryIcon } from '../components/CategoryIcon'
import { CategoryPicker } from '../components/CategoryPicker'

type ExpenseKind = 'regular' | 'planned'

const DATE_QUICK_OPTIONS = [
  { label: 'Позавчера', offset: -2 },
  { label: 'Вчера', offset: -1 },
  { label: 'Завтра', offset: 1 },
  { label: 'Послезавтра', offset: 2 },
] as const

function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromOffset(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toLocalDateString(date)
}

export function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialPlanId = searchParams.get('planId')
  const initialType: TransactionType = searchParams.get('type') === 'income' ? 'income' : 'expense'

  const [transactionType, setTransactionType] = useState<TransactionType>(initialType)
  const [expenseKind, setExpenseKind] = useState<ExpenseKind>(
    initialPlanId ? 'planned' : 'regular',
  )
  const [plans, setPlans] = useState<PlannedExpense[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlanId)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(
    initialType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id,
  )
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => toLocalDateString(new Date()))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [plansLoading, setPlansLoading] = useState(false)

  useEffect(() => {
    if (!groupId || transactionType === 'income') return

    setPlansLoading(true)
    api
      .getPlans(groupId)
      .then((res) => {
        setPlans(res.plans)
        if (initialPlanId && res.plans.some((p) => p.id === initialPlanId)) {
          setSelectedPlanId(initialPlanId)
          setExpenseKind('planned')
        }
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false))
  }, [groupId, transactionType, initialPlanId])

  if (!groupId) {
    return null
  }

  const isIncome = transactionType === 'income'
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)
  const selectedPlanDisplay = selectedPlan ? getPlanDisplay(selectedPlan) : null
  const dateQuickActiveClass = isIncome
    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-100 dark:border-sky-400 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900/60'
    : expenseKind === 'planned'
      ? 'border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-100 dark:border-violet-400 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900/60'
      : 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100 dark:border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/60'

  function switchType(nextType: TransactionType) {
    setTransactionType(nextType)
    setCategory(nextType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id)
    if (nextType === 'income') {
      setExpenseKind('regular')
      setSelectedPlanId(null)
    }
    setError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const parsedAmount = Number(amount.replace(',', '.'))
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Введите корректную сумму')
      setLoading(false)
      return
    }

    if (!isIncome && expenseKind === 'planned' && !selectedPlanId) {
      setError('Выберите планируемый расход')
      setLoading(false)
      return
    }

    try {
      await api.createExpense({
        groupId: groupId!,
        type: transactionType,
        amount: parsedAmount,
        ...(expenseKind === 'planned' && selectedPlanId
          ? { planId: selectedPlanId }
          : { category }),
        description,
        date,
      })
      navigate(`/groups/${groupId}`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Не удалось добавить ${isIncome ? 'доход' : 'расход'}`,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link to={`/groups/${groupId}`} className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          ← Назад
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isIncome ? 'Новый доход' : 'Новый расход'}
        </h1>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
        <button
          type="button"
          onClick={() => switchType('expense')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            !isIncome ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Расход
        </button>
        <button
          type="button"
          onClick={() => switchType('income')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isIncome ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Доход
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Сумма, ₽</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 dark:ring-emerald-900 dark:bg-slate-800 dark:text-slate-100"
            placeholder="0"
            required
          />
        </div>

        {!isIncome ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Тип расхода</label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setExpenseKind('regular')
                    setSelectedPlanId(null)
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    expenseKind === 'regular'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Обычный
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseKind('planned')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    expenseKind === 'planned'
                      ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  По плану
                </button>
              </div>
            </div>

            {expenseKind === 'planned' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Планируемый расход
                </label>
                {plansLoading ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Загрузка планов...</p>
                ) : plans.length === 0 ? (
                  <div className="rounded-xl bg-violet-50 dark:bg-violet-950/40 px-4 py-3 text-sm text-violet-700 dark:text-violet-300">
                    Планов пока нет.{' '}
                    <Link to={`/groups/${groupId}/planning`} className="font-semibold underline">
                      Создайте в разделе «План»
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plans.map((plan) => {
                      const { title, subtitle } = getPlanDisplay(plan)

                      return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          selectedPlanId === plan.id
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 ring-2 ring-violet-100 dark:ring-violet-900'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 dark:border-slate-600'
                        }`}
                      >
                        <CategoryIcon category={title} isPlan size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
                          {subtitle ? (
                            <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
                          ) : null}
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {plan.recurrence === 'monthly' ? 'Ежемесячно' : 'Разово'} · осталось{' '}
                            {new Intl.NumberFormat('ru-RU', {
                              style: 'currency',
                              currency: 'RUB',
                              maximumFractionDigits: 0,
                            }).format(plan.remaining)}
                          </p>
                        </div>
                      </button>
                      )
                    })}
                  </div>
                )}
                {selectedPlanDisplay ? (
                  <p className="mt-2 text-xs text-violet-600 dark:text-violet-400">
                    Расход будет привязан к плану «{selectedPlanDisplay.title}»
                    {selectedPlanDisplay.subtitle
                      ? ` (${selectedPlanDisplay.subtitle})`
                      : ''}
                  </p>
                ) : null}
              </div>
            ) : (
              <CategoryPicker
                groupId={groupId}
                type="expense"
                value={category}
                onChange={setCategory}
              />
            )}
          </>
        ) : (
          <CategoryPicker
            groupId={groupId}
            type="income"
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
            required
          />
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {DATE_QUICK_OPTIONS.map(({ label, offset }) => {
              const quickDate = dateFromOffset(offset)
              const isActive = date === quickDate

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setDate(quickDate)}
                  className={`rounded-xl border px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                    isActive
                      ? dateQuickActiveClass
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:opacity-60 ${
            isIncome
              ? 'bg-sky-600 hover:bg-sky-700'
              : expenseKind === 'planned'
                ? 'bg-violet-600 hover:bg-violet-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {loading
            ? 'Сохранение...'
            : isIncome
              ? 'Добавить доход'
              : expenseKind === 'planned'
                ? `Добавить в план${selectedPlanDisplay ? `: ${selectedPlanDisplay.title}` : ''}`
                : 'Добавить расход'}
        </button>
      </form>

      {!isIncome && expenseKind === 'regular' ? (
        <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          Для обязательного расхода выберите тип «По плану» или{' '}
          <Link to={`/groups/${groupId}/planning`} className="text-violet-600 dark:text-violet-400 underline">
            создайте план
          </Link>
        </p>
      ) : null}

      <BottomNav groupId={groupId} />
    </div>
  )
}
