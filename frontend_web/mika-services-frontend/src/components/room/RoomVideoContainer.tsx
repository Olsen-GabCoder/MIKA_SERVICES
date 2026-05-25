import { useEffect, useCallback, useMemo, useRef } from 'react'
import { useRoomSession } from '@/contexts/RoomSessionContext'
import { JitsiRoom, type JitsiMeetApi } from '@/features/sallereunion/components/JitsiRoom'
import { salleReunionApi } from '@/api/salleReunionApi'

const MINI_WIDTH = 560
const MINI_HEIGHT = 350
const MINI_WIDTH_MOBILE = 340
const MINI_HEIGHT_MOBILE = 213
const MARGIN = 16

const FLIP_TRANSITION = [
  'top 350ms cubic-bezier(0.32, 0.72, 0, 1)',
  'left 350ms cubic-bezier(0.32, 0.72, 0, 1)',
  'width 350ms cubic-bezier(0.32, 0.72, 0, 1)',
  'height 350ms cubic-bezier(0.32, 0.72, 0, 1)',
  'border-radius 350ms cubic-bezier(0.32, 0.72, 0, 1)',
].join(', ')

export function defaultMiniPosition(isMobile: boolean): { x: number; y: number } {
  const w = isMobile ? MINI_WIDTH_MOBILE : MINI_WIDTH
  const h = isMobile ? MINI_HEIGHT_MOBILE : MINI_HEIGHT
  if (isMobile) {
    return {
      x: Math.round((window.innerWidth - w) / 2),
      y: window.innerHeight - h - 72,
    }
  }
  return {
    x: window.innerWidth - w - MARGIN,
    y: window.innerHeight - h - MARGIN,
  }
}

export { MINI_WIDTH, MINI_HEIGHT, MINI_WIDTH_MOBILE, MINI_HEIGHT_MOBILE }

interface RoomVideoContainerProps {
  isDragging?: boolean
  dragTransformOverride?: string | null
  isMobile?: boolean
  jitsiApiRef: React.MutableRefObject<JitsiMeetApi | null>
}

export function RoomVideoContainer({ isDragging, dragTransformOverride, isMobile, jitsiApiRef }: RoomVideoContainerProps) {
  const { state, dispatch } = useRoomSession()

  const handleLeave = useCallback(() => {
    dispatch({ type: 'LEAVE' })
  }, [dispatch])

  // We need a ref to mediaPrefs to avoid stale closures in Jitsi event listeners
  const mediaPrefsRef = useRef(state.mediaPrefs)
  mediaPrefsRef.current = state.mediaPrefs

  const handleApiReady = useCallback((api: JitsiMeetApi) => {
    jitsiApiRef.current = api

    api.addListener('audioMuteStatusChanged', (({ muted }: { muted: boolean }) => {
      dispatch({ type: 'SET_MEDIA_PREFS', payload: { ...mediaPrefsRef.current, audioMuted: muted } })
    }) as (...args: unknown[]) => void)

    api.addListener('videoMuteStatusChanged', (({ muted }: { muted: boolean }) => {
      dispatch({ type: 'SET_MEDIA_PREFS', payload: { ...mediaPrefsRef.current, videoMuted: muted } })
    }) as (...args: unknown[]) => void)
  }, [dispatch, jitsiApiRef])

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


  const isImmersive = state.phase === 'immersive'
  const mw = isMobile ? MINI_WIDTH_MOBILE : MINI_WIDTH
  const mh = isMobile ? MINI_HEIGHT_MOBILE : MINI_HEIGHT
  const miniPos = isMobile
    ? defaultMiniPosition(true)
    : (state.miniPosition ?? defaultMiniPosition(false))

  const containerStyle = useMemo((): React.CSSProperties => {
    if (isImmersive) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        borderRadius: 0,
        zIndex: 55,
        overflow: 'hidden',
        background: '#000',
        transition: isDragging ? 'none' : FLIP_TRANSITION,
      }
    }
    if (isDragging && dragTransformOverride) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: mw,
        height: mh,
        borderRadius: 18,
        zIndex: 55,
        overflow: 'hidden',
        background: '#000',
        transform: dragTransformOverride,
        transition: 'none',
        boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
        opacity: 0.85,
      }
    }
    return {
      position: 'fixed',
      top: miniPos.y,
      left: miniPos.x,
      width: mw,
      height: mh,
      borderRadius: 18,
      zIndex: 55,
      overflow: 'hidden',
      background: '#000',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      border: '1px solid rgba(255,255,255,0.08)',
      transition: isDragging ? 'none' : FLIP_TRANSITION,
    }
  }, [isImmersive, miniPos.x, miniPos.y, isDragging, dragTransformOverride, mw, mh])

  if (!state.jaasToken) return null

  return (
    <div style={containerStyle}>
      <JitsiRoom
        jaasToken={state.jaasToken}
        onLeave={handleLeave}
        immersive
        mediaPrefs={state.mediaPrefs}
        onApiReady={handleApiReady}
      />
    </div>
  )
}
