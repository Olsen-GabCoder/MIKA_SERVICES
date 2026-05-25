import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoomSession } from '@/contexts/RoomSessionContext'
import { useDraggable } from '@/hooks/useDraggable'
import { ConfirmModal } from '@/features/sallereunion/components/ConfirmModal'
import { MINI_WIDTH, MINI_HEIGHT, MINI_WIDTH_MOBILE, MINI_HEIGHT_MOBILE } from './RoomVideoContainer'

interface MiniPlayerProps {
  onDragStateChange?: (isDragging: boolean, transformOverride: string | null) => void
  onToggleAudio?: () => void
  onToggleVideo?: () => void
  isMobile?: boolean
}

export function MiniPlayer({ onDragStateChange, onToggleAudio, onToggleVideo, isMobile }: MiniPlayerProps) {
  const { t } = useTranslation('salleReunion')
  const { state, dispatch } = useRoomSession()
  const [hovered, setHovered] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const mw = isMobile ? MINI_WIDTH_MOBILE : MINI_WIDTH
  const mh = isMobile ? MINI_HEIGHT_MOBILE : MINI_HEIGHT
  const miniSize = { width: mw, height: mh }
  // On mobile: controls always visible, no hover needed
  const controlsVisible = isMobile || hovered

  const handlePositionChange = useCallback((pos: { x: number; y: number }) => {
    dispatch({ type: 'SET_MINI_POSITION', payload: pos })
  }, [dispatch])

  const { ref: dragRef, isDragging } = useDraggable({
    elementSize: miniSize,
    initialPosition: isMobile ? null : state.miniPosition,
    onPositionChange: handlePositionChange,
    onDragStateChange,
    disabled: isMobile,
  })

  const handleExpand = useCallback(() => {
    dispatch({ type: 'SWITCH_TO_IMMERSIVE' })
  }, [dispatch])

  const handleConfirmLeave = useCallback(() => {
    setShowLeaveConfirm(false)
    dispatch({ type: 'LEAVE' })
  }, [dispatch])

  const btnSize = isMobile ? 'w-9 h-9' : 'w-8 h-8'
  const iconSize = isMobile ? 'w-[18px] h-[18px]' : 'w-4 h-4'

  return (
    <>
      <div
        ref={dragRef}
        className="fixed z-[56]"
        style={{ touchAction: 'none' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!isDragging) setHovered(false) }}
        role="region"
        aria-label={t('mini.ariaLabel')}
        tabIndex={0}
      >
        <div
          className="relative select-none"
          style={{
            width: mw,
            height: mh,
            borderRadius: 18,
            cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          }}
          onClick={isDragging ? undefined : handleExpand}
        >
          {/* Mute badge — always visible when muted */}
          {state.mediaPrefs.audioMuted && !controlsVisible && (
            <div className="absolute top-2 left-2 z-[2] w-6 h-6 rounded-full bg-rose-500/80 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Controls overlay — hidden during drag */}
          {!isDragging && (
            <div
              className="absolute inset-0 z-[3] transition-opacity duration-150"
              style={{
                opacity: controlsVisible ? 1 : 0,
                pointerEvents: controlsVisible ? 'auto' : 'none',
                background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.65) 100%)',
                borderRadius: 18,
              }}
            >
              {/* Quit — top right */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowLeaveConfirm(true) }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500/80 hover:bg-rose-500 backdrop-blur-sm flex items-center justify-center transition-all hover:scale-110"
                aria-label={t('mini.quitter')}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                </svg>
              </button>

              {/* Bottom controls */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {/* Micro toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleAudio?.() }}
                    className={`${btnSize} rounded-full backdrop-blur-xl flex items-center justify-center transition-all border ${
                      state.mediaPrefs.audioMuted
                        ? 'bg-rose-500/60 border-rose-500/30'
                        : 'bg-white/20 border-white/15'
                    }`}
                    aria-label={t('mini.toggleMicro')}
                  >
                    <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      {state.mediaPrefs.audioMuted ? (
                        <>
                          <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                          <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      ) : (
                        <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                    </svg>
                  </button>

                  {/* Camera toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleVideo?.() }}
                    className={`${btnSize} rounded-full backdrop-blur-xl flex items-center justify-center transition-all border ${
                      state.mediaPrefs.videoMuted
                        ? 'bg-rose-500/60 border-rose-500/30'
                        : 'bg-white/20 border-white/15'
                    }`}
                    aria-label={t('mini.toggleCamera')}
                  >
                    <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Expand */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleExpand() }}
                  className={`${btnSize} rounded-full bg-white/20 backdrop-blur-xl border border-white/15 flex items-center justify-center transition-all hover:bg-white/35`}
                  aria-label={t('mini.agrandir')}
                >
                  <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9m11.25-5.25v4.5m0-4.5h-4.5m4.5 0L15 9m-11.25 11.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showLeaveConfirm && (
        <div className="z-[60]">
          <ConfirmModal
            kind="leave"
            onCancel={() => setShowLeaveConfirm(false)}
            onConfirm={handleConfirmLeave}
          />
        </div>
      )}
    </>
  )
}
