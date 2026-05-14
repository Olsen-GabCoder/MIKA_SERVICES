import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmModalProps {
  kind: 'open' | 'close'
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmModal({ kind, loading, onCancel, onConfirm }: ConfirmModalProps) {
  const { t } = useTranslation('salleReunion')
  const isOpen = kind === 'open'
  const confirmRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus le bouton confirm au montage
  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  // Fermer avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 salle-anim-fade" role="dialog" aria-modal="true" aria-labelledby="salle-modal-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div ref={dialogRef} className="relative w-full max-w-[480px] rounded-3xl bg-white dark:bg-neutral-900 p-7 sm:p-8 salle-anim-scale border border-neutral-200 dark:border-neutral-800 shadow-2xl">
        <div className="flex items-start gap-5">
          <div className={'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ' + (isOpen ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'bg-rose-500/10 text-rose-500')}>
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M18.36 6.64A9 9 0 005.636 18.364M18.364 18.364A9 9 0 005.636 5.636"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></svg>
            )}
          </div>
          <div className="flex-1">
            <h3 id="salle-modal-title" className="text-[18px] sm:text-[20px] font-bold tracking-[-0.02em] text-neutral-900 dark:text-white">
              {isOpen ? t('modal.ouvrirTitle') : t('modal.fermerTitle')}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              {isOpen ? t('modal.ouvrirDesc') : t('modal.fermerDesc')}
            </p>
          </div>
        </div>

        <div className="mt-6 px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/60 text-[14px] text-neutral-600 dark:text-neutral-400 flex items-start gap-3">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>{isOpen ? t('modal.ouvrirInfo') : t('modal.fermerInfo')}</span>
        </div>

        <div className="mt-7 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-[15px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-150 min-h-[44px]">
            {t('modal.annuler')}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={'inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[15px] font-semibold text-white active:scale-[0.98] transition-all duration-150 disabled:opacity-50 min-h-[44px] ' + (isOpen ? 'bg-[#FF6B35] hover:bg-[#ef5e2b] hover:shadow-lg hover:shadow-[#FF6B35]/25' : 'bg-rose-500 hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/25')}
          >
            {isOpen ? t('modal.ouvrirConfirm') : t('modal.fermerConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
