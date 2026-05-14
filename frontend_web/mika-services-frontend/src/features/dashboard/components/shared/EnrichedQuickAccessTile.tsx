import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

export type CountVariant = 'default' | 'warning' | 'danger'

export interface EnrichedQuickAccessTileProps {
  label: string
  icon: ReactNode
  href: string
  count?: number
  countVariant?: CountVariant
}

const COUNT_STYLES: Record<CountVariant, string> = {
  default: 'bg-[var(--db-accent)] text-white',
  warning: 'bg-[var(--db-warning-text)] text-white',
  danger: 'bg-[var(--db-danger-text)] text-white',
}

export function EnrichedQuickAccessTile({
  label,
  icon,
  href,
  count,
  countVariant = 'default',
}: EnrichedQuickAccessTileProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className={[
        'group relative flex flex-col items-center gap-1.5 px-1 py-3',
        'bg-[var(--db-bg-surface)] border border-[var(--db-border-default)] rounded-xl',
        'text-[var(--db-text-muted)]',
        'hover:bg-[var(--db-accent-muted)] hover:border-[var(--db-accent)]',
        'hover:text-[var(--db-accent)] hover:shadow-md',
        'transition-all duration-200',
        'min-h-[44px] min-w-[44px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--db-accent)] focus-visible:ring-offset-2',
      ].join(' ')}
    >
      {/* Badge counter */}
      {count !== undefined && count > 0 && (
        <span
          className={[
            'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full',
            'text-[9px] font-bold flex items-center justify-center px-1',
            COUNT_STYLES[countVariant],
          ].join(' ')}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}

      {/* Icon */}
      <span className="group-hover:scale-110 transition-transform duration-200">
        {icon}
      </span>

      {/* Label */}
      <span className="text-[9px] leading-tight text-center font-semibold">
        {label}
      </span>
    </button>
  )
}
