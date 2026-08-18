/**
 * Application mobile terrain (/terrain) — conducteurs d'engins (rôle CONDUCTEUR).
 * 4 écrans maquette : Accueil, Scan QR + fiche action, Signalement de panne, Inspection quotidienne
 * + formulaires Relevé compteur et Ravitaillement.
 * Design : usage au pouce, gants, plein soleil — cibles >= 56px, Barlow, fond #F4F6F8.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { terrainApi, type TerrainEngin } from '@/api/terrainApi'
import type {
  ChecklistItem, EtatGeneralInspection, GraviteIncident, TypeIncidentEngin,
} from '@/types/materiel'

// ============================================================
// Styles & constantes
// ============================================================
const F = 'Barlow, system-ui, sans-serif'
const FC = "'Barlow Condensed', sans-serif"
const INK = '#152230'
const MUTED = '#7A8B9A'
const BORDER = '#DFE5EB'
const BLUE = '#2563EB'
const GREEN = '#16A34A'
const RED = '#DC2626'
const AMBER = '#D97706'

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12 }
const bigBtn = (bg: string): React.CSSProperties => ({
  appearance: 'none', border: 'none', borderRadius: 14, background: bg, color: '#fff',
  minHeight: 58, padding: '14px 18px', fontFamily: F, fontSize: 17, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', cursor: 'pointer',
})
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', minHeight: 52, padding: '12px 14px', borderRadius: 10,
  border: `1.5px solid ${BORDER}`, fontFamily: F, fontSize: 16, color: INK, background: '#fff',
}
const label13: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 6, display: 'block' }

const STATUT_COLORS: Record<string, { bg: string; fg: string }> = {
  DISPONIBLE: { bg: '#E8F7EE', fg: '#137A3D' },
  EN_SERVICE: { bg: '#E7EFFD', fg: '#1D4FBF' },
  EN_PANNE: { bg: '#FDEAEA', fg: '#B91C1C' },
  MAINTENANCE: { bg: '#FDF3E2', fg: '#B45309' },
  IMMOBILISE: { bg: '#EEF1F4', fg: '#5B6B79' },
}
const statutLabel = (s: string) => s.replace(/_/g, ' ')

function StatutBadge({ statut }: { statut: string }) {
  const c = STATUT_COLORS[statut] ?? { bg: '#EEF1F4', fg: '#5B6B79' }
  return (
    <span style={{ background: c.bg, color: c.fg, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
      {statutLabel(statut)}
    </span>
  )
}

// ============================================================
// Checklist inspection (14 points)
// ============================================================
const CHECKLIST_SECTIONS: { titre: string; items: { code: string; label: string }[] }[] = [
  {
    titre: 'Moteur & fluides',
    items: [
      { code: 'HUILE_MOTEUR', label: "Niveau d'huile moteur" },
      { code: 'LIQUIDE_REFROID', label: 'Liquide de refroidissement' },
      { code: 'NIVEAU_CARBURANT', label: 'Niveau de carburant' },
      { code: 'FUITE_MOTEUR', label: 'Absence de fuite moteur' },
    ],
  },
  {
    titre: 'Circuit hydraulique',
    items: [
      { code: 'HUILE_HYDRAULIQUE', label: 'Niveau huile hydraulique' },
      { code: 'FLEXIBLES', label: 'Flexibles et raccords' },
      { code: 'VERINS', label: 'Vérins (état, fuites)' },
    ],
  },
  {
    titre: 'Châssis & train roulant',
    items: [
      { code: 'PNEUS_CHENILLES', label: 'Pneus / chenilles' },
      { code: 'GRAISSAGE', label: 'Graissage des articulations' },
      { code: 'STRUCTURE', label: 'Structure et soudures' },
    ],
  },
  {
    titre: 'Sécurité & cabine',
    items: [
      { code: 'AVERTISSEUR', label: 'Avertisseur / gyrophare' },
      { code: 'CEINTURE', label: 'Ceinture de sécurité' },
      { code: 'EXTINCTEUR', label: 'Extincteur présent' },
      { code: 'ECLAIRAGE', label: 'Éclairage de travail' },
    ],
  },
]
const TOTAL_ITEMS = CHECKLIST_SECTIONS.reduce((n, s) => n + s.items.length, 0)

// ============================================================
// Signalement — types & gravités (maquette)
// ============================================================
const TYPES_PANNE: { id: string; icon: string; label: string; backend: TypeIncidentEngin }[] = [
  { id: 'fuite', icon: '⛆', label: 'Fuite', backend: 'DEFAUT_TECHNIQUE' },
  { id: 'electrique', icon: '⚡', label: 'Électrique', backend: 'DEFAUT_TECHNIQUE' },
  { id: 'panne', icon: '⚙', label: 'Panne', backend: 'PANNE' },
  { id: 'casse', icon: '✂', label: 'Casse', backend: 'ACCIDENT' },
  { id: 'usure', icon: '◍', label: 'Usure', backend: 'USURE_PREMATUREE' },
  { id: 'autre', icon: '⊘', label: 'Autre', backend: 'AUTRE' },
]
const GRAVITES: { id: GraviteIncident; label: string; color: string }[] = [
  { id: 'MINEURE', label: 'Mineur', color: '#9CA3AF' },
  { id: 'MOYENNE', label: 'Modéré', color: BLUE },
  { id: 'MAJEURE', label: 'Majeur', color: AMBER },
  { id: 'CRITIQUE', label: 'Critique', color: RED },
]

// ============================================================
// Utilitaires
// ============================================================
const today = () => new Date().toISOString().slice(0, 10)

function getGps(): Promise<{ latitude: number; longitude: number; precisionMetres?: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        precisionMetres: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : undefined,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  })
}

function errMsg(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || err?.message || 'Une erreur est survenue'
}

type Screen = 'accueil' | 'scan' | 'engin' | 'signalement' | 'inspection' | 'releve' | 'ravitaillement'

// ============================================================
// Sous-composants partagés
// ============================================================
function SubHeader({ titre, onBack }: { titre: string; onBack: () => void }) {
  return (
    <div style={{ background: '#0F1B26', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
      <button
        onClick={onBack}
        style={{ appearance: 'none', border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', width: 44, height: 44, borderRadius: 10, fontSize: 20, cursor: 'pointer', flexShrink: 0 }}
        aria-label="Retour"
      >
        ‹
      </button>
      <div style={{ fontFamily: FC, fontSize: 21, fontWeight: 700 }}>{titre}</div>
    </div>
  )
}

function Toast({ msg, error }: { msg: string; error?: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 100,
      background: error ? RED : '#0F1B26', color: '#fff', borderRadius: 12,
      padding: '14px 16px', fontSize: 15, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,.25)', textAlign: 'center',
    }}>
      {msg}
    </div>
  )
}

function SignatureCanvas({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasInk = useRef(false)

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }
  const start = (e: React.PointerEvent) => {
    drawing.current = true
    const ctx = canvasRef.current!.getContext('2d')!
    const p = pos(e)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    canvasRef.current!.setPointerCapture(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.strokeStyle = INK
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    const p = pos(e)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    hasInk.current = true
  }
  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    if (hasInk.current) onChange(canvasRef.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = canvasRef.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    hasInk.current = false
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={Math.min(window.innerWidth - 64, 500)}
        height={110}
        style={{ width: '100%', height: 110, border: `2px dashed ${BORDER}`, borderRadius: 10, background: '#fff', touchAction: 'none' }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <button onClick={clear} style={{ appearance: 'none', border: 'none', background: 'transparent', color: MUTED, fontSize: 13, fontWeight: 600, marginTop: 4, cursor: 'pointer', padding: '8px 0', fontFamily: F }}>
        ✕ Effacer la signature
      </button>
    </div>
  )
}

// ============================================================
// Composant principal
// ============================================================
export function TerrainAppPage() {
  const user = useAppSelector((s) => s.auth.user)
  const prenom = user?.prenom || user?.nom || ''

  const [screen, setScreen] = useState<Screen>('accueil')
  const [engins, setEngins] = useState<TerrainEngin[]>([])
  const [loading, setLoading] = useState(true)
  const [engin, setEngin] = useState<TerrainEngin | null>(null)
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null)

  const showToast = useCallback((msg: string, error?: boolean) => {
    setToast({ msg, error })
    window.setTimeout(() => setToast(null), 3500)
  }, [])

  const loadEngins = useCallback(async () => {
    setLoading(true)
    try {
      setEngins(await terrainApi.mesEngins())
    } catch (e) {
      showToast(errMsg(e), true)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void loadEngins() }, [loadEngins])

  // Entrée directe par scan QR (URL /terrain?engin={id} après redirection du QR /materiel/engins/{id})
  const [searchParams, setSearchParams] = useSearchParams()
  const enginParam = searchParams.get('engin')
  useEffect(() => {
    if (!enginParam) return
    setSearchParams({}, { replace: true })
    ;(async () => {
      try {
        const e = await terrainApi.scan(`/engins/${enginParam}`)
        setEngin(e)
        setScreen('engin')
      } catch (err) {
        showToast(errMsg(err), true)
      }
    })()
  }, [enginParam, setSearchParams, showToast])

  const openEngin = (e: TerrainEngin) => { setEngin(e); setScreen('engin') }
  const backToEngin = () => setScreen(engin ? 'engin' : 'accueil')
  const refreshEngin = useCallback(async (id: number) => {
    try {
      const fresh = await terrainApi.scan(`/engins/${id}`)
      setEngin(fresh)
    } catch { /* silencieux */ }
    void loadEngins()
  }, [loadEngins])

  return (
    <div style={{ fontFamily: F, background: '#F4F6F8', minHeight: '100vh', color: INK, maxWidth: 560, margin: '0 auto' }}>
      {screen === 'accueil' && (
        <AccueilScreen
          prenom={prenom}
          engins={engins}
          loading={loading}
          onScan={() => setScreen('scan')}
          onOpenEngin={openEngin}
          onRefresh={loadEngins}
        />
      )}
      {screen === 'scan' && (
        <ScanScreen
          onBack={() => setScreen('accueil')}
          onFound={(e) => { setEngin(e); setScreen('engin') }}
          onError={(m) => showToast(m, true)}
        />
      )}
      {screen === 'engin' && engin && (
        <EnginScreen
          engin={engin}
          onBack={() => setScreen('accueil')}
          onAction={(s) => setScreen(s)}
          onConfirmPosition={async () => {
            const gps = await getGps()
            if (!gps) { showToast('Position GPS indisponible — activez la localisation', true); return }
            try {
              await terrainApi.confirmerPosition(engin.id, { ...gps })
              showToast('Position confirmée ✓')
            } catch (e) { showToast(errMsg(e), true) }
          }}
        />
      )}
      {screen === 'signalement' && engin && (
        <SignalementScreen
          engin={engin}
          onBack={backToEngin}
          onDone={() => { showToast('Incident signalé ✓'); void refreshEngin(engin.id); backToEngin() }}
          onError={(m) => showToast(m, true)}
        />
      )}
      {screen === 'inspection' && engin && (
        <InspectionScreen
          engin={engin}
          onBack={backToEngin}
          onDone={(anomalies) => {
            showToast(anomalies ? 'Inspection validée — incident créé pour les anomalies' : 'Inspection validée ✓')
            void refreshEngin(engin.id)
            backToEngin()
          }}
          onError={(m) => showToast(m, true)}
        />
      )}
      {screen === 'releve' && engin && (
        <ReleveScreen
          engin={engin}
          onBack={backToEngin}
          onDone={() => { showToast('Relevé enregistré ✓'); void refreshEngin(engin.id); backToEngin() }}
          onError={(m) => showToast(m, true)}
        />
      )}
      {screen === 'ravitaillement' && engin && (
        <RavitaillementScreen
          engin={engin}
          onBack={backToEngin}
          onDone={() => { showToast('Ravitaillement enregistré ✓'); void refreshEngin(engin.id); backToEngin() }}
          onError={(m) => showToast(m, true)}
        />
      )}
      {toast && <Toast msg={toast.msg} error={toast.error} />}
    </div>
  )
}

// ============================================================
// Écran 01 — Accueil
// ============================================================
function AccueilScreen({ prenom, engins, loading, onScan, onOpenEngin, onRefresh }: {
  prenom: string
  engins: TerrainEngin[]
  loading: boolean
  onScan: () => void
  onOpenEngin: (e: TerrainEngin) => void
  onRefresh: () => void
}) {
  const sansInspection = engins.filter((e) => !e.inspectionFaiteAujourdhui)
  const actions = [
    { icon: '⚠', label: 'Signaler une panne', color: RED },
    { icon: '◔', label: 'Relevé compteur', color: BLUE },
    { icon: '⛽', label: 'Ravitaillement', color: AMBER },
    { icon: '☑', label: 'Inspection du jour', color: GREEN },
  ]

  return (
    <div>
      <div style={{ background: '#0F1B26', color: '#fff', padding: '16px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: FC, fontWeight: 700, fontSize: 18, letterSpacing: '.14em', textTransform: 'uppercase' }}>MIKA</span>
            <span style={{ fontSize: 12, color: '#8FA3B4' }}>Terrain</span>
          </div>
          <button onClick={onRefresh} style={{ appearance: 'none', border: 'none', background: 'rgba(255,255,255,.12)', color: '#fff', width: 40, height: 40, borderRadius: 10, fontSize: 17, cursor: 'pointer' }} aria-label="Actualiser">↻</button>
        </div>
        <div style={{ fontFamily: FC, fontSize: 26, fontWeight: 700, marginTop: 12 }}>
          Bonjour{prenom ? `, ${prenom}` : ''}
        </div>
        <div style={{ fontSize: 13, color: '#9FB2C2' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div style={{ padding: '18px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Bandeau alerte inspection */}
        {!loading && sansInspection.length > 0 && (
          <div style={{ background: '#FDEAEA', border: '1px solid #F0B7B7', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20, color: RED }}>⚠</span>
            <div style={{ fontSize: 13.5, color: '#8A1F1F', lineHeight: 1.4 }}>
              <strong>{sansInspection.length} engin{sansInspection.length > 1 ? 's' : ''}</strong> sans inspection aujourd'hui : {sansInspection.slice(0, 3).map((e) => e.code).join(', ')}{sansInspection.length > 3 ? '…' : ''}
            </div>
          </div>
        )}

        {/* Gros bouton scanner */}
        <button
          onClick={onScan}
          style={{ ...bigBtn(BLUE), padding: '24px 20px', borderRadius: 14, justifyContent: 'flex-start', gap: 16, boxShadow: '0 6px 16px rgba(37,99,235,.28)' }}
        >
          <span style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>▣</span>
          <span style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: 21, fontWeight: 700 }}>Scanner un QR</span>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 400, color: 'rgba(255,255,255,.8)', marginTop: 2 }}>Identifier un engin sur le chantier</span>
          </span>
        </button>

        {/* Actions rapides */}
        <div>
          <div style={{ fontFamily: FC, fontSize: 17, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#41546A', marginBottom: 10 }}>Actions rapides</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={onScan}
                style={{ ...card, appearance: 'none', minHeight: 76, padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 6, cursor: 'pointer', fontFamily: F }}
              >
                <span style={{ fontSize: 22, color: a.color }}>{a.icon}</span>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: INK }}>{a.label}</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>Chaque action commence par scanner ou choisir un engin.</div>
        </div>

        {/* Mes équipements */}
        <div>
          <div style={{ fontFamily: FC, fontSize: 17, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#41546A', marginBottom: 10 }}>Mes équipements</div>
          {loading && <div style={{ ...card, padding: 18, textAlign: 'center', color: MUTED, fontSize: 14 }}>Chargement…</div>}
          {!loading && engins.length === 0 && (
            <div style={{ ...card, padding: 18, textAlign: 'center', color: MUTED, fontSize: 14 }}>Aucun engin affecté à un chantier en cours.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {engins.map((e) => (
              <button
                key={e.id}
                onClick={() => onOpenEngin(e)}
                style={{ ...card, appearance: 'none', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', fontFamily: F, display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: INK }}>{e.nom}</span>
                  <StatutBadge statut={e.statut} />
                </div>
                <div style={{ fontSize: 13, color: MUTED }}>
                  {e.code}{e.chantierNom ? ` · ${e.chantierNom}` : ''} · {e.heuresCompteur} h
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: e.inspectionFaiteAujourdhui ? '#137A3D' : RED }}>
                  {e.inspectionFaiteAujourdhui ? '☑ Inspection du jour faite' : '⚠ Inspection du jour à faire'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Écran 02a — Scan QR
// ============================================================
function ScanScreen({ onBack, onFound, onError }: {
  onBack: () => void
  onFound: (e: TerrainEngin) => void
  onError: (m: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraOk, setCameraOk] = useState<boolean | null>(null)
  const [manuel, setManuel] = useState('')
  const [busy, setBusy] = useState(false)
  const resolvedRef = useRef(false)

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
        if (Detector) {
          const detector = new Detector({ formats: ['qr_code'] })
          timer = window.setInterval(async () => {
            if (!videoRef.current || resolvedRef.current) return
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes.length > 0) void resolve(codes[0].rawValue)
            } catch { /* frame non prête */ }
          }, 500)
        }
      } catch {
        setCameraOk(false)
      }
    }
    void startCamera()

    return () => {
      cancelled = true
      if (timer) window.clearInterval(timer)
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

// ============================================================
// Écran 02b — Fiche engin après scan
// ============================================================
function EnginScreen({ engin, onBack, onAction, onConfirmPosition }: {
  engin: TerrainEngin
  onBack: () => void
  onAction: (s: Screen) => void
  onConfirmPosition: () => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const tiles = [
    { label: 'Chantier', value: engin.chantierNom ?? '—' },
    { label: 'Compteur', value: `${engin.heuresCompteur} h` },
    { label: 'Inspection', value: engin.inspectionFaiteAujourdhui ? 'Faite ✓' : 'À faire', danger: !engin.inspectionFaiteAujourdhui },
    { label: 'Dernier plein', value: engin.dernierPlein ? new Date(engin.dernierPlein).toLocaleDateString('fr-FR') : '—' },
  ]

  return (
    <div>
      <SubHeader titre={engin.code} onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Bandeau identité + statut */}
        <div style={{ ...card, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <div>
              <div style={{ fontFamily: FC, fontSize: 22, fontWeight: 700 }}>{engin.nom}</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
                {[engin.marque, engin.modele].filter(Boolean).join(' ') || engin.type}
              </div>
            </div>
            <StatutBadge statut={engin.statut} />
          </div>
        </div>

        {/* 4 tuiles infos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {tiles.map((t) => (
            <div key={t.label} style={{ ...card, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{t.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: t.danger ? RED : INK }}>{t.value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={async () => { setConfirming(true); await onConfirmPosition(); setConfirming(false) }}
          disabled={confirming}
          style={{ ...bigBtn(BLUE), opacity: confirming ? 0.6 : 1 }}
        >
          ◎ {confirming ? 'Localisation en cours…' : 'Confirmer ma position'}
        </button>
        <button onClick={() => onAction('inspection')} style={bigBtn(GREEN)}>
          ☑ Inspection quotidienne
        </button>
        <button onClick={() => onAction('releve')} style={{ ...bigBtn('#fff'), color: INK, border: `1.5px solid ${BORDER}` }}>
          ◔ Relevé compteur
        </button>
        <button onClick={() => onAction('ravitaillement')} style={{ ...bigBtn('#fff'), color: INK, border: `1.5px solid ${BORDER}` }}>
          ⛽ Ravitaillement
        </button>
        <button onClick={() => onAction('signalement')} style={{ ...bigBtn('#FEF3F3'), color: RED, border: '1.5px solid #F0B7B7' }}>
          ⚠ Signaler un problème
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Écran 03 — Signalement de panne
// ============================================================
function SignalementScreen({ engin, onBack, onDone, onError }: {
  engin: TerrainEngin
  onBack: () => void
  onDone: () => void
  onError: (m: string) => void
}) {
  const [type, setType] = useState<string | null>(null)
  const [gravite, setGravite] = useState<GraviteIncident | null>(null)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const t = TYPES_PANNE.find((x) => x.id === type)
    if (!t || !gravite) return
    setBusy(true)
    const gps = await getGps()
    try {
      await terrainApi.signalerIncident(engin.id, {
        typeIncident: t.backend,
        gravite,
        dateIncident: today(),
        description: `[${t.label}] ${description}`.trim(),
        lieu: gps ? `GPS ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}` : engin.chantierNom ?? undefined,
      })
      onDone()
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SubHeader titre={`Signalement — ${engin.code}`} onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Type de problème */}
        <div>
          <span style={label13}>Type de problème</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {TYPES_PANNE.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                style={{
                  ...card, appearance: 'none', minHeight: 58, padding: '10px 14px', cursor: 'pointer', fontFamily: F,
                  display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 700, color: INK,
                  borderColor: type === t.id ? RED : BORDER,
                  borderWidth: 2, borderStyle: 'solid',
                  background: type === t.id ? '#FEF3F3' : '#fff',
                }}
              >
                <span style={{ fontSize: 20 }}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gravité */}
        <div>
          <span style={label13}>Gravité</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {GRAVITES.map((g) => (
              <button
                key={g.id}
                onClick={() => setGravite(g.id)}
                style={{
                  appearance: 'none', minHeight: 62, borderRadius: 12, cursor: 'pointer', fontFamily: F,
                  fontSize: 13.5, fontWeight: 700, padding: '8px 4px',
                  border: `2px solid ${gravite === g.id ? g.color : BORDER}`,
                  background: gravite === g.id ? g.color : '#fff',
                  color: gravite === g.id ? '#fff' : INK,
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
          {(gravite === 'MAJEURE' || gravite === 'CRITIQUE') && (
            <div style={{ fontSize: 12.5, color: RED, fontWeight: 600, marginTop: 6 }}>
              ⚠ L'engin passera automatiquement en statut EN PANNE.
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <span style={label13}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le problème constaté…"
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
          />
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>Votre position GPS sera jointe automatiquement au signalement.</div>
        </div>

        <button
          onClick={() => void submit()}
          disabled={busy || !type || !gravite}
          style={{ ...bigBtn(RED), opacity: busy || !type || !gravite ? 0.5 : 1 }}
        >
          {busy ? 'Envoi en cours…' : '⚠ Envoyer le signalement'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Écran 04 — Inspection quotidienne
// ============================================================
function InspectionScreen({ engin, onBack, onDone, onError }: {
  engin: TerrainEngin
  onBack: () => void
  onDone: (anomalies: boolean) => void
  onError: (m: string) => void
}) {
  // état par code : undefined = non répondu, true = OK, false = NOK
  const [reponses, setReponses] = useState<Record<string, boolean | undefined>>({})
  const [commentaires, setCommentaires] = useState<Record<string, string>>({})
  const [compteur, setCompteur] = useState(String(engin.heuresCompteur))
  const [commentaire, setCommentaire] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const answered = Object.values(reponses).filter((v) => v !== undefined).length
  const nokCount = Object.values(reponses).filter((v) => v === false).length
  const complete = answered === TOTAL_ITEMS

  const etatGeneral: EtatGeneralInspection = nokCount === 0 ? 'BON' : nokCount <= 2 ? 'CORRECT' : 'MAUVAIS'

  const submit = async () => {
    if (!complete) return
    setBusy(true)
    const checklist: ChecklistItem[] = CHECKLIST_SECTIONS.flatMap((s) =>
      s.items.map((it) => ({
        code: it.code,
        label: it.label,
        ok: reponses[it.code] === true,
        commentaire: reponses[it.code] === false ? commentaires[it.code]?.trim() || undefined : undefined,
      })),
    )
    try {
      await terrainApi.creerInspection(engin.id, {
        dateInspection: today(),
        compteurHeures: compteur.trim() ? Number(compteur) : undefined,
        checklist,
        etatGeneral,
        commentaire: commentaire.trim() || undefined,
        signature: signature ?? undefined,
      })
      onDone(nokCount > 0)
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SubHeader titre={`Inspection — ${engin.code}`} onBack={onBack} />

      {/* Barre progression sticky */}
      <div style={{ position: 'sticky', top: 68, zIndex: 9, background: '#F4F6F8', padding: '10px 16px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
          <span>Progression</span>
          <span style={{ color: complete ? '#137A3D' : INK }}>{answered}/{TOTAL_ITEMS}</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: '#E3E9EF', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(answered / TOTAL_ITEMS) * 100}%`, background: nokCount > 0 ? AMBER : GREEN, transition: 'width .2s' }} />
        </div>
      </div>

      <div style={{ padding: '10px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CHECKLIST_SECTIONS.map((section) => (
          <div key={section.titre} style={{ ...card, padding: 14 }}>
            <div style={{ fontFamily: FC, fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#41546A', marginBottom: 10 }}>
              {section.titre}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items.map((it) => {
                const val = reponses[it.code]
                return (
                  <div key={it.code}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{it.label}</span>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setReponses((r) => ({ ...r, [it.code]: true }))}
                          style={{
                            appearance: 'none', width: 58, height: 38, borderRadius: 9, cursor: 'pointer', fontFamily: F, fontWeight: 700, fontSize: 13.5,
                            border: `2px solid ${val === true ? GREEN : BORDER}`,
                            background: val === true ? GREEN : '#fff', color: val === true ? '#fff' : INK,
                          }}
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setReponses((r) => ({ ...r, [it.code]: false }))}
                          style={{
                            appearance: 'none', width: 58, height: 38, borderRadius: 9, cursor: 'pointer', fontFamily: F, fontWeight: 700, fontSize: 13.5,
                            border: `2px solid ${val === false ? RED : BORDER}`,
                            background: val === false ? RED : '#fff', color: val === false ? '#fff' : INK,
                          }}
                        >
                          NOK
                        </button>
                      </div>
                    </div>
                    {val === false && (
                      <input
                        value={commentaires[it.code] ?? ''}
                        onChange={(e) => setCommentaires((c) => ({ ...c, [it.code]: e.target.value }))}
                        placeholder="Préciser l'anomalie…"
                        style={{ ...inputStyle, minHeight: 44, marginTop: 8, borderColor: '#F0B7B7', background: '#FEF9F9' }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Compteur + commentaire */}
        <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <span style={label13}>Compteur horaire (h)</span>
            <input type="number" inputMode="numeric" value={compteur} onChange={(e) => setCompteur(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <span style={label13}>Commentaire général (optionnel)</span>
            <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {/* Signature */}
        <div style={{ ...card, padding: 14 }}>
          <span style={label13}>Signature du conducteur</span>
          <SignatureCanvas onChange={setSignature} />
        </div>

        {nokCount > 0 && (
          <div style={{ background: '#FDF3E2', border: '1px solid #F0DCB0', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#8A5A0B', lineHeight: 1.4 }}>
            {nokCount} point{nokCount > 1 ? 's' : ''} NOK — un incident sera créé automatiquement pour les anomalies détectées.
          </div>
        )}

        <button
          onClick={() => void submit()}
          disabled={busy || !complete}
          style={{ ...bigBtn(GREEN), opacity: busy || !complete ? 0.5 : 1 }}
        >
          {busy ? 'Enregistrement…' : complete ? "☑ Valider l'inspection" : `Répondre aux ${TOTAL_ITEMS - answered} points restants`}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Formulaire — Relevé compteur
// ============================================================
function ReleveScreen({ engin, onBack, onDone, onError }: {
  engin: TerrainEngin
  onBack: () => void
  onDone: () => void
  onError: (m: string) => void
}) {
  const [valeur, setValeur] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [busy, setBusy] = useState(false)
  const valNum = Number(valeur)
  const valide = valeur.trim() !== '' && !Number.isNaN(valNum) && valNum >= 0

  const submit = async () => {
    setBusy(true)
    try {
      await terrainApi.creerReleve(engin.id, {
        dateReleve: today(),
        valeurHeures: valNum,
        commentaire: commentaire.trim() || undefined,
      })
      onDone()
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SubHeader titre={`Relevé compteur — ${engin.code}`} onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 13, color: MUTED }}>Dernier compteur connu</div>
          <div style={{ fontFamily: FC, fontSize: 30, fontWeight: 700 }}>{engin.heuresCompteur} h</div>
        </div>
        <div>
          <span style={label13}>Nouvelle valeur (heures)</span>
          <input
            type="number" inputMode="numeric" value={valeur} onChange={(e) => setValeur(e.target.value)}
            placeholder={`≥ ${engin.heuresCompteur}`} autoFocus
            style={{ ...inputStyle, fontSize: 22, fontWeight: 700, minHeight: 60 }}
          />
          {valide && valNum < engin.heuresCompteur && (
            <div style={{ fontSize: 12.5, color: AMBER, fontWeight: 600, marginTop: 4 }}>⚠ Valeur inférieure au compteur actuel.</div>
          )}
        </div>
        <div>
          <span style={label13}>Commentaire (optionnel)</span>
          <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={() => void submit()} disabled={busy || !valide} style={{ ...bigBtn(BLUE), opacity: busy || !valide ? 0.5 : 1 }}>
          {busy ? 'Enregistrement…' : '◔ Enregistrer le relevé'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Formulaire — Ravitaillement
// ============================================================
function RavitaillementScreen({ engin, onBack, onDone, onError }: {
  engin: TerrainEngin
  onBack: () => void
  onDone: () => void
  onError: (m: string) => void
}) {
  const [litres, setLitres] = useState('')
  const [compteur, setCompteur] = useState(String(engin.heuresCompteur))
  const [commentaire, setCommentaire] = useState('')
  const [busy, setBusy] = useState(false)
  const litresNum = Number(litres)
  const valide = litres.trim() !== '' && !Number.isNaN(litresNum) && litresNum > 0

  const submit = async () => {
    setBusy(true)
    try {
      await terrainApi.creerRavitaillement(engin.id, {
        datePlein: today(),
        quantiteLitres: litresNum,
        heuresCompteurAuPlein: compteur.trim() ? Number(compteur) : undefined,
        commentaire: commentaire.trim() || undefined,
      })
      onDone()
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <SubHeader titre={`Ravitaillement — ${engin.code}`} onBack={onBack} />
      <div style={{ padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {engin.dernierPlein && (
          <div style={{ ...card, padding: 16 }}>
            <div style={{ fontSize: 13, color: MUTED }}>Dernier plein</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{new Date(engin.dernierPlein).toLocaleDateString('fr-FR')}</div>
          </div>
        )}
        <div>
          <span style={label13}>Quantité (litres)</span>
          <input
            type="number" inputMode="decimal" value={litres} onChange={(e) => setLitres(e.target.value)}
            placeholder="0" autoFocus
            style={{ ...inputStyle, fontSize: 22, fontWeight: 700, minHeight: 60 }}
          />
        </div>
        <div>
          <span style={label13}>Compteur au plein (h)</span>
          <input type="number" inputMode="numeric" value={compteur} onChange={(e) => setCompteur(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <span style={label13}>Commentaire (optionnel)</span>
          <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={() => void submit()} disabled={busy || !valide} style={{ ...bigBtn(AMBER), opacity: busy || !valide ? 0.5 : 1 }}>
          {busy ? 'Enregistrement…' : '⛽ Enregistrer le plein'}
        </button>
      </div>
    </div>
  )
}
