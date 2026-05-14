import { useTranslation } from 'react-i18next'
import { Avatar } from './Primitives'
import type { SalleReunion } from '@/types/salleReunion'

interface ClosedViewProps {
  salle: SalleReunion
  isAdmin: boolean
  openingProgress: number | null
  onOpen: () => void
}

function formatClosedMeta(salle: SalleReunion): { name: string; time: string } {
  const who = salle.fermeePar
  const name = who ? `${who.prenom} ${who.nom}` : '—'
  let time = ''
  if (salle.dateFermeture) {
    const d = new Date(salle.dateFermeture)
    time = d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  return { name, time }
}

export function ClosedView({ salle, isAdmin, openingProgress, onOpen }: ClosedViewProps) {
  const { t } = useTranslation('salleReunion')
  const opening = openingProgress != null
  const meta = formatClosedMeta(salle)

  return (
    <div className="relative min-h-[640px] rounded-xl bg-white dark:bg-neutral-900/70 overflow-hidden">
      {/* ambient orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="w-[520px] h-[520px] rounded-full salle-breathe-slow" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(46,82,102,0.18), transparent 60%)' }} />
          <div className="absolute inset-0 m-auto w-[340px] h-[340px] rounded-full salle-breathe" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(72,181,160,0.18), transparent 60%)' }} />
        </div>
      </div>

      <div className="relative px-10 pt-14 pb-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/70 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          {t('closed.pilleText')}
        </div>

        <h1 className="mt-6 text-[44px] leading-[1.05] tracking-[-0.03em] font-semibold text-neutral-900 dark:text-white max-w-xl">
          {opening ? t('closed.openingTitle') : t('closed.title')}
        </h1>
        <p className="mt-4 text-[14.5px] text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
          {opening ? t('closed.openingDescription') : t('closed.description')}
        </p>

        {opening ? (
          <div className="mt-10 w-[320px]">
            <div className="h-[3px] rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full bg-[#FF6B35] transition-all duration-200 ease-out" style={{ width: openingProgress + '%' }} />
            </div>
            <div className="mt-2 flex justify-between tabular-nums text-[11px] text-neutral-400">
              <span>{t('closed.initialisation')}</span>
              <span>{openingProgress}%</span>
            </div>
          </div>
        ) : (
          <>
            {/* metadata */}
            {salle.fermeePar && (
              <div className="mt-9 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                <Avatar
                  initials={`${salle.fermeePar.prenom[0]}${salle.fermeePar.nom[0]}`}
                  color="#2E5266"
                  name={meta.name}
                  size={28}
                />
                <div className="text-left">
                  <div className="text-[12.5px] font-medium text-neutral-800 dark:text-neutral-200">
                    {t('closed.fermeePar', { name: meta.name })}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">{meta.time}</div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-9 flex items-center gap-3 flex-wrap justify-center">
              {isAdmin ? (
                <>
                  <button
                    onClick={onOpen}
                    className="group inline-flex items-center gap-2 pl-4 pr-3.5 py-2.5 rounded-lg bg-[#FF6B35] text-white text-[13.5px] font-medium hover:bg-[#ef5e2b] transition-colors min-h-[44px]"
                  >
                    <span className="relative inline-flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-white/80" />
                    </span>
                    {t('actions.ouvrir')}
                  </button>
                  <button className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors min-h-[44px]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
                    {t('closed.planifier')}
                  </button>
                </>
              ) : (
                <>
                  <button className="inline-flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[13px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors min-h-[44px]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/><line x1="12" y1="2" x2="12" y2="5"/></svg>
                    {t('closed.notifyMe')}
                  </button>
                  <button className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors min-h-[44px]">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    {t('closed.contactAdmin')}
                  </button>
                </>
              )}
            </div>

            {!isAdmin && (
              <div className="mt-8 text-[11.5px] text-neutral-400 dark:text-neutral-500">
                {t('closed.adminOnly')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
