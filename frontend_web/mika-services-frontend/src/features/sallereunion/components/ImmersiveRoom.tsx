import { useTranslation } from 'react-i18next'
import { JitsiRoom } from './JitsiRoom'
import type { JaaSToken } from '@/types/salleReunion'

interface ImmersiveRoomProps {
  jaasToken: JaaSToken
  onLeave: () => void
}

export function ImmersiveRoom({ jaasToken, onLeave }: ImmersiveRoomProps) {
  const { t } = useTranslation('salleReunion')

  return (
    <div className="fixed inset-0 z-50 bg-black salle-immersive-enter">
      {/* Bouton Sortir discret en haut a gauche */}
      <button
        onClick={onLeave}
        className="fixed top-4 left-4 z-[60] flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-black/80 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/40 min-h-[44px]"
        aria-label={t('actions.quitterSalle')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>{t('actions.quitterSalle')}</span>
      </button>

      {/* Iframe Jitsi JaaS plein ecran */}
      <JitsiRoom
        jaasToken={jaasToken}
        onLeave={onLeave}
        immersive
      />
    </div>
  )
}
