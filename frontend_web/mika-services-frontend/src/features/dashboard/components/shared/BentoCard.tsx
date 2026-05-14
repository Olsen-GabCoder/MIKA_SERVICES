import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/* ── Types ── */
export type BentoCardVariant = 'default' | 'elevated' | 'alert'

export interface BentoCardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  onClick?: () => void
  href?: string
  colSpan?: 4 | 6 | 8 | 12
  colSpanTablet?: 6 | 12
  colSpanMobile?: 6 | 12
  freshness?: string | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  variant?: BentoCardVariant
  style?: React.CSSProperties
  className?: string
  children: ReactNode
}

/* ── Grid span helpers ── */
const COL_DESKTOP: Record<number, string> = {
  4: 'lg:col-span-4',
  6: 'lg:col-span-6',
  8: 'lg:col-span-8',
  12: 'lg:col-span-12',
}
const COL_TABLET: Record<number, string> = {
  6: 'md:col-span-6',
  12: 'md:col-span-12',
}
const COL_MOBILE: Record<number, string> = {
  6: 'col-span-6',
  12: 'col-span-12',
}

/* ── Variant styles ── */
const VARIANT_STYLES: Record<BentoCardVariant, string> = {
  default: 'bg-[var(--db-bg-surface)] border-[var(--db-border-subtle)] shadow-sm',
  elevated: 'bg-[var(--db-bg-surface-elevated)] border-[var(--db-border-default)] shadow-md',
  alert: 'bg-[var(--db-danger-bg)] border-[var(--db-danger-border)] shadow-sm',
}

/* ── Skeleton ── */
function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-2/3 rounded bg-[var(--db-border-default)]" />
      <div className="h-3 w-1/2 rounded bg-[var(--db-border-subtle)]" />
      <div className="h-20 rounded-lg bg-[var(--db-border-subtle)]" />
    </div>
  )
}

/* ── Error state ── */
function CardError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation('common')
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-[var(--db-danger-bg)] flex items-center justify-center">
        <svg className="w-5 h-5 text-[var(--db-danger-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-xs text-[var(--db-text-muted)]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-medium text-[var(--db-accent)] hover:underline min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {t('db.retry', 'Reessayer')}
        </button>
      )}
    </div>
  )
}

/* ── Main component ── */
export function BentoCard({
  title,
  subtitle,
  action,
  onClick,
  href,
  colSpan = 4,
  colSpanTablet = 6,
  colSpanMobile = 12,
  freshness,
  loading = false,
  error = null,
  onRetry,
  variant = 'default',
  style,
  className = '',
  children,
}: BentoCardProps) {
  const navigate = useNavigate()

  const isClickable = !!(onClick || href)
  const handleClick = () => {
    if (onClick) onClick()
    else if (href) navigate(href)
  }

  const gridClasses = [
    COL_MOBILE[colSpanMobile] ?? 'col-span-12',
    COL_TABLET[colSpanTablet] ?? '',
    COL_DESKTOP[colSpan] ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      style={style}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } } : undefined}
      className={[
        'rounded-2xl border p-5 transition-all duration-200',
        VARIANT_STYLES[variant],
        isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--db-accent)] focus-visible:ring-offset-2' : '',
        gridClasses,
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Header */}
      {(title || action) && (
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[11px] font-bold text-[var(--db-text-muted)] uppercase tracking-widest truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[10px] text-[var(--db-text-faint)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Content */}
      {loading ? <CardSkeleton /> : error ? <CardError message={error} onRetry={onRetry} /> : children}

      {/* Freshness timestamp */}
      {freshness && (
        <p className="text-[9px] text-[var(--db-text-faint)] mt-3 text-right">
          {freshness}
        </p>
      )}
    </div>
  )
}
