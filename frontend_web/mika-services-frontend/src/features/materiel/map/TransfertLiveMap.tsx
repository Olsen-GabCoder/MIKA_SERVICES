/**
 * Carte de suivi temps réel d'un transfert d'engin — Leaflet / OpenStreetMap.
 * Trace GPS historique + marqueur mobile live (WebSocket) + destination et origine,
 * badge ETA. Sans clé API externe.
 */
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { mouvementEnginApi } from '@/api/mouvementEnginApi'
import type { SuiviTransfert, SuiviPoint } from '@/types/materiel'
import { useTransfertLive } from '../hooks/useTransfertLive'

const OSM = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}

function pinIcon(color: string, label: string) {
  return L.divIcon({
    className: 'mk-transfert-pin',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
    html: `<div class="mk-tpin" style="--mk-c:${color}"><span>${label}</span></div>`,
  })
}

function truckIcon() {
  return L.divIcon({
    className: 'mk-transfert-truck',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
    html: `<div class="mk-truck mk-truck-live"></div>`,
  })
}

/** Recadre sur l'ensemble des points au premier rendu utile. */
function FitOnce({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (done || points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 14 })
    }
    setDone(true)
  }, [points, done, map])
  return null
}

/** Suit le marqueur mobile sans forcer le zoom. */
function FollowLive({ pos }: { pos: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (pos) map.panTo(pos, { animate: true, duration: 0.6 })
  }, [pos, map])
  return null
}

function formatEta(min: number | null | undefined): string {
  if (min == null) return '—'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} h` : `${h} h ${m}`
}

interface Props {
  transfertId: number
}

export function TransfertLiveMap({ transfertId }: Props) {
  const [suivi, setSuivi] = useState<SuiviTransfert | null>(null)
  const [error, setError] = useState(false)
  const [livePositions, setLivePositions] = useState<SuiviPoint[]>([])

  const enTransit = suivi?.statut === 'EN_TRANSIT'
  const { position: livePos, connected } = useTransfertLive(transfertId, enTransit)

  // Chargement initial (historique + destination/origine).
  useEffect(() => {
    let cancelled = false
    setError(false)
    mouvementEnginApi.getSuivi(transfertId)
      .then(s => { if (!cancelled) { setSuivi(s); setLivePositions(s.positions) } })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [transfertId])

  // Fusion des positions live (dédoublonnage par horodatage).
  useEffect(() => {
    if (!livePos) return
    setLivePositions(prev => (
      prev.some(p => p.horodatage === livePos.horodatage) ? prev : [...prev, livePos]
    ))
  }, [livePos])

  const trailPoints = useMemo(
    () => livePositions.map(p => [p.latitude, p.longitude] as [number, number]),
    [livePositions],
  )
  const derniere = livePositions.length > 0 ? livePositions[livePositions.length - 1] : null
  const livePoint = derniere ? ([derniere.latitude, derniere.longitude] as [number, number]) : null

  const dest = suivi?.destination
  const orig = suivi?.origine
  const fitPoints = useMemo(() => {
    const pts: Array<[number, number]> = [...trailPoints]
    if (dest) pts.push([dest.latitude, dest.longitude])
    if (orig) pts.push([orig.latitude, orig.longitude])
    return pts
  }, [trailPoints, dest, orig])

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'Barlow',sans-serif", color: '#7A8B9A', fontSize: 14 }}>
        Suivi indisponible pour ce transfert.
      </div>
    )
  }

  const center: [number, number] = livePoint || (dest ? [dest.latitude, dest.longitude] : [-0.8, 11.6])
  const eta = derniere?.etaMinutes

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        .mk-transfert-pin, .mk-transfert-truck { background: none; border: none; }
        .mk-tpin {
          width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: var(--mk-c); border: 2.5px solid #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,.35);
          display: flex; align-items: center; justify-content: center;
        }
        .mk-tpin span {
          transform: rotate(45deg); color: #fff; font-weight: 700;
          font-family: 'Barlow Condensed', sans-serif; font-size: 13px;
        }
        .mk-truck {
          width: 34px; height: 34px; border-radius: 50%;
          background: #8B5CF6; border: 3px solid #fff;
          box-shadow: 0 1px 8px rgba(0,0,0,.4);
        }
        .mk-truck-live::after {
          content: ''; position: absolute; inset: -6px; border-radius: 50%;
          border: 2px solid #8B5CF6; opacity: .6;
          animation: mk-tlive-ping 1.8s ease-out infinite;
        }
        @keyframes mk-tlive-ping {
          0% { transform: scale(.7); opacity: .7; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      <MapContainer center={center} zoom={11} style={{ position: 'absolute', inset: 0 }} zoomControl>
        <TileLayer url={OSM.url} attribution={OSM.attribution} />
        <FitOnce points={fitPoints} />
        <FollowLive pos={livePoint} />

        {trailPoints.length > 1 && (
          <>
            <Polyline positions={trailPoints} pathOptions={{ color: '#8B5CF6', weight: 4, opacity: 0.7 }} />
            {trailPoints.slice(0, -1).map((pt, i) => (
              <CircleMarker key={i} center={pt} radius={3} pathOptions={{ color: '#fff', weight: 1.2, fillColor: '#8B5CF6', fillOpacity: 0.85 }} />
            ))}
          </>
        )}

        {orig && (
          <Marker position={[orig.latitude, orig.longitude]} icon={pinIcon('#3F6B83', 'O')}>
            <Popup>Origine : {orig.nom}</Popup>
          </Marker>
        )}
        {dest && (
          <Marker position={[dest.latitude, dest.longitude]} icon={pinIcon('#16A34A', 'D')}>
            <Popup>Destination : {dest.nom}</Popup>
          </Marker>
        )}
        {livePoint && (
          <Marker position={livePoint} icon={truckIcon()}>
            <Popup>
              {suivi?.enginCode}<br />
              {derniere?.vitesseKmh != null ? `${Math.round(derniere.vitesseKmh)} km/h` : 'vitesse inconnue'}<br />
              ETA {formatEta(eta)}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Bandeau statut / ETA */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', borderRadius: 8, padding: '8px 13px',
        boxShadow: '0 1px 6px rgba(0,0,0,.15)', fontFamily: "'Barlow',sans-serif",
      }}>
        {enTransit ? (
          <>
            <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: connected ? '#16A34A' : '#D97706', display: 'inline-block' }}>
              {connected && <span style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: '1.5px solid #16A34A', animation: 'mk-tlive-ping 1.8s ease-out infinite' }} />}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#152230' }}>{connected ? 'EN DIRECT' : 'RECONNEXION…'}</span>
            <span style={{ width: 1, height: 16, background: '#E2E8EF' }} />
            <span style={{ fontSize: 12, color: '#5B6C7C' }}>ETA <b style={{ color: '#152230' }}>{formatEta(eta)}</b></span>
          </>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5B6C7C' }}>
            {suivi ? (suivi.statut === 'RECU' ? 'Transfert reçu' : 'Hors transit') : 'Chargement…'}
          </span>
        )}
      </div>

      {trailPoints.length === 0 && dest && (
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#fff', borderRadius: 8, padding: '8px 14px', boxShadow: '0 1px 6px rgba(0,0,0,.15)',
          fontFamily: "'Barlow',sans-serif", fontSize: 12.5, color: '#7A8B9A', zIndex: 1000, textAlign: 'center',
        }}>
          Aucune position GPS reçue pour le moment.
        </div>
      )}
    </div>
  )
}
