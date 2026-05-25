import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { resolveGuidance, type PageGuidance } from '@/constants/guidanceRegistry'

interface GuidanceState {
  assistantOpen: boolean
  openAssistant: () => void
  closeAssistant: () => void
  toggleAssistant: () => void
  pageGuidance: PageGuidance
  guidanceEnabled: boolean
  setGuidanceEnabled: (v: boolean) => void
}

const GuidanceContext = createContext<GuidanceState | null>(null)

const STORAGE_KEY = 'mika_guidance_enabled'

export function GuidanceProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [guidanceEnabled, setGuidanceEnabledState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored !== 'false'
    } catch {
      return true
    }
  })

  const openAssistant = useCallback(() => setAssistantOpen(true), [])
  const closeAssistant = useCallback(() => setAssistantOpen(false), [])
  const toggleAssistant = useCallback(() => setAssistantOpen(p => !p), [])

  const setGuidanceEnabled = useCallback((v: boolean) => {
    setGuidanceEnabledState(v)
    try { localStorage.setItem(STORAGE_KEY, String(v)) } catch { /* noop */ }
  }, [])

  const pageGuidance = useMemo(() => resolveGuidance(location.pathname), [location.pathname])

  const value = useMemo<GuidanceState>(() => ({
    assistantOpen,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    pageGuidance,
    guidanceEnabled,
    setGuidanceEnabled,
  }), [assistantOpen, openAssistant, closeAssistant, toggleAssistant, pageGuidance, guidanceEnabled, setGuidanceEnabled])

  return (
    <GuidanceContext.Provider value={value}>
      {children}
    </GuidanceContext.Provider>
  )
}

export function useGuidance(): GuidanceState {
  const ctx = useContext(GuidanceContext)
  if (!ctx) throw new Error('useGuidance must be used within GuidanceProvider')
  return ctx
}
