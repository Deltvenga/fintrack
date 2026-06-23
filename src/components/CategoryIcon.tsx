import { getCategoryInfo } from '../lib/categories'
import type { TransactionType } from '../lib/types'

interface CategoryIconProps {
  category: string
  type?: TransactionType
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-8 w-8 text-base',
  md: 'h-10 w-10 text-lg',
  lg: 'h-12 w-12 text-xl',
}

export function CategoryIcon({ category, type = 'expense', size = 'md' }: CategoryIconProps) {
  const info = getCategoryInfo(category, type)

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${sizeClasses[size]}`}
      style={{ backgroundColor: `${info.color}20` }}
      aria-hidden
    >
      {info.icon}
    </span>
  )
}
