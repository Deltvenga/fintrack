import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Group } from '../lib/types'
import { useAuth } from '../components/ProtectedRoute'
import { extractInviteCode } from '../lib/invite'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function GroupsPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadGroups() {
    setLoading(true)
    setError('')
    try {
      const { groups } = await api.getGroups()
      setGroups(groups)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить группы')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  async function handleLogout() {
    await api.logout()
    setUser(null)
    navigate('/login')
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { group } = await api.createGroup(groupName)
      setGroupName('')
      setShowCreate(false)
      await loadGroups()
      navigate(`/groups/${group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать группу')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const code = extractInviteCode(inviteCode)
      const { group } = await api.joinGroup(code)
      setInviteCode('')
      setShowJoin(false)
      await loadGroups()
      navigate(`/groups/${group.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось присоединиться')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Мои группы</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Привет, {user?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          className="mr-12 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Выйти
        </button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setShowCreate(true)
            setShowJoin(false)
          }}
          className="rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-semibold text-white"
        >
          Создать группу
        </button>
        <button
          onClick={() => {
            setShowJoin(true)
            setShowCreate(false)
          }}
          className="rounded-2xl bg-white dark:bg-slate-900 px-4 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700"
        >
          Войти по коду
        </button>
      </div>

      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="mb-6 space-y-3 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
        >
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Название группы"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-emerald-500 dark:bg-slate-800 dark:text-slate-100"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            Создать
          </button>
        </form>
      ) : null}

      {showJoin ? (
        <form
          onSubmit={handleJoin}
          className="mb-6 space-y-3 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800"
        >
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Код или ссылка приглашения"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-emerald-500 dark:bg-slate-800 dark:text-slate-100"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white disabled:opacity-60"
          >
            Присоединиться
          </button>
        </form>
      ) : null}

      {error ? <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      {loading ? (
        <p className="text-slate-500 dark:text-slate-400">Загрузка...</p>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
          Групп пока нет. Создайте новую или присоединитесь по коду.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="block rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 transition hover:ring-emerald-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{group.name}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {group.memberCount} участн. · код {group.inviteCode}
                  </p>
                </div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {formatMoney(group.expenseTotal)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
