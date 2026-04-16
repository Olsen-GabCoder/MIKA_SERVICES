/**
 * ChantierMap — Carte des projets MIKA Services.
 *
 * - Verrouillée sur le Gabon (maxBounds)
 * - Tuiles Mapbox haute précision
 * - Markers clignotants colorés par statut
 * - Labels permanents (nom + badge engins)
 * - Décalage automatique des markers trop proches
 * - Panneau détail au clic : voir projet / voir engins
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { projetApi } from '@/api/projetApi'
import type { ProjetSummary } from '@/types/projet'

import {
  TILE_LIGHT, TILE_DARK,
  GABON_BOUNDS, GABON_CENTER, GABON_ZOOM,
  MIN_ZOOM, MAX_ZOOM,
} from './tileConfig'
import { createProjetMarker, createTooltipContent } from './chantierMarker'
import { spreadOverlappingMarkers } from './spreadMarkers'

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ProjetPin {
  projet: ProjetSummary
  coords: [number, number]
  displayCoords: [number, number]
}

/* ------------------------------------------------------------------ */
/*  Statut config                                                       */
/* ------------------------------------------------------------------ */

const STATUT_INFO: Record<string, { label: string; dot: string }> = {
  EN_COURS:             { label: 'En cours',    dot: 'bg-blue-500' },
  PLANIFIE:             { label: 'Planifié',    dot: 'bg-amber-500' },
  EN_ATTENTE:           { label: 'En attente',  dot: 'bg-violet-500' },
  SUSPENDU:             { label: 'Suspendu',    dot: 'bg-red-500' },
  TERMINE:              { label: 'Terminé',     dot: 'bg-green-500' },
  ABANDONNE:            { label: 'Abandonné',   dot: 'bg-gray-500' },
  RECEPTION_PROVISOIRE: { label: 'Réc. prov.',  dot: 'bg-teal-500' },
  RECEPTION_DEFINITIVE: { label: 'Réc. déf.',   dot: 'bg-emerald-500' },
}

/* ------------------------------------------------------------------ */
/*  Auto fit                                                            */
/* ------------------------------------------------------------------ */

function FitBounds({ pins, selectedId }: { pins: ProjetPin[]; selectedId: number | null }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (pins.length === 0) return

    if (selectedId != null) {
      const sel = pins.find((p) => p.projet.id === selectedId)
      if (sel) {
        map.flyTo(sel.displayCoords, Math.max(map.getZoom(), 13), { duration: 0.5 })
        return
      }
    }

    if (!fitted.current) {
      const bounds = L.latLngBounds(pins.map((p) => p.displayCoords))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 })
      fitted.current = true
    }
  }, [pins, selectedId, map])

  return null
}

/* ------------------------------------------------------------------ */
/*  Panneau détail                                                      */
/* ------------------------------------------------------------------ */

function ProjetPanel({ projet, onClose }: { projet: ProjetSummary; onClose: () => void }) {
  const navigate = useNavigate()
  const si = STATUT_INFO[projet.statut] ?? { label: projet.statut, dot: 'bg-gray-400' }
  const nbEngins = projet.nombreEnginsAffectes ?? 0

  return (
    <div className="absolute top-4 right-4 z-[600] w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{projet.nom}</h3>
            {projet.codeProjet && (
              <p className="text-[11px] font-mono text-gray-400 dark:text-gray-500 mt-0.5">{projet.codeProjet}</p>
            )}
          </div>
          <button onClick={onClose} className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <span className={`w-2 h-2 rounded-full ${si.dot}`} />
            {si.label}
          </span>
          {projet.ville && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {projet.ville}
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
            {nbEngins} engin{nbEngins > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {projet.avancementGlobal > 0 && (
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1.5">
            <span>Avancement</span>
            <span className="font-bold text-gray-700 dark:text-gray-300">{Math.round(projet.avancementGlobal)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, projet.avancementGlobal)}%` }} />
          </div>
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60 flex gap-2">
        <button
          onClick={() => navigate(`/projets/${projet.id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          Voir le projet
        </button>
        {nbEngins > 0 && (
          <button
            onClick={() => navigate(`/engins?projet=${projet.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-primary text-primary dark:text-primary-light hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
          >
            {nbEngins} engin{nbEngins > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Composant principal                                                */
/* ------------------------------------------------------------------ */

export default function ChantierMap({ className = '' }: { className?: string }) {
  const theme = useAppSelector((s) => s.ui.theme)
  const isDark = theme === 'dark'
  const tile = isDark ? TILE_DARK : TILE_LIGHT

  const [projets, setProjets] = useState<ProjetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    projetApi.findAll(0, 200).then((page) => {
      if (!cancelled) { setProjets(page.content); setLoading(false) }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Filtrer géolocalisés + décaler les markers trop proches
  const pins = useMemo<ProjetPin[]>(() => {
    const geolocated = projets
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        projet: p,
        coords: [p.latitude!, p.longitude!] as [number, number],
      }))

    return spreadOverlappingMarkers(geolocated)
  }, [projets])

  const selectedProjet = useMemo(
    () => projets.find((p) => p.id === selectedId) ?? null,
    [projets, selectedId],
  )

  const handleMarkerClick = useCallback((id: number) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  const sansCoords = projets.length - pins.length

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 shadow-sm ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Chargement des projets…</span>
          </div>
        </div>
      )}

      <MapContainer
        center={GABON_CENTER}
        zoom={GABON_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={GABON_BOUNDS}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        style={{ minHeight: 520 }}
        zoomControl={false}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />
        <ZoomControl position="bottomright" />
        <FitBounds pins={pins} selectedId={selectedId} />

        {pins.map(({ projet, displayCoords }) => {
          const nbEngins = projet.nombreEnginsAffectes ?? 0
          return (
            <Marker
              key={projet.id}
              position={displayCoords}
              icon={createProjetMarker(projet.statut, selectedId === projet.id)}
              eventHandlers={{ click: () => handleMarkerClick(projet.id) }}
            >
              <Tooltip
                permanent
                direction="right"
                offset={[14, -4]}
                className="projet-tooltip"
              >
                <span dangerouslySetInnerHTML={{ __html: createTooltipContent(projet.nom, nbEngins) }} />
              </Tooltip>
            </Marker>
          )
        })}
      </MapContainer>

      {/* Panneau détail */}
      {selectedProjet && (
        <ProjetPanel projet={selectedProjet} onClose={() => setSelectedId(null)} />
      )}

      {/* Légende */}
      <div className="absolute bottom-3 left-3 z-[500] bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-xl px-4 py-2.5 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium">
          {Object.entries(STATUT_INFO)
            .filter(([key]) => pins.some((p) => p.projet.statut === key))
            .map(([key, { label, dot }]) => (
              <span key={key} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                {label}
              </span>
            ))}
        </div>
      </div>

      {/* Compteur */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-xl px-4 py-2.5 border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {pins.length} projet{pins.length > 1 ? 's' : ''}
            <span className="font-normal text-gray-500 dark:text-gray-400"> sur la carte</span>
          </p>
        </div>
        {sansCoords > 0 && (
          <div className="bg-amber-50/95 dark:bg-amber-900/30 backdrop-blur rounded-xl px-4 py-2 border border-amber-200 dark:border-amber-700/50 shadow-sm">
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
              {sansCoords} non géolocalisé{sansCoords > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
