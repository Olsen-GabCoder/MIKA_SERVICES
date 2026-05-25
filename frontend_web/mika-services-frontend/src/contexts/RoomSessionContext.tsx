import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { JaaSToken } from '@/types/salleReunion'

// ── Types ──────────────────────────────────────────────────────────────

export type RoomPhase = 'idle' | 'lobby' | 'joining' | 'immersive' | 'mini'

export interface MediaPrefs {
  videoMuted: boolean
  audioMuted: boolean
}

export interface RoomSessionState {
  phase: RoomPhase
  jaasToken: JaaSToken | null
  mediaPrefs: MediaPrefs
  miniPosition: { x: number; y: number } | null
  salleOuverte: boolean
}

// ── Actions ────────────────────────────────────────────────────────────

type RoomAction =
  | { type: 'ENTER_LOBBY' }
  | { type: 'SET_MEDIA_PREFS'; payload: MediaPrefs }
  | { type: 'JOIN_REQUEST' }
  | { type: 'JOIN_SUCCESS'; payload: { jaasToken: JaaSToken } }
  | { type: 'SWITCH_TO_MINI' }
  | { type: 'SWITCH_TO_IMMERSIVE' }
  | { type: 'LEAVE' }
  | { type: 'SALLE_CLOSED' }
  | { type: 'SET_MINI_POSITION'; payload: { x: number; y: number } }
  | { type: 'SYNC_SALLE_OUVERTE'; payload: boolean }

export type RoomDispatch = Dispatch<RoomAction>

// ── localStorage persistence (miniPosition only) ──────────────────────

const MINI_POSITION_KEY = 'mika-pip-position'

function loadMiniPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(MINI_POSITION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed
    return null
  } catch {
    return null
  }
}

function saveMiniPosition(pos: { x: number; y: number }): void {
  try {
    localStorage.setItem(MINI_POSITION_KEY, JSON.stringify(pos))
  } catch { /* noop */ }
}

// ── Reducer ────────────────────────────────────────────────────────────

function roomReducer(state: RoomSessionState, action: RoomAction): RoomSessionState {
  switch (action.type) {
    case 'ENTER_LOBBY':
      return { ...state, phase: 'lobby' }

    case 'SET_MEDIA_PREFS':
      return { ...state, mediaPrefs: action.payload }

    case 'JOIN_REQUEST':
      return { ...state, phase: 'joining' }

    case 'JOIN_SUCCESS':
      return { ...state, phase: 'immersive', jaasToken: action.payload.jaasToken }

    case 'SWITCH_TO_MINI':
      return state.phase === 'immersive' ? { ...state, phase: 'mini' } : state

    case 'SWITCH_TO_IMMERSIVE':
      return state.phase === 'mini' ? { ...state, phase: 'immersive' } : state

    case 'LEAVE':
      return { ...state, phase: 'idle', jaasToken: null }

    case 'SALLE_CLOSED':
      return { ...state, phase: 'idle', jaasToken: null, salleOuverte: false }

    case 'SET_MINI_POSITION': {
      saveMiniPosition(action.payload)
      return { ...state, miniPosition: action.payload }
    }

    case 'SYNC_SALLE_OUVERTE':
      if (!action.payload && state.phase !== 'idle') {
        return { ...state, salleOuverte: false, phase: 'idle', jaasToken: null }
      }
      return { ...state, salleOuverte: action.payload }

    default:
      return state
  }
}

// ── Initial state ──────────────────────────────────────────────────────

function createInitialState(): RoomSessionState {
  return {
    phase: 'idle',
    jaasToken: null,
    mediaPrefs: { videoMuted: false, audioMuted: true },
    miniPosition: loadMiniPosition(),
    salleOuverte: false,
  }
}

// ── Context ────────────────────────────────────────────────────────────

interface RoomSessionContextValue {
  state: RoomSessionState
  dispatch: RoomDispatch
}

const RoomSessionContext = createContext<RoomSessionContextValue | null>(null)

// ── Provider ───────────────────────────────────────────────────────────

export function RoomSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(roomReducer, undefined, createInitialState)

  return (
    <RoomSessionContext.Provider value={{ state, dispatch }}>
      {children}
    </RoomSessionContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useRoomSession(): RoomSessionContextValue {
  const ctx = useContext(RoomSessionContext)
  if (!ctx) throw new Error('useRoomSession must be used within RoomSessionProvider')
  return ctx
}
