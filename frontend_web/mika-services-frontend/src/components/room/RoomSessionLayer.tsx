import { useCallback, useState, useRef, useEffect } from 'react'
import { useRoomSession } from '@/contexts/RoomSessionContext'
import { ImmersiveRoom } from '@/features/sallereunion/components/ImmersiveRoom'
import { MiniPlayer } from './MiniPlayer'
import { RoomVideoContainer } from './RoomVideoContainer'
import type { JitsiMeetApi } from '@/features/sallereunion/components/JitsiRoom'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  )
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export function RoomSessionLayer() {
  const { state, dispatch } = useRoomSession()
  const isMobile = useIsMobile()
  const jitsiApiRef = useRef<JitsiMeetApi | null>(null)
  const [dragState, setDragState] = useState<{ isDragging: boolean; transform: string | null }>({
    isDragging: false,
    transform: null,
  })

  const handleLeave = useCallback(() => {
    dispatch({ type: 'LEAVE' })
  }, [dispatch])

  const handleDragStateChange = useCallback((isDragging: boolean, transformOverride: string | null) => {
    setDragState({ isDragging, transform: transformOverride })
  }, [])

  const handleToggleAudio = useCallback(() => {
    jitsiApiRef.current?.executeCommand('toggleAudio')
  }, [])

  const handleToggleVideo = useCallback(() => {
    jitsiApiRef.current?.executeCommand('toggleVideo')
  }, [])

  if (!state.salleOuverte || !state.jaasToken) return null
  if (state.phase !== 'immersive' && state.phase !== 'mini') return null

  return (
    <>
      <RoomVideoContainer
        isDragging={dragState.isDragging}
        dragTransformOverride={dragState.transform}
        isMobile={isMobile}
        jitsiApiRef={jitsiApiRef}
      />
      {state.phase === 'immersive' && (
        <ImmersiveRoom onLeave={handleLeave} />
      )}
      {state.phase === 'mini' && (
        <MiniPlayer
          onDragStateChange={handleDragStateChange}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          isMobile={isMobile}
        />
      )}
    </>
  )
}
