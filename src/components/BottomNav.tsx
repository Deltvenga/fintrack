import { Link, useLocation } from 'react-router-dom'

interface BottomNavProps {
  groupId?: string
}

export function BottomNav({ groupId }: BottomNavProps) {
  const location = useLocation()

  if (!groupId) {
    return null
  }

  const tabs = [
    { to: `/groups/${groupId}`, label: 'Расходы', exact: true },
    { to: `/groups/${groupId}/add`, label: 'Добавить', exact: false },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const active = tab.exact
            ? location.pathname === tab.to
            : location.pathname.startsWith(tab.to)

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                active
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
