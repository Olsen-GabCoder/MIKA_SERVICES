/**
 * FleetDonutChart — Graphe anneau animé de la répartition du parc.
 *
 * Centre : chiffre total animé (count-up).
 * Segments : par statut, colorés, avec légende interactive.
 */

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PieAny = Pie as React.ComponentType<any>
import { useCountUp } from '../hooks/useCountUp'

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  EN_SERVICE:     { label: 'En service',     color: '#3b82f6' },
  DISPONIBLE:     { label: 'Disponible',     color: '#22c55e' },
  EN_MAINTENANCE: { label: 'Maintenance',    color: '#f59e0b' },
  EN_PANNE:       { label: 'En panne',       color: '#ef4444' },
  HORS_SERVICE:   { label: 'Hors service',   color: '#6b7280' },
  EN_TRANSIT:     { label: 'En transit',     color: '#8b5cf6' },
}

interface FleetDonutChartProps {
  data: { statut: string; count: number }[]
  total: number
}

/* Active shape (segment survolé = agrandi) */
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: `drop-shadow(0 0 8px ${fill}66)`, transition: 'all 0.3s ease' }}
      />
    </g>
  )
}

export default function FleetDonutChart({ data, total }: FleetDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const animatedTotal = useCountUp(total, 1600, 200)

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: STATUT_CONFIG[d.statut]?.label ?? d.statut,
      value: d.count,
      color: STATUT_CONFIG[d.statut]?.color ?? '#6b7280',
      statut: d.statut,
    }))

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
      {/* Donut */}
      <div className="relative w-64 h-64 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <PieAny
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_: unknown, index: number) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationBegin={300}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {chartData.map((entry: { color: string }, i: number) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </PieAny>
          </PieChart>
        </ResponsiveContainer>

        {/* Centre : total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">
            {animatedTotal}
          </p>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            engins
          </p>
        </div>
      </div>

      {/* Légende interactive */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {chartData.map((entry, i) => {
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
          const isActive = activeIndex === i
          return (
            <div
              key={entry.statut}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                ${isActive
                  ? 'bg-gray-100 dark:bg-gray-700/50 shadow-sm scale-[1.02]'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: entry.color }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                {entry.name}
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                {entry.value}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 w-10 text-right tabular-nums">
                {pct}%
              </span>
              {/* Mini barre */}
              <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full transition-all duration-500 animate-progress-grow"
                  style={{
                    '--progress-target': `${pct}%`,
                    background: entry.color,
                    animationDelay: `${600 + i * 100}ms`,
                  } as React.CSSProperties}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
