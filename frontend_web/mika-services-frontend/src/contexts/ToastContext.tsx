import { createContext, useCallback, useContext, useRef, useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* ═══════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════ */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  message: string
  variant?: ToastVariant
  /** Durée en ms avant auto-dismiss (défaut: 4000). 0 = pas d'auto-dismiss. */
  duration?: number
}

interface ToastItem extends Required<Omit<ToastOptions, 'duration'>> {
  id: number
  duration: number
  /** Phase d'animation : 'enter' → 'idle' → 'exit' */
  phase: 'enter' | 'idle' | 'exit'
}

type ToastFn = (options: ToastOptions | string) => void

const ToastContext = createContext<ToastFn | null>(null)

let _nextId = 0

/* ═══════════════════════════════════════════════════════════════════════
   Icônes SVG inline (pas de dépendance)
   ═══════════════════════════════════════════════════════════════════════ */

const icons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
}

const variantStyles: Record<ToastVariant, { bar: string; icon: string; bg: string; text: string }> = {
  success: {
    bar: 'bg-emerald-500',
    icon: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-800/50',
    text: 'text-gray-900 dark:text-gray-100',
  },
  error: {
    bar: 'bg-red-500',
    icon: 'text-red-500 dark:text-red-400',
    bg: 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-800/50',
    text: 'text-gray-900 dark:text-gray-100',
  },
  warning: {
    bar: 'bg-amber-500',
    icon: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-800/50',
    text: 'text-gray-900 dark:text-gray-100',
  },
  info: {
    bar: 'bg-blue-500',
    icon: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800/50',
    text: 'text-gray-900 dark:text-gray-100',
  },
}

/* ═══════════════════════════════════════════════════════════════════════
   Toast Item Component
   ═══════════════════════════════════════════════════════════════════════ */

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const s = variantStyles[toast.variant]
  const progressRef = useRef<HTMLDivElement>(null)

  // Animate progress bar
  useEffect(() => {
    if (toast.duration <= 0 || !progressRef.current) return
    const el = progressRef.current
    // Force reflow then animate
    el.style.transform = 'scaleX(1)'
    requestAnimationFrame(() => {
      el.style.transition = `transform ${toast.duration}ms linear`
      el.style.transform = 'scaleX(0)'
    })
  }, [toast.duration])

  const animClass =
    toast.phase === 'enter' ? 'animate-toast-in' :
    toast.phase === 'exit' ? 'animate-toast-out' : ''

  return (
    <div
      className={`relative w-[380px] max-w-[calc(100vw-2rem)] rounded-xl border shadow-lg shadow-black/8 dark:shadow-black/30 overflow-hidden ${s.bg} ${animClass}`}
      role="status"
      aria-live="polite"
    >
      {/* Progress bar */}
      {toast.duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gray-100 dark:bg-gray-700">
          <div
            ref={progressRef}
            className={`h-full origin-left ${s.bar}`}
            style={{ transform: 'scaleX(1)' }}
          />
        </div>
      )}

      <div className="flex items-start gap-3 px-4 py-3.5 pt-[18px]">
        {/* Icon */}
        <div className={s.icon}>{icons[toast.variant]}</div>

        {/* Message */}
        <p className={`flex-1 text-sm font-medium leading-snug ${s.text}`}>
          {toast.message}
        </p>

        {/* Close */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 p-0.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Provider
   ═══════════════════════════════════════════════════════════════════════ */

const MAX_VISIBLE = 5
const EXIT_DURATION = 280

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    // Phase exit → puis retrait
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, phase: 'exit' } : t)))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, EXIT_DURATION)
    const timer = timersRef.current.get(id)
    if (timer) { clearTimeout(timer); timersRef.current.delete(id) }
  }, [])

  const toast: ToastFn = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options
    const id = ++_nextId
    const duration = opts.duration ?? 4000
    const item: ToastItem = {
      id,
      message: opts.message,
      variant: opts.variant ?? 'info',
      duration,
      phase: 'enter',
    }

    setToasts((prev) => {
      const next = [...prev, item]
      // Limite visible : dismiss les plus anciens
      if (next.length > MAX_VISIBLE) {
        const toRemove = next.slice(0, next.length - MAX_VISIBLE)
        toRemove.forEach((t) => dismiss(t.id))
      }
      return next
    })

    // Transition enter → idle
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, phase: 'idle' } : t)))
    }, 350)

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => dismiss(id), duration)
      timersRef.current.set(id, timer)
    }
  }, [dismiss])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {toasts.length > 0 && createPortal(
        <div
          className="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 pointer-events-none"
          aria-label="Notifications"
        >
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastCard toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Hook
   ═══════════════════════════════════════════════════════════════════════ */

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

/** Raccourcis typés */
export function useToastActions() {
  const toast = useToast()
  return {
    success: (message: string, duration?: number) => toast({ message, variant: 'success', duration }),
    error: (message: string, duration?: number) => toast({ message, variant: 'error', duration }),
    warning: (message: string, duration?: number) => toast({ message, variant: 'warning', duration }),
    info: (message: string, duration?: number) => toast({ message, variant: 'info', duration }),
  }
}
