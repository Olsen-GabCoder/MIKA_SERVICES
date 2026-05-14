import { useTranslation } from 'react-i18next'
import type { SalleReunion } from '@/types/salleReunion'

interface AdminPanelProps {
  salle: SalleReunion
  onOpenModal: (kind: 'open' | 'close') => void
}

export function AdminPanel({ salle, onOpenModal }: AdminPanelProps) {
  const { t } = useTranslation('salleReunion')

  return (
    <div className="mt-6 rounded-xl bg-white dark:bg-neutral-900/70 p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <div className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium">{t('admin.controlTitle')}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-neutral-900 dark:text-white">{t('admin.etatTitle')}</h3>
          <p className="mt-1 text-[12.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{t('admin.etatDesc')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <AdminAction tone="mika" label={t('actions.ouvrir')} sub={t('admin.ouvrirSub')} disabled={salle.ouverte} onClick={() => onOpenModal('open')} />
            <AdminAction tone="danger" label={t('actions.fermer')} sub={t('admin.fermerSub')} disabled={!salle.ouverte} onClick={() => onOpenModal('close')} />
          </div>
        </div>
        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/40 p-4 border border-neutral-200/60 dark:border-neutral-800/60">
          <div className="text-[10.5px] uppercase tracking-wider text-neutral-400 mb-2">{t('admin.journalRecent')}</div>
          <div className="text-[12px] text-neutral-500 dark:text-neutral-400">
            {salle.ouvertePar && salle.dateOuverture && (
              <div className="mb-2">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{salle.ouvertePar.prenom} {salle.ouvertePar.nom}</span>
                {' '}{t('statut.ouverte').toLowerCase()} · <span className="tabular-nums">{new Date(salle.dateOuverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {salle.fermeePar && salle.dateFermeture && (
              <div>
                <span className="font-medium text-neutral-800 dark:text-neutral-200">{salle.fermeePar.prenom} {salle.fermeePar.nom}</span>
                {' '}{t('statut.fermee').toLowerCase()} · <span className="tabular-nums">{new Date(salle.dateFermeture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminAction({ tone, label, sub, disabled, onClick }: { tone: 'mika' | 'danger'; label: string; sub: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={
        'group text-left p-3.5 rounded-lg border transition-all min-h-[44px] ' +
        (disabled
          ? 'border-neutral-200/70 dark:border-neutral-800/70 opacity-50 cursor-not-allowed'
          : tone === 'mika'
            ? 'border-[#FF6B35]/30 bg-[#FF6B35]/[0.04] hover:bg-[#FF6B35]/[0.08]'
            : 'border-rose-500/20 bg-rose-500/[0.04] hover:bg-rose-500/[0.08]')
      }
    >
      <div className="flex items-center gap-2.5">
        <span className={'w-7 h-7 rounded-md flex items-center justify-center ' + (tone === 'mika' ? 'bg-[#FF6B35]/15 text-[#FF6B35]' : 'bg-rose-500/15 text-rose-500')}>
          {tone === 'mika' ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M18.36 6.64A9 9 0 005.636 18.364M18.364 18.364A9 9 0 005.636 5.636"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></svg>
          )}
        </span>
        <div className="flex-1">
          <div className={'text-[13px] font-medium ' + (tone === 'mika' ? 'text-[#FF6B35]' : 'text-rose-500')}>{label}</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{sub}</div>
        </div>
        <svg className="w-3.5 h-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    </button>
  )
}
