import { useEffect, useRef, useState } from 'react'

/**
 * Hook qui anime un nombre de 0 à `target` avec easing.
 * Retourne la valeur courante de l'animation.
 */
export function useCountUp(target: number, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    if (target === 0) { setValue(0); return }

    const timeout = setTimeout(() => {
      startTime.current = null

      const animate = (now: number) => {
        if (startTime.current === null) startTime.current = now
        const elapsed = now - startTime.current
        const progress = Math.min(elapsed / duration, 1)
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        setValue(Math.round(eased * target))

        if (progress < 1) {
          rafId.current = requestAnimationFrame(animate)
        }
      }

      rafId.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(rafId.current)
    }
  }, [target, duration, delay])

  return value
}
