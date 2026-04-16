/**
 * ParcSummaryKpis — Barre de KPIs du parc matériel global.
 *
 * 4 indicateurs clés :
 *  - Total engins
 *  - En service (bleu)
 *  - Alertes (panne + maintenance — ambre/rouge)
 *  - Disponibles (vert)
 */

import type { EnginSummary } from '@/types/materiel'

interface ParcSummaryKpisProps {
  engins: EnginSummary[]
  loading?: boolean
}

interface KpiDef {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  bgColor: string
}

export default function ParcSummaryKpis({ engins, loading }: ParcSummaryKpisProps) {
  const total = engins.length
  const enService = engins.filter((e) => e.statut === 'EN_SERVICE').length
  const disponibles = engins.filter((e) => e.statut === 'DISPONIBLE').length
  const alertes = engins.filter((e) => e.statut === 'EN_PANNE' || e.statut === 'EN_MAINTENANCE' || e.statut === 'HORS_SERVICE').length

  const kpis: KpiDef[] = [
    {
      label: 'Total parc',
      value: total,
      color: 'text-gray-700 dark:text-gray-200',
      bgColor: 'bg-gray-100 dark:bg-gray-700/50',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      label: 'En service',
      value: enService,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/25',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Alertes',
      value: alertes,
      color: alertes > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500',
      bgColor: alertes > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800/50',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: 'Disponibles',
      value: disponibles,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/60 px-4 py-3 animate-pulse">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/60 px-4 py-3 transition-shadow hover:shadow-md"
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${kpi.bgColor} flex items-center justify-center ${kpi.color}`}>
            {kpi.icon}
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {kpi.label}
            </p>
            <p className={`text-xl font-bold ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
