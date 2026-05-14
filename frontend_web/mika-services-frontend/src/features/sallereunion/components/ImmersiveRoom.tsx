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
      {/* Bouton Sortir premium en haut a gauche */}
      <button
        onClick={onLeave}
        className="fixed top-5 left-5 z-[60] flex items-center gap-2.5 bg-white/10 backdrop-blur-xl text-white pl-4 pr-5 py-2.5 rounded-2xl text-[14px] font-semibold hover:bg-white/20 active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[44px] border border-white/10"
        aria-label={t('actions.quitterSalle')}
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>{t('actions.quitterSalle')}</span>
      </button>

      <JitsiRoom jaasToken={jaasToken} onLeave={onLeave} immersive />
    </div>
  )
}
