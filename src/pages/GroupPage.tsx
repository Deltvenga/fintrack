import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { CustomCategory, Expense, GroupBalance } from '../lib/types'
import { BalanceCard } from '../components/BalanceCard'
import { BottomNav } from '../components/BottomNav'
import { ExpenseList } from '../components/ExpenseList'
import { buildInviteLink } from '../lib/invite'

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [balance, setBalance] = useState<GroupBalance | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [groupName, setGroupName] = useState('')
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])

  const loadData = useCallback(async (currentGroupId: string) => {
    setLoading(true)
    setError('')

    try {
      const [expensesRes, balanceRes, groupsRes, categoriesRes] = await Promise.all([
        api.getExpenses(currentGroupId),
        api.getBalance(currentGroupId),
        api.getGroups(),
        api.getCategories(currentGroupId),
      ])

      setExpenses(expensesRes.expenses)
      setBalance(balanceRes.balance)
      setCustomCategories(categoriesRes.categories)

      const group = groupsRes.groups.find((g) => g.id === currentGroupId)
      if (group) {
        setInviteCode(group.inviteCode)
        setGroupName(group.name)
      }
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

  async function copyToClipboard(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const el = document.createElement('textarea')
        el.value = text
        el.style.position = 'fixed'
        el.style.opacity = '0'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      return true
    } catch {
      return false
    }
  }

  async function handleCopyCode() {
    if (await copyToClipboard(inviteCode)) {
      setCopied('code')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  async function handleShareLink() {
    const link = buildInviteLink(inviteCode)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Приглашение в Fintrack',
          text: `Присоединяйтесь к группе «${groupName}» в Fintrack`,
          url: link,
        })
        return
      } catch {
        // пользователь отменил шаринг — пробуем копирование ниже
      }
    }
    if (await copyToClipboard(link)) {
      setCopied('link')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  async function handleDeleted(expenseId: string) {
    if (!groupId) return
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
    try {
      const balanceRes = await api.getBalance(groupId)
      setBalance(balanceRes.balance)
    } catch {
      await loadData(groupId)
    }
  }

  async function handleUpdated(updated: Expense) {
    if (!groupId) return
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    try {
      const balanceRes = await api.getBalance(groupId)
      setBalance(balanceRes.balance)
    } catch {
      await loadData(groupId)
    }
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
        {inviteCode ? (
          <div className="mt-3 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Код приглашения: <span className="font-bold tracking-widest">{inviteCode}</span>
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex-1 rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700"
              >
                {copied === 'code' ? 'Код скопирован' : 'Скопировать код'}
              </button>
              <button
                onClick={handleShareLink}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
              >
                {copied === 'link' ? 'Ссылка скопирована' : 'Поделиться ссылкой'}
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {error ? <p className="mb-4 text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}

      <section className="mb-6">
        <BalanceCard balance={balance} loading={loading} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Операции</h2>
          <div className="flex gap-2">
            <Link
              to={`/groups/${groupId}/add?type=income`}
              className="rounded-lg bg-sky-100 dark:bg-sky-950/50 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300"
            >
              + Доход
            </Link>
            <Link
              to={`/groups/${groupId}/add`}
              className="rounded-lg bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
            >
              + Расход
            </Link>
          </div>
        </div>
        <ExpenseList
          expenses={expenses}
          customCategories={customCategories}
          loading={loading}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      </section>

      <BottomNav groupId={groupId} />
    </div>
  )
}
