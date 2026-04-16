/**
 * AnimatedKpiBar — Barre de KPIs animés avec count-up.
 */

import { useCountUp } from '../hooks/useCountUp'

interface KpiItem {
  label: string
  value: number
  color: string       // text color class
  bgColor: string     // bg color class
  icon: React.ReactNode
  pulse?: boolean     // point clignotant
}

function KpiCard({ item, index }: { item: KpiItem; index: number }) {
  const animatedValue = useCountUp(item.value, 1400, index * 150)

  return (
    <div
      className="relative flex items-center gap-3.5 rounded-2xl border border-gray-200 dark:border-gray-700/50
                 bg-white dark:bg-gray-800/60 px-5 py-4
                 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-gray-600
                 transition-all duration-300 ease-out
                 animate-fade-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center ${item.color}`}>
        {item.icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {item.label}
        </p>
        <div className="flex items-center gap-2">
          <p className={`text-2xl font-extrabold ${item.color} tabular-nums`}>
            {animatedValue}
          </p>
          {item.pulse && item.value > 0 && (
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${item.color.replace('text-', 'bg-')}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.color.replace('text-', 'bg-')}`} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface AnimatedKpiBarProps {
  totalEngins: number
  enService: number
  disponibles: number
  enPanne: number
  enTransit: number
  loading?: boolean
}

export default function AnimatedKpiBar({
  totalEngins, enService, disponibles, enPanne, enTransit, loading,
}: AnimatedKpiBarProps) {

  const kpis: KpiItem[] = [
    {
      label: 'Total parc',
      value: totalEngins,
      color: 'text-gray-700 dark:text-gray-200',
      bgColor: 'bg-gray-100 dark:bg-gray-700/50',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      label: 'En service',
      value: enService,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/25',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      pulse: true,
    },
    {
      label: 'Disponibles',
      value: disponibles,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      label: 'En panne',
      value: enPanne,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      pulse: true,
    },
    {
      label: 'En transit',
      value: enTransit,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/60 px-5 py-4 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {kpis.map((item, i) => (
        <KpiCard key={item.label} item={item} index={i} />
      ))}
    </div>
  )
}
