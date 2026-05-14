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
    <div className="rounded-2xl bg-white dark:bg-neutral-900/70 overflow-hidden border border-neutral-100 dark:border-neutral-800/60 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto">
        {/* Left — camera preview zone */}
        <div className="p-5 sm:p-7">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900">
            {/* Ambient gradient */}
            <div className="absolute inset-0 salle-grain" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(46,82,102,0.40), rgba(0,0,0,0.90))' }} />

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-2xl" style={{ background: 'radial-gradient(circle at 35% 35%, rgba(255,107,53,0.6), rgba(46,82,102,0.8))' }} />
              <div className="mt-4 text-[13px] sm:text-[14px] uppercase tracking-[0.15em] text-white/40 font-medium">{t('lobby.apercu')}</div>
            </div>

            {/* HUD overlays */}
            <div className="absolute top-4 left-4">
              <Pill tone="live" dot pulse>{t('badge.enDirect')}</Pill>
            </div>

            {/* Bottom ambient glow */}
            <div className="absolute bottom-0 inset-x-0 h-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
          </div>
        </div>

        {/* Right — metadata + CTA */}
        <div className="px-5 pb-7 sm:px-8 lg:py-8 lg:border-l border-neutral-200/80 dark:border-neutral-800/80 flex flex-col justify-center">
          <div className="flex items-center gap-3 flex-wrap">
            <Pill tone="live" dot pulse>{t('badge.salleOuverte')}</Pill>
            {openedAt && <span className="text-[13px] text-neutral-500 tabular-nums">{t('lobby.depuisTime', { time: openedAt })}</span>}
          </div>

          <h2 className="mt-5 text-[24px] sm:text-[28px] lg:text-[32px] leading-[1.1] tracking-[-0.03em] font-bold text-neutral-900 dark:text-white">
            {salle.libelle}
          </h2>

          {openedBy && (
            <div className="mt-4 flex items-center gap-3 text-[14px] sm:text-[15px] text-neutral-500 dark:text-neutral-400">
              <Avatar initials={`${openedBy.prenom[0]}${openedBy.nom[0]}`} color="#FF6B35" size={28} name={`${openedBy.prenom} ${openedBy.nom}`} />
              <span>
                {t('stats.ouvertePar')}{' '}
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{openedBy.prenom} {openedBy.nom}</span>
                {openedAt && ` · ${openedAt}`}
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="mt-10">
            <button
              onClick={onJoin}
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#FF6B35] text-white text-[16px] font-semibold hover:bg-[#ef5e2b] hover:shadow-xl hover:shadow-[#FF6B35]/25 active:scale-[0.98] transition-all duration-150 min-h-[56px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              {t('actions.rejoindreNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
