/**
 * AlertesBanner — Bandeau d'alertes pour projets à problèmes.
 *
 * Affiche les projets suspendus et ceux avec engins en panne.
 * Animation pulse sur l'icône d'alerte.
 */

import { useNavigate } from 'react-router-dom'
import type { ProjetSummary } from '@/types/projet'

interface AlertesBannerProps {
  projetsSuspendus: ProjetSummary[]
  nbEnginsPanne: number
}

export default function AlertesBanner({ projetsSuspendus, nbEnginsPanne }: AlertesBannerProps) {
  const navigate = useNavigate()
  const hasAlertes = projetsSuspendus.length > 0 || nbEnginsPanne > 0

  if (!hasAlertes) return null

  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/10 px-5 py-4 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-start gap-3">
        {/* Icône pulsante */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">Alertes en cours</p>
          <div className="flex flex-wrap gap-3 mt-2">
            {projetsSuspendus.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projets/${p.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                           bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400
                           hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {p.nom.length > 30 ? p.nom.slice(0, 28) + '…' : p.nom}
                <span className="text-red-400 dark:text-red-500">— Suspendu</span>
              </button>
            ))}
            {nbEnginsPanne > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                             bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {nbEnginsPanne} engin{nbEnginsPanne > 1 ? 's' : ''} en panne / maintenance
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
