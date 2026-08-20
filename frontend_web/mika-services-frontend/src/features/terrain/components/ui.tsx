/**
 * Composants UI partagés de l'app terrain — premium, zéro emoji.
 */
import { useEffect, useRef, useState } from 'react'
import {
  BORDER, DMA_STATUT_COLORS, DMA_STATUT_LABELS, F, FC, HAIRLINE, HEADER_DARK,
  INK, INK_SOFT, MUTED, ORANGE, RED, STATUT_COLORS,
  TRANSFERT_STATUT_COLORS, TRANSFERT_STATUT_LABELS, selectStyle, statutLabel,
} from '../theme'
import { IconCheck, IconChevronLeft, IconSearch, IconTransfer, IconX } from './icons'
import apiClient from '@/api/axios'

// ── Images nécessitant le JWT (photos legacy servies par l'API) ─
// Une balise <img> n'envoie pas le header Authorization : les URLs `/api/...`
// sont chargées en blob authentifié via axios, avec cache mémoire (objectURL).
const authImgCache = new Map<string, string>()
const authImgInflight = new Map<string, Promise<string | null>>()

function loadAuthImage(path: string): Promise<string | null> {
  const cached = authImgCache.get(path)
  if (cached) return Promise.resolve(cached)
  let p = authImgInflight.get(path)
  if (!p) {
    // baseURL axios = '/api' : retirer le préfixe de l'URL relative renvoyée par le backend
    p = apiClient.get(path.replace(/^\/api/, ''), { responseType: 'blob' })
      .then((r) => {
        const blob = r.data as Blob
        if (!blob || blob.size === 0) return null // 204 : pas de photo
        const url = URL.createObjectURL(blob)
        authImgCache.set(path, url)
        return url
      })
      .catch(() => null)
      .finally(() => { authImgInflight.delete(path) })
    authImgInflight.set(path, p)
  }
  return p
}

/** Image d'engin : URL http(s) directe (Cloudinary) ou blob authentifié (legacy `/api/...`). */
export function AuthImg({ src, alt, imgStyle, fallback }: {
  src: string
  alt: string
  imgStyle: React.CSSProperties
  fallback: React.ReactNode
}) {
  const direct = /^https?:\/\//.test(src)
  const [url, setUrl] = useState<string | null>(direct ? src : authImgCache.get(src) ?? null)
  useEffect(() => {
    if (!src) { setUrl(null); return }
    if (direct) { setUrl(src); return }
    let alive = true
    void loadAuthImage(src).then((u) => { if (alive) setUrl(u) })
    return () => { alive = false }
  }, [src, direct])
  if (!url) return <>{fallback}</>
  return <img src={url} alt={alt} loading="lazy" style={imgStyle} />
}

/** Pastille de statut générique (une seule implémentation pour tous les workflows). */
export function Badge({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
  return (
    <span style={{ background: bg, color: fg, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

const NEUTRAL = { bg: '#EEF1F4', fg: '#5B6B79' }

export function StatutBadge({ statut }: { statut: string }) {
  const c = STATUT_COLORS[statut] ?? NEUTRAL
  return <Badge bg={c.bg} fg={c.fg}>{statutLabel(statut)}</Badge>
}

export function TransfertStatutBadge({ statut }: { statut: string }) {
  const c = TRANSFERT_STATUT_COLORS[statut] ?? NEUTRAL
  return <Badge bg={c.bg} fg={c.fg}>{TRANSFERT_STATUT_LABELS[statut] ?? statutLabel(statut)}</Badge>
}

export function DmaStatutBadge({ statut }: { statut: string }) {
  const c = DMA_STATUT_COLORS[statut] ?? NEUTRAL
  return <Badge bg={c.bg} fg={c.fg}>{DMA_STATUT_LABELS[statut] ?? statut}</Badge>
}

/** Top bar des écrans racine — avatar (→ profil) | recherche à contour orange | slot droit (cloche, sync…). */
export function TopBar({ initiales, photoUrl, recherche, onRecherche, placeholder, right, onAvatar }: {
  initiales: string
  photoUrl?: string | null
  recherche: string
  onRecherche: (v: string) => void
  placeholder: string
  right?: React.ReactNode
  onAvatar?: () => void
}) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${HAIRLINE}`,
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <button
        onClick={onAvatar}
        className="tk-press"
        aria-label="Profil"
        style={{
          appearance: 'none', cursor: onAvatar ? 'pointer' : 'default',
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0, padding: 0,
          background: '#fff', border: `1.5px solid ${ORANGE}`, color: INK,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FC, fontWeight: 700, fontSize: 16, overflow: 'hidden',
        }}
      >
        {photoUrl
          ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : initiales}
      </button>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: `1.5px solid ${ORANGE}`,
        borderRadius: 999, padding: '0 14px', minHeight: 40,
      }}>
        <span style={{ color: ORANGE, display: 'flex' }}><IconSearch size={17} strokeWidth={2} /></span>
        <input
          value={recherche}
          onChange={(e) => onRecherche(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: F, fontSize: 14.5, color: INK, minWidth: 0 }}
        />
      </div>
      {right}
    </div>
  )
}

/** Rangée de chips de filtre horizontale scrollable. */
export function FilterChips<T extends string>({ chips, value, onChange }: {
  chips: { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
      {chips.map((c) => {
        const actif = value === c.id
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            style={{
              appearance: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13.5, fontWeight: 600,
              padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
              border: `1.5px solid ${actif ? INK : '#DDE3E9'}`,
              background: actif ? INK : '#fff', color: actif ? '#fff' : INK_SOFT,
            }}
          >
            {c.label}{typeof c.count === 'number' ? ` ${c.count}` : ''}
          </button>
        )
      })}
    </div>
  )
}

/** FAB blanc à contour orange, calé au-dessus de la tab bar. */
export function Fab({ onClick, ariaLabel, children }: { onClick: () => void; ariaLabel: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="tk-press"
      aria-label={ariaLabel}
      style={{
        position: 'fixed', right: 16, bottom: 'calc(96px + env(safe-area-inset-bottom))', zIndex: 40,
        appearance: 'none', cursor: 'pointer', color: ORANGE,
        width: 56, height: 56, borderRadius: '50%',
        background: '#fff', border: `1.5px solid ${ORANGE}`,
        boxShadow: '0 6px 16px rgba(15,27,38,.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

/** Bloc trajet « Depuis → Vers » (transferts : formulaire + détail). */
export function TrajetBlock({ origine, destination }: { origine: string; destination: string }) {
  const cell = (label: string, value: string, right?: boolean) => (
    <span style={{ flex: 1, minWidth: 0, textAlign: right ? 'right' : 'left' }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: MUTED }}>{label}</span>
      <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </span>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F4F6F8', borderRadius: 12, padding: '12px 14px' }}>
      {cell('Depuis', origine)}
      <span style={{ color: ORANGE, display: 'flex', flexShrink: 0 }}><IconTransfer size={20} strokeWidth={2} /></span>
      {cell('Vers', destination, true)}
    </div>
  )
}

export type SheetOption = { value: string; label: string; sub?: string }

/**
 * Sélecteur mobile en bottom sheet — remplace le <select> natif pour les listes
 * à libellés longs (chantiers, engins) : le popup natif Android déborde de l'écran.
 * Champ fermé = même rendu que selectStyle (ellipsis) ; ouvert = panneau plein
 * largeur depuis le bas, lignes qui wrappent, check orange, recherche si > 8 options.
 */
export function SheetSelect({ value, options, onChange, placeholder, title, disabled, style }: {
  value: string
  options: SheetOption[]
  onChange: (v: string) => void
  placeholder: string
  title: string
  disabled?: boolean
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const current = options.find((o) => o.value === value)

  // Verrouiller le scroll de la page tant que le sheet est ouvert
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const needle = q.trim().toLowerCase()
  const filtered = needle
    ? options.filter((o) => `${o.label} ${o.sub ?? ''}`.toLowerCase().includes(needle))
    : options

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setQ(''); setOpen(true) }}
        style={{
          ...selectStyle, textAlign: 'left',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: current ? INK : MUTED,
          opacity: disabled ? 0.55 : 1,
          ...style,
        }}
      >
        {current?.label ?? placeholder}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,27,38,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <style>{'@keyframes tkSheetIn { from { transform: translateY(24px); opacity: .6 } to { transform: none; opacity: 1 } }'}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 560, background: '#fff',
              borderRadius: '20px 20px 0 0', padding: '10px 0 env(safe-area-inset-bottom)',
              maxHeight: '75vh', display: 'flex', flexDirection: 'column',
              animation: 'tkSheetIn .18s ease', fontFamily: F,
            }}
          >
            <span style={{ width: 40, height: 4, borderRadius: 999, background: '#DDE3E9', margin: '0 auto 10px', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 10px', flexShrink: 0 }}>
              <span style={{ flex: 1, fontFamily: FC, fontSize: 19, fontWeight: 700, color: INK }}>{title}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                style={{
                  appearance: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%',
                  background: '#fff', border: `1.5px solid ${BORDER}`, color: INK_SOFT, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconX size={17} strokeWidth={2.2} />
              </button>
            </div>

            {options.length > 8 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, margin: '0 16px 10px', flexShrink: 0,
                border: `1.5px solid ${BORDER}`, borderRadius: 999, padding: '0 14px', minHeight: 42,
              }}>
                <span style={{ color: MUTED, display: 'flex' }}><IconSearch size={16} strokeWidth={2} /></span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher…"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: F, fontSize: 15, color: INK, minWidth: 0 }}
                />
              </div>
            )}

            <div style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {filtered.length === 0 && (
                <div style={{ padding: '18px 16px', fontSize: 14, color: MUTED }}>Aucun résultat.</div>
              )}
              {filtered.map((o, i) => {
                const actif = o.value === value
                return (
                  <button
                    key={o.value}
                    onClick={() => { onChange(o.value); setOpen(false) }}
                    style={{
                      appearance: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                      background: 'transparent', border: 'none', fontFamily: F,
                      borderTop: i > 0 ? `1px solid ${HAIRLINE}` : 'none',
                      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 15, fontWeight: actif ? 700 : 500, color: INK }}>{o.label}</span>
                      {o.sub && <span style={{ display: 'block', fontSize: 12.5, color: MUTED, marginTop: 2 }}>{o.sub}</span>}
                    </span>
                    {actif && <span style={{ color: ORANGE, display: 'flex', flexShrink: 0 }}><IconCheck size={19} strokeWidth={2.4} /></span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function SubHeader({ titre, onBack, right }: { titre: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #EAEEF2',
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <button
        onClick={onBack}
        className="tk-press"
        style={{
          appearance: 'none', cursor: 'pointer', flexShrink: 0,
          width: 40, height: 40, borderRadius: '50%',
          background: '#fff', border: `1.5px solid ${ORANGE}`, color: INK,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Retour"
      >
        <IconChevronLeft size={20} strokeWidth={2.2} />
      </button>
      <div style={{ fontFamily: FC, fontSize: 21, fontWeight: 700, color: INK, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {titre}
      </div>
      {right}
    </div>
  )
}

export function Toast({ msg, error }: { msg: string; error?: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 84, left: 16, right: 16, zIndex: 100,
      background: error ? RED : HEADER_DARK, color: '#fff', borderRadius: 12,
      padding: '14px 16px', fontSize: 15, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,.25)', textAlign: 'center',
      maxWidth: 528, margin: '0 auto',
    }}>
      {msg}
    </div>
  )
}

export function Skeleton({ height = 64, radius = 16 }: { height?: number; radius?: number }) {
  return (
    <div style={{
      height, borderRadius: radius,
      background: 'linear-gradient(90deg, #E9EDF1 25%, #F4F6F8 50%, #E9EDF1 75%)',
      backgroundSize: '200% 100%', animation: 'tkShimmer 1.4s infinite',
    }} />
  )
}

export function SignatureCanvas({ onChange }: { onChange: (dataUrl: string | null) => void }) {
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
      <button onClick={clear} style={{ appearance: 'none', border: 'none', background: 'transparent', color: MUTED, fontSize: 13, fontWeight: 600, marginTop: 4, cursor: 'pointer', padding: '8px 0', fontFamily: F, display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconX size={14} strokeWidth={2.4} /> Effacer la signature
      </button>
    </div>
  )
}
