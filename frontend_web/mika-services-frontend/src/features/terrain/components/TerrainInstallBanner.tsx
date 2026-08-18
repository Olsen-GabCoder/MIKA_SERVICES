/**
 * Bannière d'installation PWA pour l'application terrain (/terrain).
 * - Android / Chrome : capte `beforeinstallprompt` → bouton "Installer" natif.
 * - iOS Safari : guide "Partager → Sur l'écran d'accueil" (pas d'installation programmatique possible).
 * - Masquée si l'app tourne déjà en mode standalone ou si l'utilisateur l'a refusée (< 7 jours).
 * Charte terrain : Barlow, cartes blanches bord #DFE5EB radius 12, accent orange #FF6B35, cibles >= 52px.
 */
import { useCallback, useEffect, useState } from 'react'

const F = 'Barlow, system-ui, sans-serif'
const INK = '#152230'
const MUTED = '#7A8B9A'
const BORDER = '#DFE5EB'
const ORANGE = '#FF6B35'

const DISMISS_KEY = 'terrain-install-dismissed-at'
const DISMISS_DAYS = 7

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const recentlyDismissed = () => {
  const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
  return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

export function TerrainInstallBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return

    if (isIos()) {
      setVisible(true)
      return
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => setVisible(false)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setVisible(false)
  }, [])

  const install = useCallback(async () => {
    if (!installEvent) {
      setShowIosGuide(true)
      return
    }
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    } else {
      dismiss()
    }
  }, [installEvent, dismiss])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Installer l'application MIKA Terrain"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        padding: '0 12px calc(12px + env(safe-area-inset-bottom))',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto', width: '100%', maxWidth: 536,
          background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 14,
          boxShadow: '0 8px 28px rgba(21,34,48,.18)', fontFamily: F, overflow: 'hidden',
        }}
      >
        {/* Liseré charte orange */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${ORANGE}, #1E4D8C)` }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <img
            src="/pwa-192x192.png"
            alt=""
            width={44}
            height={44}
            style={{ borderRadius: 10, border: `1px solid ${BORDER}`, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>MIKA Terrain</div>
            <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.35 }}>
              Installez l'application sur votre écran d'accueil pour un accès direct.
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fermer"
            style={{
              appearance: 'none', background: 'none', border: 'none', cursor: 'pointer',
              color: MUTED, fontSize: 20, lineHeight: 1, padding: 8, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {showIosGuide ? (
          <div style={{ padding: '0 14px 14px' }}>
            <div
              style={{
                background: '#F4F6F8', border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: '10px 12px', fontSize: 13, color: INK, lineHeight: 1.5,
              }}
            >
              Sur iPhone / iPad : touchez <strong>Partager</strong> (carré avec flèche ↑) dans Safari,
              puis <strong>« Sur l'écran d'accueil »</strong>.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, padding: '0 14px 14px' }}>
            <button
              type="button"
              onClick={dismiss}
              style={{
                appearance: 'none', flex: 1, minHeight: 48, borderRadius: 10, cursor: 'pointer',
                background: '#fff', border: `1.5px solid ${BORDER}`, color: MUTED,
                fontFamily: F, fontSize: 15, fontWeight: 600,
              }}
            >
              Plus tard
            </button>
            <button
              type="button"
              onClick={install}
              style={{
                appearance: 'none', flex: 2, minHeight: 48, borderRadius: 10, cursor: 'pointer',
                background: ORANGE, border: 'none', color: '#fff',
                fontFamily: F, fontSize: 15, fontWeight: 700,
              }}
            >
              Installer l'application
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
