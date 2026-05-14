import type { ReactNode } from 'react'
import { BentoCard } from './BentoCard'
import type { BentoCardProps } from './BentoCard'

/* ── Types ── */
export type KpiCardVariant = 'standard' | 'compact' | 'alert'

export interface KpiBadge {
  text: string
  variant: 'success' | 'warning' | 'danger' | 'info'
}

export interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: ReactNode
  accent?: string
  progress?: number
  badge?: KpiBadge
  onClick?: () => void
  href?: string
  loading?: boolean
  variant?: KpiCardVariant
  /** BentoCard grid overrides */
  colSpan?: BentoCardProps['colSpan']
  colSpanTablet?: BentoCardProps['colSpanTablet']
  colSpanMobile?: BentoCardProps['colSpanMobile']
}

/* ── Badge colors ── */
const BADGE_STYLES: Record<KpiBadge['variant'], string> = {
  success: 'bg-[var(--db-success-bg)] text-[var(--db-success-text)] border-[var(--db-success-border)]',
  warning: 'bg-[var(--db-warning-bg)] text-[var(--db-warning-text)] border-[var(--db-warning-border)]',
  danger: 'bg-[var(--db-danger-bg)] text-[var(--db-danger-text)] border-[var(--db-danger-border)]',
  info: 'bg-[var(--db-info-bg)] text-[var(--db-info-text)] border-[var(--db-info-border)]',
}

/* ── Main component ── */
export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent = 'var(--db-accent)',
  progress,
  badge,
  onClick,
  href,
  loading = false,
  variant = 'standard',
  colSpan = 4,
  colSpanTablet = 6,
  colSpanMobile = 12,
}: KpiCardProps) {
  const isCompact = variant === 'compact'
  const bentoVariant = variant === 'alert' ? 'alert' as const : 'default' as const

  return (
    <BentoCard
      onClick={onClick}
      href={href}
      loading={loading}
      variant={bentoVariant}
      colSpan={colSpan}
      colSpanTablet={colSpanTablet}
      colSpanMobile={colSpanMobile}
      className={[
        'relative overflow-hidden group',
        variant === 'standard' ? 'border-t-[3px]' : '',
      ].filter(Boolean).join(' ')}
      // Apply accent color to top border for standard variant
      {...(variant === 'standard' ? { style: { borderTopColor: accent } } : {})}
    >
      {/* Icon + Label row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest leading-tight">
          {label}
        </p>
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity duration-300 shrink-0"
            style={{ background: `color-mix(in srgb, ${accent} 8%, transparent)`, color: accent }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p
        className={[
          'db-display-num text-[var(--db-text-primary)] mt-1.5 mb-0.5 group-hover:translate-x-0.5 transition-transform duration-200',
          isCompact ? 'text-2xl' : 'text-3xl',
        ].join(' ')}
      >
        {value}
      </p>

      {/* Sub text + badge */}
      <div className="flex items-center gap-2 mb-3">
        {sub && (
          <p className="text-[10px] text-[var(--db-text-faint)] truncate">{sub}</p>
        )}
        {badge && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold border shrink-0 ${BADGE_STYLES[badge.variant]}`}>
            {badge.text}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="h-1.5 w-full rounded-full bg-[var(--db-border-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%`, background: accent }}
          />
        </div>
      )}

      {/* Decorative circle */}
      <div
        className="pointer-events-none absolute -right-8 -bottom-8 w-28 h-28 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-300"
        style={{ background: accent }}
      />
    </BentoCard>
  )
}
