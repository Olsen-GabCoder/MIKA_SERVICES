import type { ReactNode } from 'react'

export type AlertChipVariant = 'danger' | 'warning' | 'info'

export interface AlertChipProps {
  text: string
  variant: AlertChipVariant
  onClick?: () => void
  icon?: ReactNode
}

const VARIANT_STYLES: Record<AlertChipVariant, { bg: string; border: string; text: string; dot: string }> = {
  danger: {
    bg: 'bg-[var(--db-danger-bg)]',
    border: 'border-[var(--db-danger-border)]',
    text: 'text-[var(--db-danger-text)]',
    dot: 'bg-[var(--db-danger-text)]',
  },
  warning: {
    bg: 'bg-[var(--db-warning-bg)]',
    border: 'border-[var(--db-warning-border)]',
    text: 'text-[var(--db-warning-text)]',
    dot: 'bg-[var(--db-warning-text)]',
  },
  info: {
    bg: 'bg-[var(--db-info-bg)]',
    border: 'border-[var(--db-info-border)]',
    text: 'text-[var(--db-info-text)]',
    dot: 'bg-[var(--db-info-text)]',
  },
}

export function AlertChip({ text, variant, onClick, icon }: AlertChipProps) {
  const s = VARIANT_STYLES[variant]
  const isClickable = !!onClick

  const Tag = isClickable ? 'button' : 'span'

  return (
    <Tag
      type={isClickable ? 'button' : undefined}
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border shadow-sm transition-all duration-150',
        s.bg, s.border, s.text,
        isClickable ? 'cursor-pointer hover:shadow-md active:scale-[0.97] min-h-[44px]' : '',
      ].filter(Boolean).join(' ')}
    >
      {icon ?? <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />}
      {text}
    </Tag>
  )
}
