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
    <div className="relative min-h-[560px] sm:min-h-[640px] rounded-2xl bg-white dark:bg-neutral-900/70 overflow-hidden border border-neutral-100 dark:border-neutral-800/60 shadow-sm">
      {/* ambient orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <div className="w-[420px] sm:w-[520px] h-[420px] sm:h-[520px] rounded-full salle-breathe-slow" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(46,82,102,0.18), transparent 60%)' }} />
          <div className="absolute inset-0 m-auto w-[280px] sm:w-[340px] h-[280px] sm:h-[340px] rounded-full salle-breathe" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(72,181,160,0.18), transparent 60%)' }} />
        </div>
      </div>

      <div className="relative px-6 sm:px-10 pt-12 sm:pt-16 pb-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800/70 text-[13px] font-medium text-neutral-500 dark:text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          {t('closed.pilleText')}
        </div>

        <h1 className="mt-8 text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.1] tracking-[-0.03em] font-bold text-neutral-900 dark:text-white max-w-lg">
          {opening ? t('closed.openingTitle') : t('closed.title')}
        </h1>
        <p className="mt-5 text-[15px] sm:text-[16px] text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
          {opening ? t('closed.openingDescription') : t('closed.description')}
        </p>

        {opening ? (
          <div className="mt-12 w-full max-w-[360px]">
            <div className="h-1 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full bg-[#FF6B35] transition-all duration-200 ease-out rounded-full" style={{ width: openingProgress + '%' }} />
            </div>
            <div className="mt-3 flex justify-between tabular-nums text-[13px] text-neutral-400">
              <span>{t('closed.initialisation')}</span>
              <span className="font-semibold">{openingProgress}%</span>
            </div>
          </div>
        ) : (
          <>
            {salle.fermeePar && (
              <div className="mt-10 flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
                <Avatar initials={`${salle.fermeePar.prenom[0]}${salle.fermeePar.nom[0]}`} color="#2E5266" name={meta.name} size={36} />
                <div className="text-left">
                  <div className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-200">{t('closed.fermeePar', { name: meta.name })}</div>
                  <div className="text-[13px] text-neutral-500 dark:text-neutral-400 tabular-nums mt-0.5">{meta.time}</div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="mt-10 flex items-center justify-center">
                <button
                  onClick={onOpen}
                  className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#FF6B35] text-white text-[15px] font-semibold hover:bg-[#ef5e2b] hover:shadow-lg hover:shadow-[#FF6B35]/25 active:scale-[0.98] transition-all duration-150 min-h-[48px]"
                >
                  <span className="relative inline-flex w-2.5 h-2.5">
                    <span className="absolute inset-0 rounded-full bg-white/80" />
                  </span>
                  {t('actions.ouvrir')}
                </button>
              </div>
            )}

            {!isAdmin && (
              <div className="mt-8 text-[13px] text-neutral-400 dark:text-neutral-500">{t('closed.adminOnly')}</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
