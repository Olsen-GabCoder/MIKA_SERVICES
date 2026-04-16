/**
 * ChantierListSidebar — Sidebar gauche style ProtonVPN.
 *
 * Panel sombre glassmorphism flottant sur la carte :
 *  - Header : statut du parc (total engins, santé)
 *  - Module tabs (Engins / Mouvements / DMA / Matériaux)
 *  - Barre de recherche
 *  - Liste déroulante de chantiers expandables
 *    (clic → zoom carte + expand → liste engins)
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MaterielModuleTabs } from './MaterielModuleTabs'
import EnginTypeIcon from '../icons/EnginTypeIcon'
import type { ChantierMapData } from '../map/ChantierMap'
import type { ChantierHealthStatus } from '../map/chantierMarker'

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface ChantierListSidebarProps {
  chantiers: ChantierMapData[]
  selectedId: number | null
  onSelectChantier: (id: number | null) => void
  totalEngins: number
  enginsEnService: number
  enginsAlertes: number
  loading: boolean
  onCreateEngin: () => void
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const HEALTH_DOT: Record<ChantierHealthStatus, string> = {
  ok: 'bg-green-400 shadow-green-400/50',
  warning: 'bg-amber-400 shadow-amber-400/50',
  critical: 'bg-red-400 shadow-red-400/50',
  empty: 'bg-gray-500 shadow-gray-500/30',
}

const HEALTH_LABEL: Record<ChantierHealthStatus, string> = {
  ok: 'Opérationnel',
  warning: 'Attention',
  critical: 'Critique',
  empty: 'Vide',
}

/* ------------------------------------------------------------------ */
/*  Composant                                                           */
/* ------------------------------------------------------------------ */

export default function ChantierListSidebar({
  chantiers,
  selectedId,
  onSelectChantier,
  totalEngins,
  enginsEnService,
  enginsAlertes,
  loading,
  onCreateEngin,
}: ChantierListSidebarProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return chantiers
    const q = search.toLowerCase()
    return chantiers.filter(
      (c) =>
        c.projetNom.toLowerCase().includes(q) ||
        c.codeProjet?.toLowerCase().includes(q),
    )
  }, [chantiers, search])

  const handleChantierClick = (id: number) => {
    if (selectedId === id) {
      onSelectChantier(null)
      setExpandedId(null)
    } else {
      onSelectChantier(id)
      setExpandedId(id)
    }
  }

  const handleToggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="h-full flex flex-col w-[340px] min-w-[300px] bg-[#0f1923]/95 backdrop-blur-xl border-r border-white/[0.06]">

      {/* ====== HEADER STATUS ====== */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.06]">
        {/* Indicateur connecté */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping opacity-30" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-green-400">
            Parc Actif
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Total</p>
            <p className="text-xl font-extrabold text-white">{loading ? '—' : totalEngins}</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-400/70 uppercase tracking-wider font-medium">Service</p>
            <p className="text-xl font-extrabold text-blue-400">{loading ? '—' : enginsEnService}</p>
          </div>
          <div>
            <p className="text-[10px] text-red-400/70 uppercase tracking-wider font-medium">Alertes</p>
            <p className={`text-xl font-extrabold ${enginsAlertes > 0 ? 'text-red-400' : 'text-gray-600'}`}>
              {loading ? '—' : enginsAlertes}
            </p>
          </div>
        </div>

        {/* Bouton créer */}
        <button
          type="button"
          onClick={onCreateEngin}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                     bg-gradient-to-r from-primary to-primary-dark
                     text-white text-sm font-bold
                     shadow-lg shadow-primary/25
                     hover:shadow-primary/40 hover:scale-[1.01]
                     active:scale-[0.99]
                     transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvel engin
        </button>
      </div>

      {/* ====== MODULE TABS ====== */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.06]">
        <MaterielModuleTabs />
      </div>

      {/* ====== SEARCH ====== */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.06]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un chantier..."
            className="w-full pl-9 pr-4 py-2 rounded-lg
                       bg-white/[0.05] border border-white/[0.08]
                       text-sm text-gray-200 placeholder-gray-600
                       focus:outline-none focus:border-primary/50 focus:bg-white/[0.08]
                       transition-colors"
          />
        </div>
      </div>

      {/* ====== CHANTIER LIST ====== */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading && (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-600">Aucun chantier trouvé</p>
          </div>
        )}

        {!loading && filtered.map((ch) => {
          const isSelected = selectedId === ch.projetId
          const isExpanded = expandedId === ch.projetId

          return (
            <div key={ch.projetId} className="border-b border-white/[0.04]">
              {/* Chantier row */}
              <button
                type="button"
                onClick={() => handleChantierClick(ch.projetId)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 group
                  ${isSelected
                    ? 'bg-white/[0.08] border-l-2 border-l-primary'
                    : 'hover:bg-white/[0.04] border-l-2 border-l-transparent'
                  }`}
              >
                {/* Health dot */}
                <div className="flex-shrink-0 relative">
                  <div className={`w-3 h-3 rounded-full shadow-lg ${HEALTH_DOT[ch.health]}`} />
                  {ch.health === 'critical' && (
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-400 animate-ping opacity-40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate transition-colors ${
                    isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}>
                    {ch.projetNom}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {ch.codeProjet && (
                      <span className="text-[10px] font-mono text-gray-600">{ch.codeProjet}</span>
                    )}
                    <span className={`text-[10px] font-medium ${
                      ch.health === 'ok' ? 'text-green-500/70' :
                      ch.health === 'warning' ? 'text-amber-500/70' :
                      ch.health === 'critical' ? 'text-red-500/70' :
                      'text-gray-600'
                    }`}>
                      {HEALTH_LABEL[ch.health]}
                    </span>
                  </div>
                </div>

                {/* Count + chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-primary/20 text-primary-light'
                      : 'bg-white/[0.06] text-gray-400'
                  }`}>
                    {ch.enginCount}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleExpand(ch.projetId, e)}
                    className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                  >
                    <svg
                      className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </button>

              {/* Expanded engin list */}
              {isExpanded && (
                <div className="bg-white/[0.02] border-t border-white/[0.04] px-4 py-2 space-y-1 animate-slide-down">
                  {ch.affectations.length === 0 && (
                    <p className="text-xs text-gray-600 py-2 text-center">Aucun engin affecté</p>
                  )}
                  {ch.affectations.map((aff) => {
                    const enginStatut = ch.enginStatuts[ch.affectations.indexOf(aff)] || 'DISPONIBLE'
                    return (
                      <button
                        key={aff.id}
                        type="button"
                        onClick={() => navigate(`/materiel/engins/${aff.enginId}`)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                                   hover:bg-white/[0.05] transition-colors text-left group/engin"
                      >
                        <div className="flex-shrink-0 text-gray-500 group-hover/engin:text-primary-light transition-colors">
                          <EnginTypeIcon type="AUTRE" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-400 group-hover/engin:text-gray-200 truncate transition-colors">
                            {aff.enginNom}
                          </p>
                          <p className="text-[10px] font-mono text-gray-600">{aff.enginCode}</p>
                        </div>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          enginStatut === 'EN_SERVICE' ? 'bg-blue-400' :
                          enginStatut === 'DISPONIBLE' ? 'bg-green-400' :
                          enginStatut === 'EN_PANNE' ? 'bg-red-400' :
                          enginStatut === 'EN_MAINTENANCE' ? 'bg-amber-400' :
                          enginStatut === 'HORS_SERVICE' ? 'bg-gray-500' :
                          'bg-indigo-400'
                        }`} />
                      </button>
                    )
                  })}

                  {/* Lien vers projet */}
                  <button
                    type="button"
                    onClick={() => navigate(`/projets/${ch.projetId}`)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-1
                               rounded-lg border border-white/[0.06]
                               text-[11px] font-medium text-gray-500 hover:text-primary-light hover:border-primary/30
                               transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6m0 0v6m0-6L10 14" />
                    </svg>
                    Voir le projet
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ====== FOOTER LÉGENDE ====== */}
      <div className="shrink-0 px-5 py-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {(['ok', 'warning', 'critical', 'empty'] as const).map((h) => (
              <span key={h} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${HEALTH_DOT[h].split(' ')[0]}`} />
                <span className="text-[9px] text-gray-600 uppercase tracking-wider">{HEALTH_LABEL[h]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
