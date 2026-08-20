/**
 * Réception d'un transfert — ONLINE ONLY (scan QR + GPS + photos exigent le réseau).
 * Le receveur scanne le QR affiché sur le téléphone du convoyeur (preuve de rencontre
 * physique) ou saisit le code 6 chiffres (mode dégradé, tracé). Conforme ou avec
 * réserves : commentaire + photos → incident auto « à qualifier » côté backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { terrainApi, type Transfert } from '@/api/terrainApi'
import { DISABLED, F, GREEN, INK, INK_SOFT, MUTED, RED, bigBtn, card, errMsg, getGps, inputStyle, label13 } from '../theme'
import { SubHeader, TrajetBlock } from '../components/ui'
import { IconCamera, IconCheck, IconFlash, IconX } from '../components/icons'

export function ReceptionTransfertScreen({ transfert, onBack, onDone, onError }: {
  transfert: Transfert
  onBack: () => void
  onDone: (t: Transfert) => void
  onError: (m: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const [cameraOk, setCameraOk] = useState<boolean | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)

  // Preuve scannée ou saisie
  const [token, setToken] = useState<string | null>(null)
  const [code, setCode] = useState('')

  // Constat
  const [avecReserves, setAvecReserves] = useState(false)
  const [commentaire, setCommentaire] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const preuveOk = token !== null || code.trim().length === 6

  const onScanned = useCallback((raw: string) => {
    setToken((prev) => prev ?? raw.trim())
  }, [])

  // ── Caméra + détection QR (pattern ScanScreen : BarcodeDetector → ZXing) ──
  useEffect(() => {
    if (token) return // preuve acquise : caméra coupée par le cleanup
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

        const track = stream.getVideoTracks()[0]
        trackRef.current = track
        const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined
        if (caps?.torch) setTorchAvailable(true)

        if (Detector) {
          const detector = new Detector({ formats: ['qr_code'] })
          timer = window.setInterval(async () => {
            if (!videoRef.current) return
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes.length > 0) onScanned(codes[0].rawValue)
            } catch { /* frame non prête */ }
          }, 500)
        } else if (videoRef.current) {
          const { BrowserQRCodeReader } = await import('@zxing/browser')
          if (cancelled) return
          const reader = new BrowserQRCodeReader()
          zxingControls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
            if (result) onScanned(result.getText())
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
  }, [token, onScanned])

  const toggleTorch = async () => {
    const track = trackRef.current
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as MediaTrackConstraintSet] })
      setTorchOn((v) => !v)
    } catch { /* torche non supportée */ }
  }

  const addPhotos = (files: FileList | null) => {
    if (!files) return
    setPhotos((prev) => [...prev, ...Array.from(files)].slice(0, 3))
  }

  const soumettre = async () => {
    if (busy || !preuveOk) return
    if (avecReserves && !commentaire.trim()) { onError('Décrivez les réserves constatées'); return }
    setBusy(true)
    try {
      const gps = await getGps()
      let urls: string[] | undefined
      if (avecReserves && photos.length > 0) {
        urls = await terrainApi.transfertReceptionPhotos(transfert.id, photos)
      }
      const t = await terrainApi.transfertReceptionner(transfert.id, {
        token: token ?? undefined,
        code: token ? undefined : code.trim(),
        avecReserves,
        commentaire: commentaire.trim() || undefined,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
        precisionMetres: gps?.precisionMetres,
        photos: urls,
      })
      onDone(t)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SubHeader titre="Réceptionner l'engin" onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: F }}>

        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>{transfert.enginCode} — {transfert.enginNom}</div>
          <TrajetBlock origine={transfert.projetOrigineNom ?? 'Dépôt / parc'} destination={transfert.projetDestinationNom} />
        </div>

        {/* Étape 1 : preuve — scan du bon ou code manuel */}
        {!token && (
          <>
            {cameraOk !== false && (
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#0F1B26', minHeight: 260 }}>
                <video ref={videoRef} playsInline muted style={{ width: '100%', height: 300, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ width: 190, height: 190, border: '3px solid rgba(255,255,255,.85)', borderRadius: 16, boxShadow: '0 0 0 2000px rgba(15,27,38,.35)' }} />
                </div>
                <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 13.5, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
                  Scannez le QR du bon présenté par le convoyeur
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
                <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Saisissez le code de réception à 6 chiffres.</div>
              </div>
            )}
            <div style={{ ...card, padding: 16 }}>
              <span style={label13}>Ou code de réception (6 chiffres)</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="000000"
                style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, fontWeight: 700, textAlign: 'center' }}
              />
            </div>
          </>
        )}
        {token && (
          <div style={{ ...card, padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: GREEN, display: 'flex' }}><IconCheck size={20} strokeWidth={2.4} /></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: INK, flex: 1 }}>QR du bon scanné — preuve enregistrée</span>
            <button onClick={() => setToken(null)} aria-label="Rescanner" style={{ appearance: 'none', border: 'none', background: 'transparent', color: MUTED, cursor: 'pointer', display: 'flex', padding: 6 }}>
              <IconX size={16} strokeWidth={2.2} />
            </button>
          </div>
        )}

        {/* Étape 2 : constat */}
        <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>État à la réception</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {([['Conforme', false], ['Avec réserves', true]] as const).map(([lbl, val]) => {
              const actif = avecReserves === val
              return (
                <button
                  key={lbl}
                  onClick={() => setAvecReserves(val)}
                  className="tk-press"
                  style={{
                    flex: 1, appearance: 'none', cursor: 'pointer', minHeight: 52, borderRadius: 12,
                    fontFamily: F, fontSize: 15, fontWeight: 700,
                    border: `1.5px solid ${actif ? (val ? RED : GREEN) : '#DDE3E9'}`,
                    background: actif ? (val ? '#FDEAEA' : '#E8F7EE') : '#fff',
                    color: actif ? (val ? RED : '#137A3D') : INK_SOFT,
                  }}
                >
                  {lbl}
                </button>
              )
            })}
          </div>

          <div>
            <label style={label13}>{avecReserves ? 'Réserves constatées (obligatoire)' : 'Observations (optionnel)'}</label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={2}
              placeholder={avecReserves ? 'Dommages, pièces manquantes, fuites…' : 'Remarques éventuelles…'}
              style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
            />
          </div>

          {avecReserves && (
            <div>
              <label style={label13}>Photos des réserves (max 3)</label>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {photos.map((p, i) => (
                  <span key={i} style={{ position: 'relative' }}>
                    <img src={URL.createObjectURL(p)} alt="" style={{ width: 76, height: 76, objectFit: 'cover', borderRadius: 10 }} />
                    <button
                      onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="Retirer"
                      style={{ position: 'absolute', top: -6, right: -6, appearance: 'none', border: 'none', cursor: 'pointer', width: 22, height: 22, borderRadius: '50%', background: '#0F1B26', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    >
                      <IconX size={12} strokeWidth={2.4} />
                    </button>
                  </span>
                ))}
                {photos.length < 3 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    aria-label="Ajouter une photo"
                    style={{ appearance: 'none', cursor: 'pointer', width: 76, height: 76, borderRadius: 10, border: '1.5px dashed #C6CFD8', background: '#fff', color: INK_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IconCamera size={24} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => void soumettre()}
            disabled={busy || !preuveOk}
            className="tk-press"
            style={bigBtn(busy || !preuveOk ? DISABLED : (avecReserves ? RED : GREEN))}
          >
            {busy ? 'Envoi…' : avecReserves ? 'Réceptionner avec réserves' : 'Confirmer la réception'}
          </button>
          {!preuveOk && (
            <div style={{ fontSize: 12.5, color: MUTED, textAlign: 'center' }}>
              Scannez le QR du bon ou saisissez le code à 6 chiffres pour continuer.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
