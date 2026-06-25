import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../components/ProtectedRoute'
import { normalizeInviteCode, PENDING_INVITE_KEY } from '../lib/invite'

export function JoinPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [error, setError] = useState('')
  const [groupName, setGroupName] = useState('')
  const attempted = useRef(false)

  const code = inviteCode ? normalizeInviteCode(inviteCode) : ''

  useEffect(() => {
    if (loading || attempted.current) return

    if (!code) {
      setError('Некорректная ссылка приглашения')
      return
    }

    if (!user) {
      sessionStorage.setItem(PENDING_INVITE_KEY, code)
      navigate('/login', { replace: true })
      return
    }

    attempted.current = true
    api
      .joinGroup(code)
      .then(({ group }) => {
        sessionStorage.removeItem(PENDING_INVITE_KEY)
        setGroupName(group.name)
        navigate(`/groups/${group.id}`, { replace: true })
      })
      .catch((err) => {
        sessionStorage.removeItem(PENDING_INVITE_KEY)
        setError(err instanceof Error ? err.message : 'Не удалось присоединиться к группе')
      })
  }, [loading, user, code, navigate])

  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <div className="mx-auto w-full max-w-md text-center">
        {error ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Не получилось присоединиться
            </h1>
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
            <Link
              to="/groups"
              className="mt-6 inline-block rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white"
            >
              К моим группам
            </Link>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">
            {groupName ? `Присоединяемся к «${groupName}»...` : 'Присоединяемся к группе...'}
          </p>
        )}
      </div>
    </div>
  )
}
