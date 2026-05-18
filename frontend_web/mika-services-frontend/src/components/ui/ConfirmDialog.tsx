import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
  /** Si true, un seul bouton (OK) — pour remplacer alert(). */
  alertOnly?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DangerIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
      <svg className="h-7 w-7 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    </div>
  )
}

function InfoIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
      <svg className="h-7 w-7 text-primary dark:text-primary-light" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    </div>
  )
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  alertOnly = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const { t } = useTranslation('common')
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => confirmBtnRef.current?.focus(), 80)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alertOnly ? onConfirm() : onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, alertOnly, onConfirm, onCancel])

  if (!open) return null

  const isDanger = variant === 'danger'

  const confirmBtnClass = isDanger
    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white'
    : 'bg-primary hover:bg-primary-dark focus-visible:ring-primary text-white'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 salle-anim-fade"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      aria-describedby="cd-message"
      onClick={alertOnly ? onConfirm : onCancel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      <div
        className="relative z-10 w-full max-w-[340px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-black/40 border border-gray-200/60 dark:border-gray-700/60 salle-anim-scale overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-7 pb-2 text-center">
          {isDanger ? <DangerIcon /> : <InfoIcon />}

          <h3 id="cd-title" className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>

          <p id="cd-message" className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className={`px-6 pt-4 pb-6 ${alertOnly ? 'flex justify-center' : 'grid grid-cols-2 gap-3'}`}>
          {!alertOnly && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            >
              {cancelLabel ?? t('confirm.cancel')}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${confirmBtnClass}`}
          >
            {confirmLabel ?? (alertOnly ? t('confirm.ok') : isDanger ? t('confirm.delete') : t('confirm.ok'))}
          </button>
        </div>
      </div>
    </div>
  )
}
