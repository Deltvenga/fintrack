import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import {
  CUSTOM_ICON_OPTIONS,
  mergeCategories,
  type Category,
} from '../lib/categories'
import { normalizeEmojiIcon } from '../lib/emoji'
import type { CustomCategory, TransactionType } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'
import { ConfirmDialog } from './ConfirmDialog'

interface CategoryPickerProps {
  groupId: string
  type: TransactionType
  value: string
  onChange: (categoryId: string) => void
}

export function CategoryPicker({ groupId, type, value, onChange }: CategoryPickerProps) {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState<string>(CUSTOM_ICON_OPTIONS[0])
  const [customIconInput, setCustomIconInput] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getCategories(groupId)
      setCustomCategories(res.categories)
    } catch {
      setCustomCategories([])
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const categories: Category[] = mergeCategories(type, customCategories)

  async function handleCreate() {
    setFormError('')

    const trimmedName = newName.trim()
    if (!trimmedName) {
      setFormError('Введите название')
      return
    }

    setSubmitting(true)
    const icon = customIconInput.trim()
      ? normalizeEmojiIcon(customIconInput)
      : newIcon

    try {
      const res = await api.createCategory({
        groupId,
        name: trimmedName,
        type,
        icon,
      })
      if (res.category) {
        setCustomCategories((prev) => [...prev, res.category!])
        onChange(res.category.name)
        setNewName('')
        setNewIcon(CUSTOM_ICON_OPTIONS[0])
        setCustomIconInput('')
        setShowForm(false)
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось создать категорию')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    setDeleteError('')
    setDeleting(true)
    try {
      await api.deleteCategory(pendingDelete.id)
      setCustomCategories((prev) => prev.filter((c) => c.id !== pendingDelete.id))
      if (value === pendingDelete.name) {
        const remaining = mergeCategories(
          type,
          customCategories.filter((c) => c.id !== pendingDelete.id),
        )
        onChange(remaining[0]?.id ?? '')
      }
      setPendingDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Категория</label>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Загрузка категорий...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {categories.map((item) => (
            <div key={item.customId ?? item.id} className="relative">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${
                  value === item.id
                    ? type === 'income'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-100 dark:ring-sky-900'
                      : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-100 dark:ring-emerald-900'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 dark:border-slate-600'
                }`}
              >
                <CategoryIcon
                  category={item.id}
                  type={type}
                  customCategories={customCategories}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">
                  {item.id}
                </span>
              </button>
              {item.custom && item.customId ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError('')
                    setPendingDelete({ id: item.customId!, name: item.id })
                  }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-xs text-slate-400 shadow ring-1 ring-slate-200 dark:ring-slate-700 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-400"
                  aria-label={`Удалить категорию ${item.id}`}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 px-3 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            + Своя
          </button>
        </div>
      )}

      {showForm ? (
        <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 dark:bg-slate-800 dark:text-slate-100">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Название</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleCreate()
                }
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Например: Питомцы"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    setNewIcon(icon)
                    setCustomIconInput('')
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                    newIcon === icon && !customIconInput.trim()
                      ? 'bg-white dark:bg-slate-900 ring-2 ring-emerald-500'
                      : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:bg-slate-900'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 text-xl ring-1 ring-slate-200 dark:ring-slate-700">
                {customIconInput.trim()
                  ? normalizeEmojiIcon(customIconInput)
                  : newIcon}
              </span>
              <input
                type="text"
                value={customIconInput}
                onChange={(e) => setCustomIconInput(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Или введите свой эмодзи"
                maxLength={8}
              />
            </div>
          </div>

          {formError ? <p className="text-xs text-rose-600 dark:text-rose-400">{formError}</p> : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={submitting}
              className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? '...' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-slate-400"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Удалить категорию?"
        message="Своя категория будет удалена. Уже добавленные операции останутся."
        detail={pendingDelete ? `«${pendingDelete.name}»` : undefined}
        loading={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (deleting) return
          setPendingDelete(null)
          setDeleteError('')
        }}
      />
    </div>
  )
}
