/**
 * Markers Leaflet — points dynamiques clignotants.
 *
 * Chaque marker est un point animé (pulse + halo) dont la couleur
 * dépend du statut du projet. Un tooltip permanent affiche
 * le nom du projet et le nombre d'engins.
 */

import L from 'leaflet'

/* ------------------------------------------------------------------ */
/*  Types exportés                                                     */
/* ------------------------------------------------------------------ */

export type ChantierHealthStatus = 'ok' | 'warning' | 'critical' | 'empty'

/* ------------------------------------------------------------------ */
/*  Couleurs par statut                                                */
/* ------------------------------------------------------------------ */

const STATUT_COLORS: Record<string, string> = {
  EN_COURS:               '#3b82f6',
  PLANIFIE:               '#f59e0b',
  EN_ATTENTE:             '#8b5cf6',
  SUSPENDU:               '#ef4444',
  TERMINE:                '#22c55e',
  ABANDONNE:              '#6b7280',
  RECEPTION_PROVISOIRE:   '#14b8a6',
  RECEPTION_DEFINITIVE:   '#10b981',
}

function getColor(statut: string): string {
  return STATUT_COLORS[statut] ?? '#6b7280'
}

/* ------------------------------------------------------------------ */
/*  Marker animé                                                       */
/* ------------------------------------------------------------------ */

export function createProjetMarker(
  statut: string,
  isSelected = false,
): L.DivIcon {
  const color = getColor(statut)
  const coreSize = isSelected ? 24 : 18
  const pulseSize = isSelected ? 56 : 44
  const total = pulseSize + 8
  const half = total / 2

  // Animation speed: selected pulse plus vite
  const dur = isSelected ? '1.5s' : '2.2s'

  return L.divIcon({
    className: '',
    iconSize: [total, total],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
    html: `<div style="position:relative;width:${total}px;height:${total}px;display:flex;align-items:center;justify-content:center;cursor:pointer">
      <div style="
        position:absolute;
        width:${pulseSize}px;height:${pulseSize}px;
        border-radius:50%;
        background:${color}22;
        animation:marker-ping ${dur} cubic-bezier(0,0,0.2,1) infinite;
      "></div>
      <div style="
        position:absolute;
        width:${coreSize * 2.5}px;height:${coreSize * 2.5}px;
        border-radius:50%;
        background:radial-gradient(circle, ${color}44 0%, transparent 65%);
      "></div>
      <div style="
        position:relative;z-index:2;
        width:${coreSize}px;height:${coreSize}px;
        border-radius:50%;
        background:${color};
        border:3px solid white;
        box-shadow:0 0 14px ${color}aa, 0 0 28px ${color}44, 0 2px 6px rgba(0,0,0,0.3);
        ${isSelected ? `animation:marker-glow 1s ease-in-out infinite;--glow-color:${color};` : ''}
      "></div>
    </div>`,
  })
}

/* ------------------------------------------------------------------ */
/*  Tooltip HTML                                                       */
/* ------------------------------------------------------------------ */

export function createTooltipContent(nomFull: string, nbEngins: number): string {
  const nom = nomFull.length > 25 ? nomFull.slice(0, 23) + '…' : nomFull
  const badge = nbEngins > 0
    ? `<span style="
        display:inline-flex;align-items:center;justify-content:center;
        min-width:18px;height:18px;padding:0 5px;
        border-radius:9px;
        background:#FF6B35;color:white;
        font-size:10px;font-weight:700;
        margin-left:6px;
        line-height:1;
      ">${nbEngins}</span>`
    : ''

  return `<span style="
    font-size:11px;font-weight:600;
    white-space:nowrap;
    color:inherit;
    line-height:1.3;
  ">${nom}${badge}</span>`
}
