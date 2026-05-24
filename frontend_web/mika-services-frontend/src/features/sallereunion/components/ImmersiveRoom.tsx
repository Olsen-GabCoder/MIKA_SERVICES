import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { JitsiRoom } from './JitsiRoom'
import { ConfirmModal } from './ConfirmModal'
import { salleReunionApi } from '@/api/salleReunionApi'
import type { JaaSToken } from '@/types/salleReunion'

interface ImmersiveRoomProps {
  jaasToken: JaaSToken
  onLeave: () => void
  mediaPrefs?: { videoMuted: boolean; audioMuted: boolean }
}

export function ImmersiveRoom({ jaasToken, onLeave, mediaPrefs }: ImmersiveRoomProps) {
  const { t } = useTranslation('salleReunion')
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Join participant on mount, leave on unmount
  useEffect(() => {
    salleReunionApi.participantsJoin().catch(() => {})
    return () => { salleReunionApi.participantsLeave().catch(() => {}) }
  }, [])

  // Heartbeat every 2 minutes
  useEffect(() => {
    const id = setInterval(() => {
      salleReunionApi.participantsHeartbeat().catch(() => {})
    }, 120_000)
    return () => clearInterval(id)
  }, [])

  // Escape key → show exit confirmation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowExitConfirm(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const handleConfirmLeave = useCallback(() => {
    setShowExitConfirm(false)
    onLeave()
  }, [onLeave])

  return (
    <div className="fixed inset-0 z-50 bg-black salle-immersive-enter">
      {/* Bouton Sortir */}
      <button
        onClick={() => setShowExitConfirm(true)}
        className="fixed top-5 left-5 z-[60] flex items-center gap-2.5 bg-white/10 backdrop-blur-xl text-white pl-4 pr-5 py-2.5 rounded-2xl text-[14px] font-semibold hover:bg-white/20 active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[44px] border border-white/10"
        aria-label={t('actions.quitterSalle')}
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>{t('actions.quitterSalle')}</span>
      </button>

      <JitsiRoom jaasToken={jaasToken} onLeave={onLeave} immersive mediaPrefs={mediaPrefs} />

      {showExitConfirm && (
        <ConfirmModal
          kind="leave"
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={handleConfirmLeave}
        />
      )}
    </div>
  )
}
