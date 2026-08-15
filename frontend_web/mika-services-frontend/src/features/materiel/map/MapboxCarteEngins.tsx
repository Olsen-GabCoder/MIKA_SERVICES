import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { EnginCarte } from '@/types/materiel'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string

const STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

const STATUT_COLORS: Record<string, string> = {
  DISPONIBLE: '#16A34A',
  EN_SERVICE: '#3F6B83',
  EN_MAINTENANCE: '#D97706',
  EN_PANNE: '#DC2626',
  HORS_SERVICE: '#6B7280',
  EN_TRANSIT: '#8B5CF6',
}

const STATUT_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  EN_SERVICE: 'En service',
  EN_MAINTENANCE: 'Maintenance',
  EN_PANNE: 'En panne',
  HORS_SERVICE: 'Hors service',
  EN_TRANSIT: 'En transit',
}

interface Props {
  positions: EnginCarte[]
  selectedId: number | null
  onSelect: (id: number) => void
  onOpenFiche: (id: number) => void
}

export function MapboxCarteEngins({ positions, selectedId, onSelect, onOpenFiche }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets')
  const [loading, setLoading] = useState(true)
  const currentStyleRef = useRef<'streets' | 'satellite'>('streets')

  const positionsRef = useRef(positions)
  positionsRef.current = positions
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const onOpenFicheRef = useRef(onOpenFiche)
  onOpenFicheRef.current = onOpenFiche

  /** Build GeoJSON from positions */
  function toGeoJSON(data: EnginCarte[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: data.map(pos => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [pos.longitude, pos.latitude] },
        properties: {
          id: pos.id,
          code: pos.code,
          nom: pos.nom,
          statut: pos.statut,
          marque: pos.marque || '',
          chantierNom: pos.chantierNom || '',
          color: STATUT_COLORS[pos.statut] || '#6B7280',
        },
      })),
    }
  }

  /** Add or update the engins source + layers */
  function syncSource(map: mapboxgl.Map) {
    const data = positionsRef.current
    const geojson = toGeoJSON(data)

    const src = map.getSource('engins') as mapboxgl.GeoJSONSource | undefined
    if (src) {
      src.setData(geojson)
    } else {
      map.addSource('engins', { type: 'geojson', data: geojson })

      // Circle layer
      map.addLayer({
        id: 'engins-circles',
        type: 'circle',
        source: 'engins',
        paint: {
          'circle-radius': 10,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#fff',
        },
      })

      // Label layer
      map.addLayer({
        id: 'engins-labels',
        type: 'symbol',
        source: 'engins',
        layout: {
          'text-field': ['slice', ['get', 'code'], -3],
          'text-size': 9,
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#fff',
        },
      })

      // Click handler
      map.on('click', 'engins-circles', (e) => {
        const feat = e.features?.[0]
        if (!feat || !feat.properties) return
        const id = feat.properties.id as number
        onSelectRef.current(id)
        const pos = positionsRef.current.find(p => p.id === id)
        if (pos) showPopup(map, pos)
      })

      // Cursor
      map.on('mouseenter', 'engins-circles', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'engins-circles', () => { map.getCanvas().style.cursor = '' })
    }

    // Fit bounds
    if (data.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      data.forEach(p => bounds.extend([p.longitude, p.latitude]))
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 })
    }
  }

  function showPopup(map: mapboxgl.Map, pos: EnginCarte) {
    popupRef.current?.remove()
    const color = STATUT_COLORS[pos.statut] || '#6B7280'
    const label = STATUT_LABELS[pos.statut] || pos.statut

    const popup = new mapboxgl.Popup({ offset: 15, closeButton: true, maxWidth: '280px' })
      .setLngLat([pos.longitude, pos.latitude])
      .setHTML(`
        <div style="font-family:'Barlow',sans-serif">
          <div style="background:${color};color:#fff;padding:10px 14px;margin:-10px -10px 10px;border-radius:4px 4px 0 0">
            <div style="font-size:11px;font-weight:600;letter-spacing:.08em;opacity:.8">${pos.code}</div>
            <div style="font-size:15px;font-weight:700;margin-top:2px">${pos.nom}</div>
          </div>
          <div style="padding:0 4px 4px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;color:${color};background:${color}18">${label}</span>
            </div>
            <div style="font-size:12.5px;color:#5B6C7C;line-height:1.5">
              ${pos.chantierNom || 'Non affecté'}<br/>
              ${pos.marque || ''}<br/>
              ${pos.latitude.toFixed(4)} N, ${pos.longitude.toFixed(4)} E
            </div>
            <button id="popup-fiche-${pos.id}" style="width:100%;margin-top:10px;padding:8px;border:none;border-radius:6px;background:#2563EB;color:#fff;font-family:'Barlow',sans-serif;font-size:13px;font-weight:700;cursor:pointer">
              Ouvrir la fiche
            </button>
          </div>
        </div>
      `)
      .addTo(map)

    popupRef.current = popup

    setTimeout(() => {
      document.getElementById(`popup-fiche-${pos.id}`)?.addEventListener('click', () => {
        onOpenFicheRef.current(pos.id)
      })
    }, 50)
  }

  // Init map ONCE
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return
    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: STYLES.streets,
      center: [11.5, -1.5],
      zoom: 6,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    mapRef.current = map

    map.on('load', () => {
      syncSource(map)
      setLoading(false)
    })

    map.on('idle', () => setLoading(false))

    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update data when positions change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    syncSource(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions])

  // Switch style
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (mapStyle === currentStyleRef.current && map.isStyleLoaded()) return
    currentStyleRef.current = mapStyle
    setLoading(true)

    map.setStyle(STYLES[mapStyle])
    map.once('style.load', () => {
      syncSource(map)
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle])

  // Show popup for selected
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const pos = positions.find(p => p.id === selectedId)
    if (pos && map.isStyleLoaded()) showPopup(map, pos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, positions])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)',
        }}>
          <div style={{ textAlign: 'center', fontFamily: "'Barlow',sans-serif" }}>
            <div style={{
              width: 36, height: 36, margin: '0 auto 12px',
              border: '3px solid #E5E7EB', borderTopColor: '#2563EB', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#33465A' }}>Chargement de la carte...</div>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Style switcher */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 4, zIndex: 4 }}>
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
      </div>

      {/* No data message */}
      {!loading && positions.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: '#fff', borderRadius: 10, padding: '20px 28px', boxShadow: '0 4px 16px rgba(0,0,0,.15)',
          fontFamily: "'Barlow',sans-serif", textAlign: 'center', zIndex: 3,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#152230' }}>Aucun engin géolocalisé</div>
          <div style={{ fontSize: 13, color: '#7A8B9A', marginTop: 6 }}>Les engins apparaîtront ici lorsqu'ils seront affectés à des chantiers avec coordonnées GPS.</div>
        </div>
      )}
    </div>
  )
}
