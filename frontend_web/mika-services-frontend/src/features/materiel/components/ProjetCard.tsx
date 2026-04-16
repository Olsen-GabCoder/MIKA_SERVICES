/**
 * ProjetCard — Carte visuelle d'un projet avec animations.
 *
 * Affiche : nom, ville, statut (badge coloré + point pulse),
 * nombre d'engins (gros chiffre), barre d'avancement animée.
 * Hover : lift + bordure colorée. Entrée : fade-slide staggeré.
 */

import { useNavigate } from 'react-router-dom'
import { useCountUp } from '../hooks/useCountUp'

/* ------------------------------------------------------------------ */
/*  Statut config                                                       */
/* ------------------------------------------------------------------ */

const STATUT_CONFIG: Record<string, {
  label: string
  dot: string
  border: string
  bg: string
  text: string
  pulse: boolean
}> = {
  EN_COURS:             { label: 'En cours',    dot: 'bg-blue-500',    border: 'hover:border-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-700 dark:text-blue-400',    pulse: true },
  PLANIFIE:             { label: 'Planifié',    dot: 'bg-amber-500',   border: 'hover:border-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',   pulse: false },
  EN_ATTENTE:           { label: 'En attente',  dot: 'bg-violet-500',  border: 'hover:border-violet-400',  bg: 'bg-violet-50 dark:bg-violet-900/20',  text: 'text-violet-700 dark:text-violet-400',  pulse: false },
  SUSPENDU:             { label: 'Suspendu',    dot: 'bg-red-500',     border: 'hover:border-red-400',     bg: 'bg-red-50 dark:bg-red-900/20',     text: 'text-red-600 dark:text-red-400',     pulse: true },
  TERMINE:              { label: 'Terminé',     dot: 'bg-green-500',   border: 'hover:border-green-400',   bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',   pulse: false },
  ABANDONNE:            { label: 'Abandonné',   dot: 'bg-gray-400',    border: 'hover:border-gray-400',    bg: 'bg-gray-50 dark:bg-gray-700/30',    text: 'text-gray-600 dark:text-gray-400',    pulse: false },
  RECEPTION_PROVISOIRE: { label: 'Réc. prov.',  dot: 'bg-teal-500',    border: 'hover:border-teal-400',    bg: 'bg-teal-50 dark:bg-teal-900/20',    text: 'text-teal-700 dark:text-teal-400',    pulse: false },
  RECEPTION_DEFINITIVE: { label: 'Réc. déf.',   dot: 'bg-emerald-500', border: 'hover:border-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', pulse: false },
}

const DEFAULT_CFG = { label: '—', dot: 'bg-gray-400', border: 'hover:border-gray-400', bg: 'bg-gray-50 dark:bg-gray-700/30', text: 'text-gray-600 dark:text-gray-400', pulse: false }

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface ProjetCardProps {
  id: number
  nom: string
  codeProjet?: string
  ville?: string
  statut: string
  avancement: number
  nbEngins: number
  index: number       // pour le stagger delay
}

/* ------------------------------------------------------------------ */
/*  Composant                                                           */
/* ------------------------------------------------------------------ */

export default function ProjetCard({
  id, nom, codeProjet, ville, statut, avancement, nbEngins, index,
}: ProjetCardProps) {
  const navigate = useNavigate()
  const cfg = STATUT_CONFIG[statut] ?? DEFAULT_CFG
  const animatedEngins = useCountUp(nbEngins, 1000, 400 + index * 80)

  return (
    <div
      className={`group relative rounded-2xl border border-gray-200 dark:border-gray-700/50
                  bg-white dark:bg-gray-800/60 overflow-hidden
                  transition-all duration-300 ease-out cursor-pointer
                  hover:shadow-xl hover:-translate-y-1 ${cfg.border}
                  animate-fade-slide-up`}
      style={{ animationDelay: `${150 + index * 60}ms` }}
      onClick={() => navigate(`/projets/${id}`)}
    >
      {/* Barre de statut colorée en haut */}
      <div className={`h-1 ${cfg.dot} transition-all duration-300 group-hover:h-1.5`} />

      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
              {nom}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {ville && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {ville}
                </span>
              )}
              {codeProjet && (
                <span className="text-[10px] font-mono text-gray-300 dark:text-gray-600">{codeProjet}</span>
              )}
            </div>
          </div>

          {/* Badge engins */}
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-extrabold text-primary dark:text-primary-light tabular-nums leading-none">
              {animatedEngins}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              engin{nbEngins > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Statut */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className="relative flex h-2 w-2">
              {cfg.pulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-40`} />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
            </span>
            {cfg.label}
          </span>
        </div>

        {/* Avancement */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Avancement</span>
            <span className="font-bold text-gray-700 dark:text-gray-300">{Math.round(avancement)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark animate-progress-grow"
              style={{
                '--progress-target': `${Math.min(100, avancement)}%`,
                animationDelay: `${500 + index * 60}ms`,
              } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      {/* Footer actions (visible au hover) */}
      <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700/40
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/projets/${id}`) }}
          className="flex-1 text-center text-[11px] font-semibold text-primary dark:text-primary-light
                     hover:underline transition-colors py-1"
        >
          Voir le projet
        </button>
        {nbEngins > 0 && (
          <>
            <div className="w-px bg-gray-200 dark:bg-gray-700" />
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/engins?projet=${id}`) }}
              className="flex-1 text-center text-[11px] font-semibold text-primary dark:text-primary-light
                         hover:underline transition-colors py-1"
            >
              Voir les engins
            </button>
          </>
        )}
      </div>
    </div>
  )
}
