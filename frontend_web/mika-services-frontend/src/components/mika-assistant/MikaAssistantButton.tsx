import { useGuidance } from '@/contexts/GuidanceContext'
import { useRoomSession } from '@/contexts/RoomSessionContext'

function IconSparkle({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
      <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </svg>
  )
}

function isMiniInBottomRight(pos: { x: number; y: number } | null): boolean {
  if (!pos) return true // default position is bottom-right
  const threshold = 200
  return (
    pos.x > window.innerWidth - 560 - threshold &&
    pos.y > window.innerHeight - 350 - threshold
  )
}

export function MikaAssistantButton() {
  const { toggleAssistant, assistantOpen, guidanceEnabled } = useGuidance()
  const { state: roomSession } = useRoomSession()

  if (!guidanceEnabled || assistantOpen) return null

  const needsShift = roomSession.phase === 'mini' && isMiniInBottomRight(roomSession.miniPosition)

  return (
    <button
      onClick={toggleAssistant}
      className="fixed bottom-6 z-40 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center bg-gradient-to-br from-secondary to-secondary-dark group"
      style={{ right: needsShift ? 592 : 24 }}
      title="Assistant Mika"
      aria-label="Ouvrir l'assistant Mika"
    >
      <IconSparkle size={24} className="text-white group-hover:scale-110 transition-transform duration-200" />
      <span className="absolute inset-0 rounded-full bg-secondary/30 animate-ping opacity-20 pointer-events-none" />
    </button>
  )
}
