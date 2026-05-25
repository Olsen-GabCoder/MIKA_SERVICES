import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoomSession } from '@/contexts/RoomSessionContext'
import { ConfirmModal } from './ConfirmModal'
import { NavigateOverlay } from '@/components/room/NavigateOverlay'

interface ImmersiveToolbarProps {
  onLeave: () => void
}

export function ImmersiveRoom({ onLeave }: ImmersiveToolbarProps) {
  const { t } = useTranslation('salleReunion')
  const { dispatch: roomDispatch } = useRoomSession()
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showNavigate, setShowNavigate] = useState(false)

  const handleMinimize = useCallback(() => {
    roomDispatch({ type: 'SWITCH_TO_MINI' })
  }, [roomDispatch])

  // Escape key → close navigate overlay first, then show exit confirmation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (showNavigate) {
          setShowNavigate(false)
        } else {
          setShowExitConfirm(true)
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showNavigate])

  const handleConfirmLeave = useCallback(() => {
    setShowExitConfirm(false)
    onLeave()
  }, [onLeave])

  return (
    <>
      {/* Backdrop for immersive — behind the video container */}
      <div className="fixed inset-0 z-[54] bg-black salle-immersive-enter" />

      {/* Toolbar immersive */}
      <div className="fixed top-5 left-5 z-[60] flex items-center gap-2">
        {/* Bouton Reduire */}
        <button
          onClick={handleMinimize}
          className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xl text-white pl-4 pr-5 py-2.5 rounded-2xl text-[14px] font-semibold hover:bg-white/20 active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[44px] border border-white/10"
          aria-label={t('actions.reduire')}
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
          <span>{t('actions.reduire')}</span>
        </button>
        {/* Bouton Naviguer */}
        <button
          onClick={() => setShowNavigate(true)}
          className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xl text-white pl-4 pr-5 py-2.5 rounded-2xl text-[14px] font-semibold hover:bg-white/20 active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[44px] border border-white/10"
          aria-label={t('actions.naviguer')}
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          <span>{t('actions.naviguer')}</span>
        </button>
        {/* Bouton Sortir */}
        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xl text-white pl-4 pr-5 py-2.5 rounded-2xl text-[14px] font-semibold hover:bg-white/20 active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[44px] border border-white/10"
          aria-label={t('actions.quitterSalle')}
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{t('actions.quitterSalle')}</span>
        </button>
      </div>

      {showNavigate && (
        <NavigateOverlay onClose={() => setShowNavigate(false)} />
      )}

      {showExitConfirm && (
        <ConfirmModal
          kind="leave"
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={handleConfirmLeave}
        />
      )}
    </>
  )
}
