import { useState, useRef, useEffect, type ReactNode } from 'react'

export interface HoverCardProps {
  trigger: ReactNode
  children: ReactNode
  /** Position du popover par rapport au trigger */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Largeur max du popover */
  maxWidth?: number
  /** Délai avant ouverture (ms) */
  openDelay?: number
  /** Délai avant fermeture (ms) */
  closeDelay?: number
}

export function HoverCard({
  trigger,
  children,
  side = 'bottom',
  maxWidth = 280,
  openDelay = 200,
  closeDelay = 150,
}: HoverCardProps) {
  const [open, setOpen] = useState(false)
  const openTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = setTimeout(() => setOpen(true), openDelay)
  }

  const handleLeave = () => {
    if (openTimer.current) clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay)
  }

  useEffect(() => {
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current)
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  const positionCls =
    side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
    side === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
    side === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
    'left-full top-1/2 -translate-y-1/2 ml-2'

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {trigger}
      {open && (
        <div
          className={`absolute z-50 ${positionCls}`}
          style={{ maxWidth }}
        >
          <div
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl dark:shadow-black/40 p-3.5 text-sm text-gray-700 dark:text-gray-300"
            style={{ animation: 'db-rise 200ms ease-out both' }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
