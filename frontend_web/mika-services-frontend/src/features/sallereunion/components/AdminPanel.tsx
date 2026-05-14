import { useTranslation } from 'react-i18next'
import type { SalleReunion } from '@/types/salleReunion'

interface AdminPanelProps {
  salle: SalleReunion
  onOpenModal: (kind: 'open' | 'close') => void
}

export function AdminPanel({ salle, onOpenModal }: AdminPanelProps) {
  const { t } = useTranslation('salleReunion')

  return (
    <div className="mt-6 rounded-2xl bg-white dark:bg-neutral-900/70 p-6 sm:p-7 border border-neutral-100 dark:border-neutral-800/60 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div className="text-[13px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">{t('admin.controlTitle')}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-[18px] font-bold tracking-[-0.02em] text-neutral-900 dark:text-white">{t('admin.etatTitle')}</h3>
          <p className="mt-2 text-[14px] sm:text-[15px] text-neutral-500 dark:text-neutral-400 leading-relaxed">{t('admin.etatDesc')}</p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminAction tone="mika" label={t('actions.ouvrir')} sub={t('admin.ouvrirSub')} disabled={salle.ouverte} onClick={() => onOpenModal('open')} />
            <AdminAction tone="danger" label={t('actions.fermer')} sub={t('admin.fermerSub')} disabled={!salle.ouverte} onClick={() => onOpenModal('close')} />
          </div>
        </div>

        <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 p-5 border border-neutral-200/60 dark:border-neutral-800/60">
          <div className="text-[12px] uppercase tracking-wider text-neutral-400 font-semibold mb-3">{t('admin.journalRecent')}</div>
          <div className="space-y-3 text-[14px] text-neutral-500 dark:text-neutral-400">
            {salle.ouvertePar && salle.dateOuverture && (
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{salle.ouvertePar.prenom} {salle.ouvertePar.nom}</span>
                  {' '}{t('statut.ouverte').toLowerCase()}
                  <span className="tabular-nums text-neutral-400 ml-1">· {new Date(salle.dateOuverture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}
            {salle.fermeePar && salle.dateFermeture && (
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{salle.fermeePar.prenom} {salle.fermeePar.nom}</span>
                  {' '}{t('statut.fermee').toLowerCase()}
                  <span className="tabular-nums text-neutral-400 ml-1">· {new Date(salle.dateFermeture).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
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
        'group text-left p-4 sm:p-5 rounded-2xl border transition-all duration-150 min-h-[48px] ' +
        (disabled
          ? 'border-neutral-200/70 dark:border-neutral-800/70 opacity-40 cursor-not-allowed'
          : tone === 'mika'
            ? 'border-[#FF6B35]/25 bg-[#FF6B35]/[0.04] hover:bg-[#FF6B35]/[0.08] hover:border-[#FF6B35]/40 hover:shadow-sm'
            : 'border-rose-500/20 bg-rose-500/[0.04] hover:bg-rose-500/[0.08] hover:border-rose-500/30 hover:shadow-sm')
      }
    >
      <div className="flex items-center gap-3">
        <span className={'w-10 h-10 rounded-xl flex items-center justify-center ' + (tone === 'mika' ? 'bg-[#FF6B35]/15 text-[#FF6B35]' : 'bg-rose-500/15 text-rose-500')}>
          {tone === 'mika' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M18.36 6.64A9 9 0 005.636 18.364M18.364 18.364A9 9 0 005.636 5.636"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></svg>
          )}
        </span>
        <div className="flex-1">
          <div className={'text-[15px] font-semibold ' + (tone === 'mika' ? 'text-[#FF6B35]' : 'text-rose-500')}>{label}</div>
          <div className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5">{sub}</div>
        </div>
        <svg className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 group-hover:text-neutral-500 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    </button>
  )
}
