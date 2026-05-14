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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 salle-anim-fade">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-[440px] rounded-2xl bg-white dark:bg-neutral-900 p-6 salle-anim-scale border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-start gap-4">
          <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + (isOpen ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'bg-rose-500/10 text-rose-500')}>
            {isOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M18.36 6.64A9 9 0 005.636 18.364M18.364 18.364A9 9 0 005.636 5.636"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-neutral-900 dark:text-white">
              {isOpen ? t('modal.ouvrirTitle') : t('modal.fermerTitle')}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              {isOpen ? t('modal.ouvrirDesc') : t('modal.fermerDesc')}
            </p>
          </div>
        </div>

        <div className="mt-5 px-3.5 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/60 text-[12px] text-neutral-600 dark:text-neutral-400 flex items-start gap-2.5">
          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>{isOpen ? t('modal.ouvrirInfo') : t('modal.fermerInfo')}</span>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-3.5 py-2 rounded-lg text-[13px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
            {t('modal.annuler')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-50 ' + (isOpen ? 'bg-[#FF6B35] hover:bg-[#ef5e2b]' : 'bg-rose-500 hover:bg-rose-600')}
          >
            {isOpen ? t('modal.ouvrirConfirm') : t('modal.fermerConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
