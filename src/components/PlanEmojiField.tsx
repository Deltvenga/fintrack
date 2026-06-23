import { CUSTOM_ICON_OPTIONS, PLAN_DISPLAY } from '../lib/categories'
import { normalizeEmojiIcon } from '../lib/emoji'

interface PlanEmojiFieldProps {
  value: string
  onChange: (icon: string) => void
}

export function PlanEmojiField({ value, onChange }: PlanEmojiFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Эмодзи</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {[PLAN_DISPLAY.icon, ...CUSTOM_ICON_OPTIONS].map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition ${
              value === icon
                ? 'bg-violet-100 dark:bg-violet-950/50 ring-2 ring-violet-500'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(normalizeEmojiIcon(e.target.value))}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 dark:ring-violet-900 dark:bg-slate-800 dark:text-slate-100"
        placeholder="Или введите свой эмодзи"
        maxLength={8}
      />
    </div>
  )
}
