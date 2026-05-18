import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Hauteur max du contenu scrollable (ex: "60vh"). Par défaut le modal s'adapte. */
  maxContentHeight?: string
  /** Désactiver la fermeture par backdrop click (pour les modals critiques). */
  persistent?: boolean
}

const sizeMap: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  maxContentHeight,
  persistent = false,
}: ModalProps) => {
  const { t } = useTranslation('common')
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus trap + Escape
  useEffect(() => {
    if (!isOpen) return

    // Focus le panel au montage
    const timer = setTimeout(() => panelRef.current?.focus(), 60)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    // Empêcher le scroll du body
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const contentStyle = maxContentHeight
    ? { maxHeight: maxContentHeight, overflowY: 'auto' as const }
    : undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 salle-anim-fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      onClick={persistent ? undefined : onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 ${sizeMap[size] ?? sizeMap.md} w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-black/40 border border-gray-200/60 dark:border-gray-700/60 flex flex-col min-w-0 max-h-[85vh] sm:max-h-[90vh] salle-anim-scale outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 gap-3">
          <h2
            id="modal-heading"
            className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            aria-label={t('close')}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          className="px-5 sm:px-6 py-4 flex-1 min-h-0 overflow-y-auto text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
          style={contentStyle}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 shrink-0 bg-gray-50/80 dark:bg-gray-800/80 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
