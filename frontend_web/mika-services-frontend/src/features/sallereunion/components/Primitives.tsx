/** Primitives visuelles partagees — Avatar, Pill, reproduits du design source */

const PILL_TONES = {
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800/80 dark:text-neutral-300',
  live: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  closed: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
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
    <span className={'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums ' + PILL_TONES[tone]}>
      {dot && (
        <span className="relative inline-block w-1.5 h-1.5">
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

export function Avatar({ initials, color, name, size = 28, ring = false, halo = false }: AvatarProps) {
  return (
    <div
      className={'relative inline-flex items-center justify-center rounded-full font-medium text-white select-none shrink-0' + (ring ? ' ring-2 ring-white dark:ring-neutral-900' : '')}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.4,
        letterSpacing: '-0.02em',
        boxShadow: halo ? '0 0 0 3px rgba(72,181,160,0.25)' : undefined,
      }}
      title={name}
    >
      {initials}
    </div>
  )
}
