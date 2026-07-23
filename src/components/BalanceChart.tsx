import { useEffect, useMemo, useRef, useState } from 'react'
import type { DailyBalancePoint } from '../lib/period'

interface BalanceChartProps {
  points: DailyBalancePoint[]
  loading?: boolean
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export function BalanceChart({ points, loading }: BalanceChartProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const stats = useMemo(() => {
    if (points.length === 0) {
      return null
    }

    const balances = points.map((point) => point.balance)
    const min = Math.min(...balances)
    const max = Math.max(...balances)
    const padding = Math.max(Math.abs(min), Math.abs(max), 1) * 0.08

    return {
      min: min - padding,
      max: max + padding,
      start: points[0].balance,
      end: points[points.length - 1].balance,
      minPoint: points.find((point) => point.balance === min)!,
      maxPoint: points.find((point) => point.balance === max)!,
    }
  }, [points])

  const selectedPoint = useMemo(
    () => points.find((point) => point.date === selectedDate) ?? null,
    [points, selectedDate],
  )

  const needsHorizontalScroll = points.length > 18

  useEffect(() => {
    const container = scrollRef.current
    if (!container || points.length === 0) {
      return
    }

    container.scrollLeft = container.scrollWidth
  }, [points])

  if (loading) {
    return (
      <div className="balance-chart rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
        Загрузка графика...
      </div>
    )
  }

  if (points.length === 0 || !stats) {
    return (
      <div className="balance-chart rounded-2xl bg-white dark:bg-slate-900 p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
        Нет данных для графика в этом месяце
      </div>
    )
  }

  const range = stats.max - stats.min || 1
  const zeroPercent = ((stats.max - 0) / range) * 100
  const chartMinWidth = Math.max(points.length * 14, 280)

  return (
    <div className="balance-chart rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Баланс по дням</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Фактический баланс на конец каждого дня
          </p>
        </div>
        <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 sm:block sm:text-right">
          <p>
            Начало:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {formatMoney(stats.start)}
            </span>
          </p>
          <p>
            Конец:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {formatMoney(stats.end)}
            </span>
          </p>
        </div>
      </div>

      {selectedPoint ? (
        <div className="mb-3 rounded-xl bg-violet-50 px-3 py-2 dark:bg-violet-950/40 sm:hidden">
          <p className="text-xs text-violet-600 dark:text-violet-400">{formatShortDate(selectedPoint.date)}</p>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {formatMoney(selectedPoint.balance)}
            <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
              ({selectedPoint.change >= 0 ? '+' : ''}
              {formatMoney(selectedPoint.change)})
            </span>
          </p>
        </div>
      ) : null}

      {needsHorizontalScroll ? (
        <p className="mb-2 text-center text-[11px] text-slate-400 sm:hidden">← листайте график →</p>
      ) : null}

      <div
        ref={scrollRef}
        className="relative -mx-1 overflow-x-auto overscroll-x-contain pb-1 touch-pan-x [scrollbar-width:thin]"
      >
        <div
          className="relative mx-auto flex items-end gap-0.5 px-1 sm:gap-1"
          style={{ height: 'min(42vw, 220px)', minWidth: `${chartMinWidth}px` }}
          role="img"
          aria-label="График баланса за месяц"
        >
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-300 dark:border-slate-600"
            style={{ bottom: `${zeroPercent}%` }}
          />
          <div
            className="pointer-events-none absolute left-0 -translate-y-1/2 text-[10px] text-slate-400"
            style={{ bottom: `${zeroPercent}%` }}
          >
            0
          </div>

          {points.map((point) => {
            const heightPercent = ((point.balance - stats.min) / range) * 100
            const isSelected = selectedDate === point.date
            const isPositive = point.balance >= 0
            const showLabel =
              point.day === 1 ||
              point.day % 5 === 0 ||
              point.day === points[points.length - 1].day

            return (
              <button
                key={point.date}
                type="button"
                onClick={() => setSelectedDate(point.date)}
                aria-pressed={isSelected}
                aria-label={`${formatShortDate(point.date)}: ${formatMoney(point.balance)}`}
                className="group flex h-full min-w-[10px] flex-1 flex-col justify-end focus:outline-none sm:min-w-0"
                style={{ maxWidth: '22px' }}
              >
                <div className="flex min-h-[44px] flex-1 flex-col justify-end">
                  <div
                    className={`balance-chart-bar mx-auto w-full min-w-[8px] max-w-[16px] rounded-t-sm transition sm:max-w-[18px] sm:rounded-t-md ${
                      isPositive
                        ? 'bg-emerald-500 dark:bg-emerald-400'
                        : 'bg-rose-500 dark:bg-rose-400'
                    } ${
                      isSelected
                        ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-white dark:ring-offset-slate-900'
                        : 'opacity-85 group-hover:opacity-100 group-active:opacity-100'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 2)}%` }}
                  />
                </div>
                {showLabel ? (
                  <span className="mt-1.5 text-[9px] text-slate-400 sm:text-[10px]">{point.day}</span>
                ) : (
                  <span className="mt-1.5 h-[14px]" aria-hidden />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">Минимум</p>
          <p className="mt-1 text-sm font-semibold text-rose-600 dark:text-rose-400">
            {formatMoney(stats.minPoint.balance)}
          </p>
          <p className="text-xs text-slate-400">{formatShortDate(stats.minPoint.date)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">Максимум</p>
          <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {formatMoney(stats.maxPoint.balance)}
          </p>
          <p className="text-xs text-slate-400">{formatShortDate(stats.maxPoint.date)}</p>
        </div>
        <div className="hidden rounded-xl bg-violet-50 p-3 dark:bg-violet-950/40 sm:block">
          <p className="text-xs text-violet-600 dark:text-violet-400">
            {selectedPoint ? formatShortDate(selectedPoint.date) : 'Выберите день'}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {selectedPoint ? formatMoney(selectedPoint.balance) : '—'}
          </p>
          <p className="text-xs text-slate-400">
            {selectedPoint
              ? `${selectedPoint.change >= 0 ? '+' : ''}${formatMoney(selectedPoint.change)} за день`
              : 'Нажмите на столбик'}
          </p>
        </div>
      </div>
    </div>
  )
}
