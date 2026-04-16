/**
 * EnginMiniCard — Carte compacte d'un engin affecté à un chantier.
 *
 * Affiche : icône type, code, nom, statut coloré, heures compteur.
 * Utilisée dans le ChantierSidePanel pour lister les engins du chantier sélectionné.
 */

import EnginTypeIcon from '../icons/EnginTypeIcon'

const STATUT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  DISPONIBLE:     { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400',   label: 'Disponible' },
  EN_SERVICE:     { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400',     label: 'En service' },
  EN_MAINTENANCE: { bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400',   label: 'Maintenance' },
  EN_PANNE:       { bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-600 dark:text-red-400',       label: 'En panne' },
  HORS_SERVICE:   { bg: 'bg-gray-100 dark:bg-gray-700/40',    text: 'text-gray-600 dark:text-gray-400',     label: 'Hors service' },
  EN_TRANSIT:     { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', label: 'En transit' },
}

interface EnginMiniCardProps {
  code: string
  nom: string
  type: string
  statut: string
  marque?: string
  onClick?: () => void
}

export default function EnginMiniCard({ code, nom, type, statut, marque, onClick }: EnginMiniCardProps) {
  const style = STATUT_STYLE[statut] ?? STATUT_STYLE.DISPONIBLE

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
    >
      {/* Icone type */}
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
        <EnginTypeIcon type={type} size={20} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400">{code}</span>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${style.bg} ${style.text}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {style.label}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{nom}</p>
        {marque && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{marque}</p>
        )}
      </div>

      {/* Chevron */}
      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
