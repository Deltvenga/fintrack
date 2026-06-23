import type { GroupBalance } from '../lib/types'

interface BalanceCardProps {
  balance: GroupBalance | null
  loading?: boolean
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function BalanceCard({ balance, loading }: BalanceCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <p className="text-slate-500">Загрузка баланса...</p>
      </div>
    )
  }

  if (!balance) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-emerald-600 p-5 text-white shadow-sm">
        <p className="text-sm text-emerald-100">Всего расходов</p>
        <p className="mt-1 text-3xl font-bold">{formatMoney(balance.totalExpenses)}</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h3 className="font-semibold text-slate-900">Баланс участников</h3>
        <ul className="mt-3 space-y-2">
          {balance.members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{member.username}</span>
              <span
                className={
                  member.net > 0
                    ? 'font-medium text-emerald-600'
                    : member.net < 0
                      ? 'font-medium text-rose-600'
                      : 'text-slate-400'
                }
              >
                {member.net > 0 ? '+' : ''}
                {formatMoney(member.net)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {balance.settlements.length > 0 ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h3 className="font-semibold text-slate-900">Кто кому должен</h3>
          <ul className="mt-3 space-y-3">
            {balance.settlements.map((item, index) => (
              <li key={index} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-medium">{item.fromUsername}</span>
                {' → '}
                <span className="font-medium">{item.toUsername}</span>
                <span className="mt-1 block font-semibold text-slate-900">
                  {formatMoney(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
