import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Category,
} from '../lib/categories'
import type { TransactionType } from '../lib/types'
import { BottomNav } from '../components/BottomNav'
import { CategoryIcon } from '../components/CategoryIcon'

export function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialType: TransactionType = searchParams.get('type') === 'income' ? 'income' : 'expense'

  const [transactionType, setTransactionType] = useState<TransactionType>(initialType)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(
    initialType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id,
  )
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!groupId) {
    return null
  }

  const categories: Category[] =
    transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const isIncome = transactionType === 'income'

  function switchType(nextType: TransactionType) {
    setTransactionType(nextType)
    setCategory(nextType === 'income' ? INCOME_CATEGORIES[0].id : EXPENSE_CATEGORIES[0].id)
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

    try {
      await api.createExpense({
        groupId: groupId!,
        type: transactionType,
        amount: parsedAmount,
        category,
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
        <Link to={`/groups/${groupId}`} className="text-sm font-medium text-emerald-700">
          ← Назад
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          {isIncome ? 'Новый доход' : 'Новый расход'}
        </h1>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => switchType('expense')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            !isIncome ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Расход
        </button>
        <button
          type="button"
          onClick={() => switchType('income')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            isIncome ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Доход
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
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
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Категория</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${
                  category === item.id
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <CategoryIcon category={item.id} type={transactionType} size="sm" />
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
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            placeholder="Необязательно"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Дата</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
            required
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:opacity-60 ${
            isIncome
              ? 'bg-sky-600 hover:bg-sky-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {loading
            ? 'Сохранение...'
            : isIncome
              ? 'Добавить доход'
              : 'Добавить расход'}
        </button>
      </form>

      <BottomNav groupId={groupId} />
    </div>
  )
}
