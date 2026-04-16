/**
 * MapStatsOverlay — Overlay de stats flottant sur la carte, style ProtonVPN.
 *
 * Affiché en bas à droite de la carte. Affiche :
 *  - Nombre de chantiers actifs
 *  - Répartition par santé (barre empilée mini)
 *  - Nombre d'engins en transit
 */

import type { ChantierMapData } from '../map/ChantierMap'

interface MapStatsOverlayProps {
  chantiers: ChantierMapData[]
  totalEngins: number
}

export default function MapStatsOverlay({ chantiers, totalEngins }: MapStatsOverlayProps) {
  const chantiersActifs = chantiers.length
  const ok = chantiers.filter((c) => c.health === 'ok').length
  const warning = chantiers.filter((c) => c.health === 'warning').length
  const critical = chantiers.filter((c) => c.health === 'critical').length

  // Compteur engins en transit
  const enTransit = chantiers.reduce(
    (acc, c) => acc + c.enginStatuts.filter((s) => s === 'EN_TRANSIT').length,
    0,
  )

  return (
    <div className="bg-[#0f1923]/90 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-2xl px-4 py-3 min-w-[240px]">
      {/* Titre */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
          Situation opérationnelle
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Chantiers</p>
          <p className="text-lg font-extrabold text-white">{chantiersActifs}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider">Engins déployés</p>
          <p className="text-lg font-extrabold text-white">{totalEngins}</p>
        </div>
      </div>

      {/* Barre de santé mini */}
      {chantiersActifs > 0 && (
        <div className="mt-3">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-white/[0.06]">
            {ok > 0 && (
              <div className="bg-green-500" style={{ width: `${(ok / chantiersActifs) * 100}%` }} />
            )}
            {warning > 0 && (
              <div className="bg-amber-500" style={{ width: `${(warning / chantiersActifs) * 100}%` }} />
            )}
            {critical > 0 && (
              <div className="bg-red-500" style={{ width: `${(critical / chantiersActifs) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-3 mt-1.5">
            {ok > 0 && (
              <span className="text-[9px] text-green-400/70">{ok} OK</span>
            )}
            {warning > 0 && (
              <span className="text-[9px] text-amber-400/70">{warning} Att.</span>
            )}
            {critical > 0 && (
              <span className="text-[9px] text-red-400/70">{critical} Crit.</span>
            )}
          </div>
        </div>
      )}

      {/* Transit */}
      {enTransit > 0 && (
        <div className="mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          <span className="text-[11px] font-medium text-indigo-300">
            {enTransit} engin{enTransit > 1 ? 's' : ''} en transit
          </span>
        </div>
      )}
    </div>
  )
}
