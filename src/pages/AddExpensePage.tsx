import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { BottomNav } from '../components/BottomNav'

const CATEGORIES = ['Еда', 'Транспорт', 'Жильё', 'Развлечения', 'Покупки', 'Другое']

export function AddExpensePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!groupId) {
    return null
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
        amount: parsedAmount,
        category,
        description,
        date,
      })
      navigate(`/groups/${groupId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить расход')
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
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Новый расход</h1>
      </header>

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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? 'Сохранение...' : 'Добавить расход'}
        </button>
      </form>

      <BottomNav groupId={groupId} />
    </div>
  )
}
