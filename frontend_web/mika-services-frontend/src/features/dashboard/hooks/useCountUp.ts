import { useState, useEffect, useRef } from 'react'

/**
 * Animates a number from 0 to `end` over `duration` ms.
 * Returns the current animated value.
 */
export function useCountUp(end: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  const prevEnd = useRef(0)
  const rafId = useRef(0)

  useEffect(() => {
    const start = prevEnd.current
    prevEnd.current = end
    if (end === start) return

    const startTime = performance.now()
    const diff = end - start

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(start + diff * eased))
      if (progress < 1) rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [end, duration])

  return value
}
