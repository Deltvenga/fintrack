import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Expense, GroupBalance } from '../lib/types'
import { BalanceCard } from '../components/BalanceCard'
import { BottomNav } from '../components/BottomNav'
import { ExpenseList } from '../components/ExpenseList'

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balance, setBalance] = useState<GroupBalance | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!groupId) return

    async function load(currentGroupId: string) {
      setLoading(true)
      setError('')

      try {
        const [expensesRes, balanceRes, groupsRes] = await Promise.all([
          api.getExpenses(currentGroupId),
          api.getBalance(currentGroupId),
          api.getGroups(),
        ])

        setExpenses(expensesRes.expenses)
        setBalance(balanceRes.balance)

        const group = groupsRes.groups.find((g) => g.id === currentGroupId)
        if (group) {
          setInviteCode(group.inviteCode)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
      } finally {
        setLoading(false)
      }
    }

    load(groupId)
  }, [groupId])

  if (!groupId) {
    return null
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6">
      <header className="mb-6">
        <Link to="/groups" className="text-sm font-medium text-emerald-700">
          ← К группам
        </Link>
        {inviteCode ? (
          <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            Код приглашения: <span className="font-bold tracking-widest">{inviteCode}</span>
          </p>
        ) : null}
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <section className="mb-6">
        <BalanceCard balance={balance} loading={loading} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Расходы</h2>
        <ExpenseList expenses={expenses} loading={loading} />
      </section>

      <BottomNav groupId={groupId} />
    </div>
  )
}
