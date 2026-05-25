import { useRef, useCallback, useEffect, useState } from 'react'

const MARGIN = 16
const SNAP_DURATION = 300

interface Size { width: number; height: number }

interface UseDraggableOptions {
  elementSize: Size
  initialPosition: { x: number; y: number } | null
  onPositionChange?: (pos: { x: number; y: number }) => void
  onDragStateChange?: (isDragging: boolean, transformOverride: string | null) => void
  disabled?: boolean
}

interface UseDraggableReturn {
  /** Ref to attach to the draggable element */
  ref: React.RefCallback<HTMLElement>
  /** Current x (left) position */
  x: number
  /** Current y (top) position */
  y: number
  /** Whether user is currently dragging */
  isDragging: boolean
  /** Whether snap animation is in progress */
  isSnapping: boolean
}

function defaultPosition(size: Size): { x: number; y: number } {
  return {
    x: window.innerWidth - size.width - MARGIN,
    y: window.innerHeight - size.height - MARGIN,
  }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(val, max))
}

function clampPosition(x: number, y: number, size: Size): { x: number; y: number } {
  return {
    x: clamp(x, MARGIN, window.innerWidth - size.width - MARGIN),
    y: clamp(y, MARGIN, window.innerHeight - size.height - MARGIN),
  }
}

function nearestCorner(x: number, y: number, size: Size): { x: number; y: number } {
  const cx = x + size.width / 2
  const cy = y + size.height / 2
  const midX = window.innerWidth / 2
  const midY = window.innerHeight / 2

  return {
    x: cx < midX ? MARGIN : window.innerWidth - size.width - MARGIN,
    y: cy < midY ? MARGIN : window.innerHeight - size.height - MARGIN,
  }
}

export function useDraggable({ elementSize, initialPosition, onPositionChange, onDragStateChange, disabled }: UseDraggableOptions): UseDraggableReturn {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (initialPosition) {
      return clampPosition(initialPosition.x, initialPosition.y, elementSize)
    }
    return defaultPosition(elementSize)
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)

  const elRef = useRef<HTMLElement | null>(null)
  const dragState = useRef<{
    startPointerX: number
    startPointerY: number
    startElX: number
    startElY: number
    rafId: number | null
    currentX: number
    currentY: number
    moved: boolean
  } | null>(null)

  // Apply position via transform (performant, no reflow)
  const applyTransform = useCallback((x: number, y: number, transition?: boolean) => {
    const el = elRef.current
    if (!el) return
    el.style.left = '0'
    el.style.top = '0'
    el.style.transform = `translate(${x}px, ${y}px)`
    if (transition) {
      el.style.transition = `transform ${SNAP_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1)`
    } else {
      el.style.transition = 'none'
    }
  }, [])

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (disabled) return
    // Only primary button
    if (e.button !== 0) return
    // Don't drag if clicking a button inside
    if ((e.target as HTMLElement).closest('button')) return

    const el = elRef.current
    if (!el) return

    el.setPointerCapture(e.pointerId)

    dragState.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startElX: pos.x,
      startElY: pos.y,
      rafId: null,
      currentX: pos.x,
      currentY: pos.y,
      moved: false,
    }
  }, [pos.x, pos.y])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const ds = dragState.current
    if (!ds) return

    const dx = e.clientX - ds.startPointerX
    const dy = e.clientY - ds.startPointerY

    // Dead zone — 4px before starting drag
    if (!ds.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return

    if (!ds.moved) {
      ds.moved = true
      setIsDragging(true)
      onDragStateChange?.(true, null)
    }

    const clamped = clampPosition(ds.startElX + dx, ds.startElY + dy, elementSize)
    ds.currentX = clamped.x
    ds.currentY = clamped.y

    if (ds.rafId === null) {
      ds.rafId = requestAnimationFrame(() => {
        applyTransform(ds.currentX, ds.currentY, false)
        onDragStateChange?.(true, `translate(${ds.currentX}px, ${ds.currentY}px)`)
        ds.rafId = null
      })
    }
  }, [elementSize, applyTransform, onDragStateChange])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const ds = dragState.current
    if (!ds) return

    const el = elRef.current
    if (el) el.releasePointerCapture(e.pointerId)

    if (ds.rafId !== null) {
      cancelAnimationFrame(ds.rafId)
    }

    if (!ds.moved) {
      // No actual drag happened — let click through
      dragState.current = null
      return
    }

    // Snap to nearest corner
    const snapTarget = nearestCorner(ds.currentX, ds.currentY, elementSize)

    setIsSnapping(true)
    applyTransform(snapTarget.x, snapTarget.y, true)

    setPos(snapTarget)
    onPositionChange?.(snapTarget)
    onDragStateChange?.(false, null)

    setTimeout(() => {
      setIsSnapping(false)
      // Remove transition after snap completes
      if (elRef.current) {
        elRef.current.style.transition = 'none'
      }
    }, SNAP_DURATION)

    setIsDragging(false)
    dragState.current = null
  }, [elementSize, applyTransform, onPositionChange, onDragStateChange])

  // Ref callback — attach/detach pointer listeners
  const refCallback = useCallback((node: HTMLElement | null) => {
    const prev = elRef.current
    if (prev) {
      prev.removeEventListener('pointerdown', handlePointerDown)
      prev.removeEventListener('pointermove', handlePointerMove)
      prev.removeEventListener('pointerup', handlePointerUp)
    }
    elRef.current = node
    if (node) {
      node.addEventListener('pointerdown', handlePointerDown)
      node.addEventListener('pointermove', handlePointerMove)
      node.addEventListener('pointerup', handlePointerUp)
      // Apply initial position
      applyTransform(pos.x, pos.y, false)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp, applyTransform, pos.x, pos.y])

  // Window resize — clamp position
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setPos(prev => {
          const clamped = clampPosition(prev.x, prev.y, elementSize)
          // If out of bounds, reset to default corner
          if (clamped.x !== prev.x || clamped.y !== prev.y) {
            const def = defaultPosition(elementSize)
            applyTransform(def.x, def.y, false)
            onPositionChange?.(def)
            return def
          }
          return prev
        })
      }, 200)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [elementSize, applyTransform, onPositionChange])

  return { ref: refCallback, x: pos.x, y: pos.y, isDragging, isSnapping }
}
