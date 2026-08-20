import { useCallback, useEffect, useRef, useState } from 'react'
import { terrainApi, type TerrainEngin } from '@/api/terrainApi'
import { BLUE, MUTED, bigBtn, card, errMsg, inputStyle, label13 } from '../theme'
import { SubHeader } from '../components/ui'
import { IconFlash } from '../components/icons'

export function ScanScreen({ onBack, onFound, onError }: {
  onBack: () => void
  onFound: (e: TerrainEngin) => void
  onError: (m: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraOk, setCameraOk] = useState<boolean | null>(null)
  const [manuel, setManuel] = useState('')
  const [busy, setBusy] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const resolvedRef = useRef(false)

  const toggleTorch = async () => {
    const track = trackRef.current
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] })
      setTorchOn((v) => !v)
    } catch { /* torche non supportée */ }
  }

  const resolve = useCallback(async (q: string) => {
    if (resolvedRef.current || !q.trim()) return
    resolvedRef.current = true
    setBusy(true)
    try {
      onFound(await terrainApi.scan(q.trim()))
    } catch (e) {
      resolvedRef.current = false
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }, [onFound, onError])

  useEffect(() => {
    let stream: MediaStream | null = null
    let timer: number | null = null
    let cancelled = false
    let zxingControls: { stop: () => void } | null = null

    const Detector = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) { setCameraOk(false); return }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setCameraOk(true)

        // Détection torche
        const track = stream.getVideoTracks()[0]
        trackRef.current = track
        const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
        if (caps?.torch) setTorchAvailable(true)

        if (Detector) {
          // API native (Chrome/Android)
          const detector = new Detector({ formats: ['qr_code'] })
          timer = window.setInterval(async () => {
            if (!videoRef.current || resolvedRef.current) return
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes.length > 0) void resolve(codes[0].rawValue)
            } catch { /* frame non prête */ }
          }, 500)
        } else if (videoRef.current) {
          // Fallback ZXing (Safari/iOS, desktop)
          const { BrowserQRCodeReader } = await import('@zxing/browser')
          if (cancelled) return
          const reader = new BrowserQRCodeReader()
          zxingControls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
            if (result && !resolvedRef.current) void resolve(result.getText())
          })
        }
      } catch {
        setCameraOk(false)
      }
    }
    void startCamera()

    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
      zxingControls?.stop()
      trackRef.current = null
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [resolve])

  return (
    <div>
      <SubHeader titre="Scanner un engin" onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {cameraOk !== false && (
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#0F1B26', minHeight: 280 }}>
            <video ref={videoRef} playsInline muted style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }} />
            {/* Cadre de visée */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: 200, height: 200, border: '3px solid rgba(255,255,255,.85)', borderRadius: 16, boxShadow: '0 0 0 2000px rgba(15,27,38,.35)' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 13.5, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
              Visez le QR code collé sur l'engin
            </div>
            {torchAvailable && (
              <button
                onClick={() => void toggleTorch()}
                aria-label="Torche"
                style={{
                  position: 'absolute', top: 12, right: 12, appearance: 'none', border: 'none', cursor: 'pointer',
                  width: 46, height: 46, borderRadius: 12,
                  background: torchOn ? '#fff' : 'rgba(255,255,255,.18)', color: torchOn ? '#0F1B26' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconFlash size={22} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
        {cameraOk === false && (
          <div style={{ ...card, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Caméra indisponible</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Autorisez la caméra ou saisissez le code de l'engin ci-dessous.</div>
          </div>
        )}

        {/* Saisie manuelle */}
        <div style={{ ...card, padding: 16 }}>
          <span style={label13}>Ou saisir le code engin</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={manuel}
              onChange={(e) => setManuel(e.target.value)}
              placeholder="ENG-2026-001"
              autoCapitalize="characters"
              style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' }}
              onKeyDown={(e) => { if (e.key === 'Enter') void resolve(manuel) }}
            />
            <button
              onClick={() => void resolve(manuel)}
              disabled={busy || !manuel.trim()}
              style={{ ...bigBtn(BLUE), width: 'auto', minWidth: 92, opacity: busy || !manuel.trim() ? 0.5 : 1 }}
            >
              {busy ? '…' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
