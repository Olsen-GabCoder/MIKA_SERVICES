/**
 * Onboarding premiere connexion — 3 slides (bienvenue, scan, push).
 * Affiche une seule fois (flag localStorage). Le slide push declenche
 * la permission push UNIQUEMENT sur clic "Activer" (jamais auto).
 */
import { useState } from 'react'
import { F, FC, INK, MUTED, ORANGE, BG, BORDER } from '../theme'
import { IconScan, IconBell, IconCheck } from '../components/icons'
import { pushSupported, pushPermissionStatus } from '@/config/firebase'
import { activatePush, markPushAsked } from '../push'

const ONBOARDED_PREFIX = 'mika-terrain-onboarded-'

export function hasSeenOnboarding(userId: number | string | undefined): boolean {
  if (!userId) return false
  try { return localStorage.getItem(`${ONBOARDED_PREFIX}${userId}`) === 'true' } catch { return false }
}

function markOnboarded(userId: number | string | undefined): void {
  if (!userId) return
  try { localStorage.setItem(`${ONBOARDED_PREFIX}${userId}`, 'true') } catch {}
}

export function OnboardingScreen({ prenom, role, userId, onDone }: {
  prenom: string
  userId: number | string | undefined
  role: string
  onDone: () => void
}) {
  const [step, setStep] = useState(0)
  const [pushResult, setPushResult] = useState<'idle' | 'activating' | 'done' | 'skipped'>('idle')

  const showPushSlide = pushSupported() && pushPermissionStatus() === 'default'
  const totalSlides = showPushSlide ? 3 : 2

  const finish = () => {
    markOnboarded(userId)
    markPushAsked()
    onDone()
  }

  const next = () => {
    if (step < totalSlides - 1) setStep(step + 1)
    else finish()
  }

  const handleActivatePush = async () => {
    setPushResult('activating')
    const ok = await activatePush()
    setPushResult(ok ? 'done' : 'skipped')
    setTimeout(finish, 800)
  }

  const slides = [
    // Slide 1 : Bienvenue
    {
      icon: <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FFF0E8', color: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, fontFamily: FC }}>{prenom.charAt(0).toUpperCase()}</div>,
      title: `Bienvenue ${prenom}`,
      subtitle: `Vous etes connecte en tant que ${role}.`,
      description: 'Votre espace terrain est pret. Engins, demandes de materiel et transferts sont accessibles en un geste.',
    },
    // Slide 2 : Scan
    {
      icon: <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FFF0E8', color: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconScan size={36} strokeWidth={1.8} /></div>,
      title: 'Scannez pour commencer',
      subtitle: 'Scannez le QR code de votre engin pour acceder a sa fiche.',
      description: 'Inspection, releve compteur, signalement — tout demarre par un scan.',
    },
  ]

  // Slide 3 : Push (conditionnel)
  if (showPushSlide) {
    slides.push({
      icon: <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#FFF0E8', color: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBell size={36} strokeWidth={1.8} /></div>,
      title: 'Restez informe',
      subtitle: 'Transferts, DMA et incidents en temps reel.',
      description: 'Activez les notifications pour ne rien manquer sur vos chantiers.',
    })
  }

  const slide = slides[step]
  const isPushSlide = showPushSlide && step === totalSlides - 1

  return (
    <div style={{
      minHeight: '100dvh', background: BG, fontFamily: F,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      {/* Skip */}
      <button
        onClick={finish}
        style={{
          position: 'absolute', top: 16, right: 16,
          appearance: 'none', border: 'none', background: 'transparent',
          color: MUTED, fontSize: 14, fontWeight: 600, fontFamily: F, cursor: 'pointer',
        }}
      >
        Passer
      </button>

      {/* Contenu */}
      <div style={{ animation: 'tkIn .2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 340 }}>
        {slide.icon}
        <h1 style={{ fontFamily: FC, fontSize: 26, fontWeight: 700, color: INK, margin: 0 }}>{slide.title}</h1>
        <p style={{ fontSize: 15, fontWeight: 600, color: INK, margin: 0, lineHeight: 1.4 }}>{slide.subtitle}</p>
        <p style={{ fontSize: 13.5, color: MUTED, margin: 0, lineHeight: 1.5 }}>{slide.description}</p>
      </div>

      {/* Pagination dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 40 }}>
        {Array.from({ length: totalSlides }, (_, i) => (
          <span key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i === step ? ORANGE : BORDER,
            transition: 'all .2s',
          }} />
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 32, width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isPushSlide ? (
          <>
            {pushResult === 'done' ? (
              <button disabled style={{ ...ctaStyle, background: '#16A34A' }}>
                <IconCheck size={20} strokeWidth={2.2} /> Notifications activees
              </button>
            ) : (
              <button
                onClick={() => void handleActivatePush()}
                disabled={pushResult === 'activating'}
                className="tk-press"
                style={ctaStyle}
              >
                {pushResult === 'activating' ? 'Activation...' : 'Activer les notifications'}
              </button>
            )}
            {pushResult === 'idle' && (
              <button onClick={finish} style={secondaryStyle}>
                Plus tard
              </button>
            )}
          </>
        ) : (
          <button onClick={next} className="tk-press" style={ctaStyle}>
            {step === totalSlides - 1 ? 'Commencer' : 'Continuer'}
          </button>
        )}
      </div>
    </div>
  )
}

const ctaStyle: React.CSSProperties = {
  appearance: 'none', border: 'none', borderRadius: 14, background: '#FF6B35', color: '#fff',
  minHeight: 56, padding: '14px 24px', fontFamily: "'Barlow', system-ui, sans-serif",
  fontSize: 17, fontWeight: 700, cursor: 'pointer', width: '100%',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
}

const secondaryStyle: React.CSSProperties = {
  appearance: 'none', border: 'none', borderRadius: 14, background: 'transparent', color: '#7A8B9A',
  minHeight: 48, padding: '12px 24px', fontFamily: "'Barlow', system-ui, sans-serif",
  fontSize: 15, fontWeight: 600, cursor: 'pointer', width: '100%',
}
