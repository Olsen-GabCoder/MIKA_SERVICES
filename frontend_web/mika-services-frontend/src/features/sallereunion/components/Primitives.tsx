/** Primitives visuelles premium — Avatar, Pill */

const PILL_TONES = {
  neutral: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  live: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  closed: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  mika: 'bg-[#FF6B35]/10 text-[#FF6B35]',
} as const

const DOT_COLORS = {
  live: 'bg-emerald-500',
  closed: 'bg-rose-500',
  warning: 'bg-amber-500',
  mika: 'bg-[#FF6B35]',
  neutral: 'bg-neutral-400',
} as const

type PillTone = keyof typeof PILL_TONES

interface PillProps {
  tone?: PillTone
  dot?: boolean
  pulse?: boolean
  children: React.ReactNode
}

export function Pill({ tone = 'neutral', dot = false, pulse = false, children }: PillProps) {
  return (
    <span className={'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[13px] font-semibold tracking-wide tabular-nums ' + PILL_TONES[tone]}>
      {dot && (
        <span className="relative inline-block w-2 h-2">
          <span className={'absolute inset-0 rounded-full ' + (DOT_COLORS[tone] || DOT_COLORS.neutral)} />
          {pulse && <span className={'absolute inset-0 rounded-full salle-live-dot ' + (tone === 'live' ? 'text-emerald-500' : 'text-rose-500')} />}
        </span>
      )}
      {children}
    </span>
  )
}

interface AvatarProps {
  initials: string
  color: string
  name?: string
  size?: number
  ring?: boolean
  halo?: boolean
}

export function Avatar({ initials, color, name, size = 32, ring = false, halo = false }: AvatarProps) {
  return (
    <div
      className={'relative inline-flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0' + (ring ? ' ring-2 ring-white dark:ring-neutral-900' : '')}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.38,
        letterSpacing: '-0.02em',
        boxShadow: halo
          ? '0 0 0 3px rgba(72,181,160,0.3), 0 2px 8px rgba(0,0,0,0.1)'
          : '0 1px 3px rgba(0,0,0,0.12)',
      }}
      title={name}
    >
      {initials}
    </div>
  )
}
