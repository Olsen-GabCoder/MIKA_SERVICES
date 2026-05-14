import { useTranslation } from 'react-i18next'
import { Pill, Avatar } from './Primitives'
import type { SalleReunion } from '@/types/salleReunion'

interface LobbyViewProps {
  salle: SalleReunion
  onJoin: () => void
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function LobbyView({ salle, onJoin }: LobbyViewProps) {
  const { t } = useTranslation('salleReunion')
  const openedBy = salle.ouvertePar
  const openedAt = formatTime(salle.dateOuverture)

  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-900/70 overflow-hidden border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto">
        {/* Left — preview camera zone */}
        <div className="p-5 lg:p-6">
          <div className="relative aspect-video max-h-[320px] rounded-xl overflow-hidden bg-neutral-900 salle-grain">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(46,82,102,0.45), rgba(0,0,0,0.92))' }} />
              <div className="relative z-10 flex flex-col items-center text-white/80">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, #6d4733, #2a1a14)' }} />
                <div className="mt-3 text-[11px] sm:text-[12px] uppercase tracking-widest opacity-50">{t('lobby.apercu')}</div>
              </div>
            </div>

            {/* HUD overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Pill tone="live" dot pulse>{t('badge.enDirect')}</Pill>
            </div>
          </div>
        </div>

        {/* Right — metadata + CTA */}
        <div className="px-5 pb-6 lg:px-7 lg:py-6 lg:border-l border-neutral-200/80 dark:border-neutral-800/80 flex flex-col justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone="live" dot pulse>{t('badge.salleOuverte')}</Pill>
            {openedAt && <span className="text-[11.5px] text-neutral-500 tabular-nums">{t('lobby.depuisTime', { time: openedAt })}</span>}
          </div>

          <h2 className="mt-4 text-[24px] sm:text-[28px] leading-[1.1] tracking-[-0.03em] font-semibold text-neutral-900 dark:text-white">
            {salle.libelle}
          </h2>

          {openedBy && (
            <div className="mt-3 flex items-center gap-2.5 text-[12.5px] text-neutral-500 dark:text-neutral-400">
              <Avatar
                initials={`${openedBy.prenom[0]}${openedBy.nom[0]}`}
                color="#FF6B35"
                size={20}
                name={`${openedBy.prenom} ${openedBy.nom}`}
              />
              <span>
                {t('stats.ouvertePar')}{' '}
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">{openedBy.prenom} {openedBy.nom}</span>
                {openedAt && ` · ${openedAt}`}
              </span>
            </div>
          )}

          {/* CTA buttons */}
          <div className="mt-8">
            <button
              onClick={onJoin}
              className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-[#FF6B35] text-white text-[14px] font-medium hover:bg-[#ef5e2b] transition-all hover:shadow-lg hover:shadow-[#FF6B35]/20 min-h-[48px]"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              {t('actions.rejoindreNow')}
            </button>
            <button className="mt-2.5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors min-h-[44px]">
              {t('actions.rejoindreSansCam')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
