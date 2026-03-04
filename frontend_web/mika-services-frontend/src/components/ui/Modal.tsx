import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Hauteur max du contenu (ex: 85vh) pour éviter un dialogue trop long en vertical */
  maxContentHeight?: string
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  maxContentHeight,
}: ModalProps) => {
  if (!isOpen) return null

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
  }

  const contentStyle = maxContentHeight
    ? { maxHeight: maxContentHeight, overflowY: 'auto' as const }
    : undefined

  return (
    <div
      style={overlayStyle}
      className="flex items-center justify-center p-3 sm:p-4 bg-black/50 dark:bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        id="modal-title"
        className={`mika-theme-card rounded-xl shadow-2xl dark:shadow-none border ${sizeStyles[size]} w-full max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-2rem)] flex flex-col min-w-0 max-h-[85%] sm:max-h-[90%]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between shrink-0 gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex-1 min-h-0 overflow-hidden flex flex-col text-gray-900 dark:text-gray-200" style={contentStyle}>
          {children}
        </div>
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3 shrink-0 bg-gray-50/80 dark:bg-gray-800/90 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
