/**
 * Design system de l'app mobile terrain — tokens & styles partagés.
 * Charte MIKA : Barlow / Barlow Condensed, accent #FF6B35, header sombre #0F1B26.
 * Usage terrain : cibles >= 56px, contrastes forts, une action par écran.
 */
import type React from 'react'

// ── Typographie ────────────────────────────────────────────────
export const F = 'Barlow, system-ui, sans-serif'
export const FC = "'Barlow Condensed', sans-serif"

// ── Couleurs ───────────────────────────────────────────────────
export const INK = '#152230'
export const MUTED = '#7A8B9A'
export const BORDER = '#DFE5EB'
export const BLUE = '#2563EB'
export const GREEN = '#16A34A'
export const RED = '#DC2626'
export const AMBER = '#D97706'
export const ORANGE = '#FF6B35'          // accent MIKA
export const BG = '#F4F6F8'
export const INK_SOFT = '#3D4F61'        // texte secondaire foncé (labels d'action, sous-titres)
export const ICON_MUTED = '#9AA8B5'      // icônes décoratives (chevrons, kebab)
export const SURFACE = '#F0F3F7'         // fonds neutres (pastilles d'icône, avatars)
export const HAIRLINE = '#EAEEF2'        // bordure fine des top bars
export const DISABLED = '#C6CFD8'        // boutons désactivés
export const HEADER_DARK = '#0F1B26'
export const HEADER_GRADIENT = 'linear-gradient(160deg, #0F1B26 0%, #152230 100%)'

// ── Surfaces & composants de base ──────────────────────────────
export const card: React.CSSProperties = {
  background: '#fff',
  border: `1px solid ${BORDER}`,
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(15,27,38,.04), 0 4px 16px rgba(15,27,38,.05)',
}

export const bigBtn = (bg: string): React.CSSProperties => ({
  appearance: 'none', border: 'none', borderRadius: 14, background: bg, color: '#fff',
  minHeight: 58, padding: '14px 18px', fontFamily: F, fontSize: 17, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  width: '100%', cursor: 'pointer',
})

export const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', minHeight: 52, padding: '12px 14px', borderRadius: 10,
  border: `1.5px solid ${BORDER}`, fontFamily: F, fontSize: 16, color: INK, background: '#fff',
}

export const label13: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: MUTED, marginBottom: 6, display: 'block',
}

/** Select stylisé (même rendu que inputStyle, chevron custom — le picker reste natif). */
export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
  paddingRight: 42, cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%237A8B9A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
}

// ── Statuts engin (identiques au web) ──────────────────────────
export const STATUT_COLORS: Record<string, { bg: string; fg: string }> = {
  DISPONIBLE: { bg: '#E8F7EE', fg: '#137A3D' },
  EN_ATTENTE_DEPART: { bg: '#FDF3E2', fg: '#B45309' },
  EN_SERVICE: { bg: '#E7EFFD', fg: '#1D4FBF' },
  EN_MAINTENANCE: { bg: '#FDF3E2', fg: '#B45309' },
  MAINTENANCE: { bg: '#FDF3E2', fg: '#B45309' },
  EN_PANNE: { bg: '#FDEAEA', fg: '#B91C1C' },
  IMMOBILISE: { bg: '#EEF1F4', fg: '#5B6B79' },
  EN_TRANSIT: { bg: '#EFE9FD', fg: '#6D28D9' },
  HORS_SERVICE: { bg: '#EEF1F4', fg: '#5B6B79' },
  REFORME: { bg: '#EEF1F4', fg: '#5B6B79' },
}
export const statutLabel = (s: string) => s.replace(/_/g, ' ')

// ── Statuts DMA (workflow demandes de matériel) ────────────────
export const DMA_STATUT_COLORS: Record<string, { bg: string; fg: string }> = {
  SOUMISE: { bg: '#E7EFFD', fg: '#1D4FBF' },
  EN_VALIDATION_CHANTIER: { bg: '#FDF3E2', fg: '#B45309' },
  EN_VALIDATION_PROJET: { bg: '#FDF3E2', fg: '#B45309' },
  PRISE_EN_CHARGE: { bg: '#EFE9FD', fg: '#6D28D9' },
  EN_ATTENTE_COMPLEMENT: { bg: '#FDEAEA', fg: '#B91C1C' },
  EN_COMMANDE: { bg: '#E0F2FE', fg: '#0369A1' },
  LIVRE: { bg: '#E8F7EE', fg: '#137A3D' },
  REJETEE: { bg: '#FDEAEA', fg: '#B91C1C' },
  CLOTUREE: { bg: '#EEF1F4', fg: '#5B6B79' },
}
export const DMA_STATUT_LABELS: Record<string, string> = {
  // Circuit à une porte (réforme 2026-08-20) ; EN_VALIDATION_* = statuts legacy (historique).
  SOUMISE: 'En attente logistique',
  EN_VALIDATION_CHANTIER: 'Validée chantier (ancien circuit)',
  EN_VALIDATION_PROJET: 'Validée projet (ancien circuit)',
  PRISE_EN_CHARGE: 'Prise en charge logistique',
  EN_ATTENTE_COMPLEMENT: 'Complément demandé',
  EN_COMMANDE: 'En commande',
  LIVRE: 'Livrée',
  REJETEE: 'Rejetée',
  CLOTUREE: 'Clôturée',
}
// ── Statuts transfert d'engin (workflow validation logistique) ──
export const TRANSFERT_STATUT_COLORS: Record<string, { bg: string; fg: string }> = {
  DEMANDE: { bg: '#E7EFFD', fg: '#1D4FBF' },
  REJETE: { bg: '#FDEAEA', fg: '#B91C1C' },
  EN_ATTENTE_DEPART: { bg: '#FDF3E2', fg: '#B45309' },
  EN_TRANSIT: { bg: '#EFE9FD', fg: '#6D28D9' },
  RECU: { bg: '#E8F7EE', fg: '#137A3D' },
  ANNULE: { bg: '#EEF1F4', fg: '#5B6B79' },
}
export const TRANSFERT_STATUT_LABELS: Record<string, string> = {
  DEMANDE: 'En attente validation',
  REJETE: 'Rejeté',
  EN_ATTENTE_DEPART: 'Validé — à faire partir',
  EN_TRANSIT: 'En transit',
  RECU: 'Reçu',
  ANNULE: 'Annulé',
}

export const DMA_PRIORITE_COLORS: Record<string, string> = {
  BASSE: '#9CA3AF', NORMALE: BLUE, HAUTE: AMBER, URGENTE: RED,
}

// ── Utilitaires ────────────────────────────────────────────────
export const today = () => new Date().toISOString().slice(0, 10)

export function getGps(): Promise<{ latitude: number; longitude: number; precisionMetres?: number } | null> {
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

export function errMsg(e: unknown): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || err?.message || 'Une erreur est survenue'
}
