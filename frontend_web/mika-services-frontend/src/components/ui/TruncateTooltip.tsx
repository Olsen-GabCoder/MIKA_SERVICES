import { useRef, useState, useEffect, useCallback, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

export interface TruncateTooltipProps {
  text: string
  className?: string
  style?: CSSProperties
  side?: 'top' | 'bottom'
  maxWidth?: number
}

export function TruncateTooltip({
  text,
  className = '',
  style,
  side = 'top',
  maxWidth = 340,
}: TruncateTooltipProps) {
  const textRef = useRef<HTMLSpanElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    const check = () => setIsTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text])

  const handleEnter = useCallback(() => {
    if (!isTruncated) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const el = textRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPos({
        left: rect.left,
        top: side === 'top' ? rect.top - 8 : rect.bottom + 8,
      })
      setOpen(true)
    }, 400)
  }, [isTruncated, side])

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpen(false)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <>
      <span
        ref={textRef}
        className={className}
        style={style}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {text}
      </span>
      {open && pos && createPortal(
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: pos.left,
            top: pos.top,
            transform: side === 'top' ? 'translateY(-100%)' : 'translateY(0)',
            maxWidth,
          }}
        >
          <div
            className="bg-white dark:bg-zinc-800 border border-gray-200/60 dark:border-zinc-600 rounded-xl shadow-2xl dark:shadow-black/50 px-4 py-2.5 text-[12.5px] font-semibold leading-relaxed break-words whitespace-normal"
            style={{
              color: 'var(--db-text-primary)',
              animation: 'db-rise 120ms ease-out both',
            }}
          >
            {text}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
