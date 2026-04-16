/**
 * ChantierSidePanel — Panneau latéral contextuel pour un chantier sélectionné.
 *
 * Apparait en slide-in quand un marker de la carte est cliqué.
 * Affiche : header avec nom/statut du chantier, répartition par statut,
 * et la liste des engins affectés sous forme de mini-cartes.
 */

import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { enginApi } from '@/api/enginApi'
import type { EnginSummary } from '@/types/materiel'
import type { ChantierMapData, ChantierAffectationRef } from '../map/ChantierMap'
import type { ChantierHealthStatus } from '../map/chantierMarker'
import EnginMiniCard from './EnginMiniCard'

interface ChantierSidePanelProps {
  chantier: ChantierMapData | null
  onClose: () => void
}

/* ---- Helpers ---- */

const HEALTH_CONFIG: Record<ChantierHealthStatus, { label: string; dot: string; bg: string; text: string }> = {
  ok:       { label: 'Opérationnel',  dot: 'bg-green-500',  bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-400' },
  warning:  { label: 'Attention',     dot: 'bg-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-700 dark:text-amber-400' },
  critical: { label: 'Critique',      dot: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-600 dark:text-red-400' },
  empty:    { label: 'Aucun engin',   dot: 'bg-gray-400',   bg: 'bg-gray-50 dark:bg-gray-800/50',    text: 'text-gray-500 dark:text-gray-400' },
}

interface EnginWithDetails {
  affectation: ChantierAffectationRef
  engin: EnginSummary | null
}

/* ---- Composant ---- */

export default function ChantierSidePanel({ chantier, onClose }: ChantierSidePanelProps) {
  const navigate = useNavigate()
  const [enginDetails, setEnginDetails] = useState<EnginWithDetails[]>([])
  const [loadingEngins, setLoadingEngins] = useState(false)

  const loadEnginDetails = useCallback(async (affectations: ChantierAffectationRef[]) => {
    if (affectations.length === 0) {
      setEnginDetails([])
      return
    }

    setLoadingEngins(true)
    try {
      const details = await Promise.all(
        affectations.map(async (aff) => {
          try {
            const engin = await enginApi.findById(aff.enginId)
            return { affectation: aff, engin: engin as unknown as EnginSummary }
          } catch {
            return { affectation: aff, engin: null }
          }
        }),
      )
      setEnginDetails(details)
    } finally {
      setLoadingEngins(false)
    }
  }, [])

  useEffect(() => {
    if (chantier) {
      loadEnginDetails(chantier.affectations)
    } else {
      setEnginDetails([])
    }
  }, [chantier, loadEnginDetails])

  if (!chantier) return null

  const hc = HEALTH_CONFIG[chantier.health]

  // Répartition par statut
  const statutCounts: Record<string, number> = {}
  for (const s of chantier.enginStatuts) {
    statutCounts[s] = (statutCounts[s] || 0) + 1
  }

  const statutBars: { statut: string; count: number; color: string }[] = [
    { statut: 'EN_SERVICE', count: statutCounts['EN_SERVICE'] || 0, color: 'bg-blue-500' },
    { statut: 'DISPONIBLE', count: statutCounts['DISPONIBLE'] || 0, color: 'bg-green-500' },
    { statut: 'EN_MAINTENANCE', count: statutCounts['EN_MAINTENANCE'] || 0, color: 'bg-amber-500' },
    { statut: 'EN_PANNE', count: statutCounts['EN_PANNE'] || 0, color: 'bg-red-500' },
    { statut: 'HORS_SERVICE', count: statutCounts['HORS_SERVICE'] || 0, color: 'bg-gray-400' },
    { statut: 'EN_TRANSIT', count: statutCounts['EN_TRANSIT'] || 0, color: 'bg-indigo-500' },
  ].filter((b) => b.count > 0)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700/60 overflow-hidden animate-slide-in-right">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
              {chantier.projetNom}
            </h2>
            {chantier.codeProjet && (
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                {chantier.codeProjet}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Badge santé */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${hc.bg} ${hc.text}`}>
            <span className={`w-2 h-2 rounded-full ${hc.dot}`} />
            {hc.label}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {chantier.affectations.length} engin{chantier.affectations.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Barre de répartition */}
      {statutBars.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Répartition
          </p>
          {/* Barre horizontale empilée */}
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
            {statutBars.map((b) => (
              <div
                key={b.statut}
                className={`${b.color} transition-all`}
                style={{ width: `${(b.count / chantier.affectations.length) * 100}%` }}
                title={`${b.statut.replace(/_/g, ' ')} : ${b.count}`}
              />
            ))}
          </div>
          {/* Légende */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {statutBars.map((b) => (
              <span key={b.statut} className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                <span className={`w-2 h-2 rounded-full ${b.color}`} />
                {b.statut.replace(/_/g, ' ')} ({b.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Liste des engins */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
          Engins sur site
        </p>

        {loadingEngins && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        )}

        {!loadingEngins && enginDetails.length === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            <p className="text-sm">Aucun engin affecté</p>
          </div>
        )}

        {!loadingEngins &&
          enginDetails.map(({ affectation, engin }) => (
            <EnginMiniCard
              key={affectation.id}
              code={affectation.enginCode}
              nom={affectation.enginNom}
              type={engin?.type ?? 'AUTRE'}
              statut={engin?.statut ?? 'DISPONIBLE'}
              marque={engin?.marque ?? undefined}
              onClick={() => navigate(`/materiel/engins/${affectation.enginId}`)}
            />
          ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => navigate(`/projets/${chantier.projetId}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Voir le projet
        </button>
      </div>
    </div>
  )
}
