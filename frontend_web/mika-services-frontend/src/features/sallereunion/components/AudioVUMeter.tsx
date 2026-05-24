import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface AudioVUMeterProps {
  level: number   // 0-1 normalise depuis useAudioLevel
  muted: boolean
}

const BAR_COUNT = 8
const BAR_WIDTH = 6
const BAR_GAP = 5
const BAR_MAX_H = 48
const BAR_MIN_H = 6

// Couleurs par barre (convention VU-metre pro)
// 1-2: vert tamise, 3-6: vert plein (zone optimale), 7-8: jaune->orange (saturation)
const BAR_COLORS = [
  '#48B5A066', '#48B5A066',
  '#48B5A0', '#48B5A0', '#48B5A0', '#48B5A0',
  '#F59E0B', '#FF6B35',
]
const BAR_INACTIVE = 'rgba(150,150,150,0.15)'

// La voix humaine normale donne un level ~0.02-0.08 via getByteFrequencyData.
// On applique un boost non-lineaire pour que la plage utile (0-0.15) remplisse 0-100%.
function boostLevel(raw: number): number {
  const clamped = Math.min(raw / 0.15, 1)
  return Math.pow(clamped, 0.6) // courbe concave = reactive aux faibles niveaux
}

// Seuil pour considerer le micro "teste" (level brut > 0.02 pendant 1.5s cumulees)
const TEST_THRESHOLD = 0.02
const TEST_DURATION_MS = 1500

export function AudioVUMeter({ level, muted }: AudioVUMeterProps) {
  const { t } = useTranslation('salleReunion')
  const [tested, setTested] = useState(false)
  const [showTestedMsg, setShowTestedMsg] = useState(false)
  const aboveTimeRef = useRef(0)
  const lastTickRef = useRef(0)

  // Detecter quand le micro a ete teste
  useEffect(() => {
    if (tested || muted) return
    const now = Date.now()
    if (level >= TEST_THRESHOLD) {
      if (lastTickRef.current > 0) {
        aboveTimeRef.current += now - lastTickRef.current
      }
      if (aboveTimeRef.current >= TEST_DURATION_MS) {
        setTested(true)
        setShowTestedMsg(true)
        setTimeout(() => setShowTestedMsg(false), 2000)
      }
    }
    lastTickRef.current = now
  }, [level, muted, tested])

  const boosted = muted ? 0 : boostLevel(level)
  const activeBars = Math.round(boosted * BAR_COUNT)

  // Hint contextuel
  let hint: string | null = null
  if (showTestedMsg) {
    hint = t('lobby.microTested', { defaultValue: 'Micro OK' })
  } else if (!tested) {
    hint = muted
      ? t('lobby.microMutedHint', { defaultValue: 'Activez le micro pour tester' })
      : t('lobby.microTestHint', { defaultValue: 'Parlez pour verifier le micro' })
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-end rounded-xl px-3 py-2.5 bg-neutral-100/60 dark:bg-white/[0.03] border border-neutral-200/50 dark:border-white/[0.06]"
        style={{ gap: BAR_GAP, height: BAR_MAX_H + 20 }}
      >
        {muted && (
          <svg className="w-4 h-4 text-neutral-400 dark:text-white/30 mr-1 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" />
          </svg>
        )}
        {Array.from({ length: BAR_COUNT }, (_, i) => {
          const isActive = i < activeBars
          const height = isActive
            ? Math.max(BAR_MIN_H, ((i + 1) / BAR_COUNT) * BAR_MAX_H)
            : BAR_MIN_H
          return (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: BAR_WIDTH,
                height,
                backgroundColor: isActive ? BAR_COLORS[i] : BAR_INACTIVE,
              }}
            />
          )
        })}
      </div>
      {hint && (
        <span className={'text-[11px] font-medium transition-colors duration-300 ' + (showTestedMsg ? 'text-[#48B5A0]' : 'text-neutral-400 dark:text-white/40')}>
          {hint}
        </span>
      )}
    </div>
  )
}
