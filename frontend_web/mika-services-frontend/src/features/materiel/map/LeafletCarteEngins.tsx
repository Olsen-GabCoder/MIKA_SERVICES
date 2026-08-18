/**
 * Carte du parc — Leaflet (OpenStreetMap / Esri Satellite).
 * Suivi temps réel : marqueurs colorés par statut, pulse pour les engins actifs,
 * trace GPS historique de l'engin sélectionné, sans clé API externe.
 */
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { enginApi } from '@/api/enginApi'
import type { EnginCarte, PositionEngin } from '@/types/materiel'

const STATUT_COLORS: Record<string, string> = {
  DISPONIBLE: '#16A34A',
  EN_SERVICE: '#3F6B83',
  EN_MAINTENANCE: '#D97706',
  EN_PANNE: '#DC2626',
  IMMOBILISE: '#9333EA',
  HORS_SERVICE: '#6B7280',
  EN_TRANSIT: '#8B5CF6',
  REFORME: '#78716C',
}

const STATUT_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  EN_SERVICE: 'En service',
  EN_MAINTENANCE: 'Maintenance',
  EN_PANNE: 'En panne',
  IMMOBILISE: 'Immobilisé',
  HORS_SERVICE: 'Hors service',
  EN_TRANSIT: 'En transit',
  REFORME: 'Réformé',
}

const TILES = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
  },
}

/** Marqueur HTML : pastille colorée + code, halo pulsé pour les engins actifs */
function buildIcon(pos: EnginCarte, selected: boolean) {
  const color = STATUT_COLORS[pos.statut] || '#6B7280'
  const active = pos.statut === 'EN_SERVICE' || pos.statut === 'EN_TRANSIT'
  const short = pos.code.slice(-3)
  return L.divIcon({
    className: 'mk-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
    html: `
      <div class="mk-mark${active ? ' mk-mark-live' : ''}${selected ? ' mk-mark-sel' : ''}" style="--mk-c:${color}">
        <span>${short}</span>
      </div>`,
  })
}

/** Recadre la carte sur l'ensemble des positions (au premier chargement) */
function FitBounds({ positions }: { positions: EnginCarte[] }) {
  const map = useMap()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (done || positions.length === 0) return
    const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude] as [number, number]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 })
    setDone(true)
  }, [positions, done, map])
  return null
}

/** Vole vers l'engin sélectionné */
function FlyToSelected({ pos }: { pos: EnginCarte | null }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.flyTo([pos.latitude, pos.longitude], Math.max(map.getZoom(), 13), { duration: 0.8 })
  }, [pos, map])
  return null
}

interface Props {
  positions: EnginCarte[]
  selectedId: number | null
  onSelect: (id: number) => void
  onOpenFiche: (id: number) => void
  lastUpdate: Date | null
}

export function LeafletCarteEngins({ positions, selectedId, onSelect, onOpenFiche, lastUpdate }: Props) {
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets')
  const [trail, setTrail] = useState<PositionEngin[]>([])
  const [showTrail, setShowTrail] = useState(true)
  const [tick, setTick] = useState(0)

  const selected = positions.find(p => p.id === selectedId) || null

  // Horloge pour le libellé "maj il y a Xs"
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 5000)
    return () => clearInterval(t)
  }, [])
  void tick

  // Trace GPS de l'engin sélectionné
  useEffect(() => {
    if (!selectedId) { setTrail([]); return }
    let cancelled = false
    enginApi.getPositionsHistorique(selectedId, 0, 30)
      .then(page => { if (!cancelled) setTrail(page.content) })
      .catch(() => { if (!cancelled) setTrail([]) })
    return () => { cancelled = true }
  }, [selectedId])

  const trailPoints = trail.map(p => [p.latitude, p.longitude] as [number, number])
  const secondsAgo = lastUpdate ? Math.max(0, Math.round((Date.now() - lastUpdate.getTime()) / 1000)) : null
  const majLabel = secondsAgo == null ? '—' : secondsAgo < 60 ? `il y a ${secondsAgo}s` : `il y a ${Math.floor(secondsAgo / 60)} min`

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        .mk-leaflet-marker { background: none; border: none; }
        .mk-mark {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--mk-c); border: 2.5px solid #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,.35);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
          color: #fff; letter-spacing: .04em;
          transition: transform .15s ease;
        }
        .mk-mark:hover { transform: scale(1.12); }
        .mk-mark-sel { transform: scale(1.18); box-shadow: 0 0 0 4px color-mix(in srgb, var(--mk-c) 35%, transparent), 0 1px 6px rgba(0,0,0,.35); }
        .mk-mark-live::after {
          content: ''; position: absolute; inset: -6px; border-radius: 50%;
          border: 2px solid var(--mk-c); opacity: .6;
          animation: mk-live-ping 1.8s ease-out infinite;
        }
        @keyframes mk-live-ping {
          0% { transform: scale(.7); opacity: .7; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        .leaflet-popup-content-wrapper { border-radius: 8px; padding: 0; overflow: hidden; }
        .leaflet-popup-content { margin: 0; width: 250px !important; font-family: 'Barlow', sans-serif; }
      `}</style>

      <MapContainer center={[-1.5, 11.5]} zoom={6} style={{ position: 'absolute', inset: 0 }} zoomControl>
        <TileLayer key={mapStyle} url={TILES[mapStyle].url} attribution={TILES[mapStyle].attribution} />
        <FitBounds positions={positions} />
        <FlyToSelected pos={selected} />

        {/* Trace historique de l'engin sélectionné */}
        {showTrail && trailPoints.length > 1 && (
          <>
            <Polyline positions={trailPoints} pathOptions={{ color: '#2563EB', weight: 3, opacity: 0.65, dashArray: '6 6' }} />
            {trailPoints.slice(1).map((pt, i) => (
              <CircleMarker key={i} center={pt} radius={3.5} pathOptions={{ color: '#fff', weight: 1.5, fillColor: '#2563EB', fillOpacity: 0.9 }} />
            ))}
          </>
        )}

        {positions.map(pos => {
          const color = STATUT_COLORS[pos.statut] || '#6B7280'
          const label = STATUT_LABELS[pos.statut] || pos.statut
          return (
            <Marker
              key={pos.id}
              position={[pos.latitude, pos.longitude]}
              icon={buildIcon(pos, pos.id === selectedId)}
              eventHandlers={{ click: () => onSelect(pos.id) }}
            >
              <Popup>
                <div>
                  <div style={{ background: color, color: '#fff', padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', opacity: .85 }}>{pos.code}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{pos.nom}</div>
                  </div>
                  <div style={{ padding: '10px 14px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, color, background: `${color}18` }}>{label}</span>
                    <div style={{ fontSize: 12.5, color: '#5B6C7C', lineHeight: 1.5, marginTop: 8 }}>
                      {pos.chantierNom || 'Non affecté'}<br />
                      {pos.marque || ''}{pos.marque ? <br /> : null}
                      {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}
                    </div>
                    <button
                      onClick={() => onOpenFiche(pos.id)}
                      style={{ width: '100%', marginTop: 10, padding: 8, border: 'none', borderRadius: 6, background: '#2563EB', color: '#fff', fontFamily: 'Barlow,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Ouvrir la fiche
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Contrôles : fond de carte + trace */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 4, zIndex: 1000 }}>
        {(['streets', 'satellite'] as const).map(s => (
          <button
            key={s}
            onClick={() => setMapStyle(s)}
            style={{
              appearance: 'none', cursor: 'pointer', fontFamily: "'Barlow',sans-serif",
              fontSize: 12, fontWeight: mapStyle === s ? 700 : 500,
              padding: '6px 12px', borderRadius: 6,
              border: `1px solid ${mapStyle === s ? '#2563EB' : '#C9D3DC'}`,
              background: mapStyle === s ? '#2563EB' : '#fff',
              color: mapStyle === s ? '#fff' : '#33465A',
              boxShadow: '0 1px 4px rgba(0,0,0,.12)',
            }}
          >
            {s === 'streets' ? 'Carte' : 'Satellite'}
          </button>
        ))}
        {selectedId != null && trailPoints.length > 1 && (
          <button
            onClick={() => setShowTrail(v => !v)}
            style={{
              appearance: 'none', cursor: 'pointer', fontFamily: "'Barlow',sans-serif",
              fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 6,
              border: `1px solid ${showTrail ? '#2563EB' : '#C9D3DC'}`,
              background: showTrail ? '#EFF4FF' : '#fff', color: showTrail ? '#2563EB' : '#33465A',
              boxShadow: '0 1px 4px rgba(0,0,0,.12)',
            }}
          >
            Trace GPS ({trailPoints.length})
          </button>
        )}
      </div>

      {/* Badge suivi en direct */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 7,
        background: '#fff', borderRadius: 6, padding: '6px 11px',
        boxShadow: '0 1px 4px rgba(0,0,0,.12)', fontFamily: "'Barlow',sans-serif",
      }}>
        <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }}>
          <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1.5px solid #16A34A', animation: 'mk-live-ping 1.8s ease-out infinite' }} />
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#152230' }}>EN DIRECT</span>
        <span style={{ fontSize: 11, color: '#7A8B9A' }}>maj {majLabel}</span>
      </div>

      {/* Aucune donnée */}
      {positions.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: '#fff', borderRadius: 10, padding: '20px 28px', boxShadow: '0 4px 16px rgba(0,0,0,.15)',
          fontFamily: "'Barlow',sans-serif", textAlign: 'center', zIndex: 1000,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#152230' }}>Aucun engin géolocalisé</div>
          <div style={{ fontSize: 13, color: '#7A8B9A', marginTop: 6 }}>Les engins apparaîtront ici lorsqu'ils seront affectés à des chantiers avec coordonnées GPS.</div>
        </div>
      )}
    </div>
  )
}
