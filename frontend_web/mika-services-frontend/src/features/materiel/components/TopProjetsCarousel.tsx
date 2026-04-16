/**
 * TopProjetsCarousel — Scroll horizontal des projets les plus actifs.
 *
 * Affiche uniquement les projets ayant des engins affectés,
 * triés par nombre d'engins décroissant.
 * Scroll horizontal fluide avec flèches.
 */

import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCountUp } from '../hooks/useCountUp'
import type { ProjetSummary } from '@/types/projet'

const STATUT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  EN_COURS:             { label: 'En cours',   color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-500' },
  PLANIFIE:             { label: 'Planifié',   color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-500' },
  EN_ATTENTE:           { label: 'En attente', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500' },
  SUSPENDU:             { label: 'Suspendu',   color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-500' },
  TERMINE:              { label: 'Terminé',    color: 'text-green-600 dark:text-green-400',  bg: 'bg-green-500' },
  RECEPTION_PROVISOIRE: { label: 'Réc. prov.', color: 'text-teal-600 dark:text-teal-400',   bg: 'bg-teal-500' },
  RECEPTION_DEFINITIVE: { label: 'Réc. déf.',  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' },
}

/* ---- Mini carte projet ---- */
function ProjetTile({ projet, index }: { projet: ProjetSummary; index: number }) {
  const navigate = useNavigate()
  const nbEngins = projet.nombreEnginsAffectes ?? 0
  const animatedEngins = useCountUp(nbEngins, 1000, 600 + index * 120)
  const cfg = STATUT_CFG[projet.statut] ?? { label: projet.statut, color: 'text-gray-500', bg: 'bg-gray-400' }

  return (
    <div
      onClick={() => navigate(`/projets/${projet.id}`)}
      className="flex-shrink-0 w-72 rounded-2xl border border-gray-200 dark:border-gray-700/50
                 bg-white dark:bg-gray-800/60 overflow-hidden cursor-pointer
                 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40
                 transition-all duration-300 ease-out group
                 animate-fade-slide-up"
      style={{ animationDelay: `${400 + index * 100}ms` }}
    >
      {/* Barre couleur */}
      <div className={`h-1 ${cfg.bg} group-hover:h-1.5 transition-all`} />

      <div className="p-4">
        {/* Engins (gros) */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-3xl font-extrabold text-primary dark:text-primary-light tabular-nums leading-none">
              {animatedEngins}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">
              engin{nbEngins > 1 ? 's' : ''} affecté{nbEngins > 1 ? 's' : ''}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color} bg-gray-50 dark:bg-gray-700/40`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
            {cfg.label}
          </span>
        </div>

        {/* Nom */}
        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
          {projet.nom}
        </h4>

        {/* Ville */}
        {projet.ville && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {projet.ville}
          </p>
        )}

        {/* Avancement */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mb-1">
            <span>Avancement</span>
            <span className="font-bold text-gray-600 dark:text-gray-300">{Math.round(projet.avancementGlobal)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark animate-progress-grow"
              style={{
                '--progress-target': `${Math.min(100, projet.avancementGlobal)}%`,
                animationDelay: `${800 + index * 100}ms`,
              } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Actions au hover */}
        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/projets/${projet.id}`) }}
            className="flex-1 text-[11px] font-semibold text-center py-1.5 rounded-lg
                       text-primary hover:bg-primary/5 transition-colors"
          >
            Détails
          </button>
          {nbEngins > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/engins?projet=${projet.id}`) }}
              className="flex-1 text-[11px] font-semibold text-center py-1.5 rounded-lg
                         text-primary hover:bg-primary/5 transition-colors"
            >
              Engins
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- Composant principal ---- */

export default function TopProjetsCarousel({ projets }: { projets: ProjetSummary[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const topProjets = projets
    .filter((p) => (p.nombreEnginsAffectes ?? 0) > 0)
    .sort((a, b) => (b.nombreEnginsAffectes ?? 0) - (a.nombreEnginsAffectes ?? 0))
    .slice(0, 12)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 300
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' })
  }

  if (topProjets.length === 0) return null

  return (
    <div className="relative">
      {/* Flèche gauche */}
      <button
        onClick={() => scroll('left')}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10
                   w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                   shadow-lg flex items-center justify-center
                   text-gray-500 hover:text-primary transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {topProjets.map((p, i) => (
          <div key={p.id} style={{ scrollSnapAlign: 'start' }}>
            <ProjetTile projet={p} index={i} />
          </div>
        ))}
      </div>

      {/* Flèche droite */}
      <button
        onClick={() => scroll('right')}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10
                   w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                   shadow-lg flex items-center justify-center
                   text-gray-500 hover:text-primary transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
