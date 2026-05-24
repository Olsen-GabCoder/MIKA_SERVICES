import { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSalleReunion } from '../hooks/useSalleReunion'
import { useSalleParticipants } from '../hooks/useSalleParticipants'

const DISMISS_KEY = 'salle-badge-dismissed'

function isDismissed(salleId: number | undefined, dateOuverture: string | null): boolean {
  if (!salleId || !dateOuverture) return false
  try {
    const stored = sessionStorage.getItem(DISMISS_KEY)
    return stored === `${salleId}-${dateOuverture}`
  } catch {
    return false
  }
}

function dismiss(salleId: number, dateOuverture: string): void {
  try {
    sessionStorage.setItem(DISMISS_KEY, `${salleId}-${dateOuverture}`)
  } catch { /* noop */ }
}

export function FloatingRoomBadge() {
  const { data: salle } = useSalleReunion()
  const { participants } = useSalleParticipants(!!salle?.ouverte)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation('salleReunion')
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (salle?.dateOuverture) {
      dismiss(salle.id, salle.dateOuverture)
    }
    setDismissed(true)
  }, [salle])

  // Garde-fou 1 : invisible si salle fermee
  if (!salle?.ouverte) return null

  // Garde-fou 2 : masque sur la page salle elle-meme
  if (location.pathname.startsWith('/salle-mika')) return null

  // Garde-fou 3 : dismissible avec memoire de session
  if (dismissed || isDismissed(salle?.id, salle?.dateOuverture)) return null

  return (
    <button
      onClick={() => navigate('/salle-mika')}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 pl-3 pr-2 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 salle-anim-up group"
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}
    >
      <span className="relative inline-flex w-2 h-2">
        <span className="absolute inset-0 rounded-full bg-emerald-500" />
        <span className="absolute inset-0 rounded-full salle-live-dot text-emerald-500" />
      </span>
      <span className="text-[12.5px] font-medium tracking-[-0.02em]">
        {t('floating.enDirect')}
        {participants.length > 0 && <span className="opacity-70"> {t('floating.count', { count: participants.length })}</span>}
      </span>
      <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
      {/* dismiss X */}
      <span
        onClick={handleDismiss}
        className="ml-1 p-1 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
        role="button"
        aria-label="Dismiss"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </span>
    </button>
  )
}
