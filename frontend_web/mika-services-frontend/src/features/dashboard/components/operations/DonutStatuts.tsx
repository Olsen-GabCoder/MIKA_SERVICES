import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { BentoCard } from '../shared/BentoCard'
import { DashboardTooltip } from '../shared/CustomTooltip'
import { useChartColors } from '../../hooks/useChartColors'
import { STATUT_LABELS, STATUT_COLOR_INDEX } from '../../constants/projetStatuts'
import type { StatutProjet } from '@/types/projet'

export interface DonutStatutsProps {
  parStatut: Record<string, number>
}

export function DonutStatuts({ parStatut }: DonutStatutsProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const colors = useChartColors()

  const data = useMemo(() => {
    return Object.entries(parStatut)
      .filter(([, v]) => v > 0)
      .map(([s, v]) => ({
        name: STATUT_LABELS[s as StatutProjet] ?? s,
        value: v,
        statut: s,
        color: colors.series[STATUT_COLOR_INDEX[s as StatutProjet] ?? 0],
      }))
      .sort((a, b) => b.value - a.value)
  }, [parStatut, colors.series])

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])

  return (
    <BentoCard
      title={t('db.operations.donutStatuts')}
      subtitle={`${total} ${t('db.kpi.totalProjects')}`}
      colSpan={6}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-[var(--db-text-faint)]">
          {t('db.operations.emptyDonut')}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-1/2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="42%"
                  outerRadius="72%"
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  onClick={(_, idx) => navigate(`/projets?statut=${data[idx].statut}`)}
                  cursor="pointer"
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<DashboardTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="db-display-num text-3xl text-[var(--db-text-primary)]">{total}</p>
              <p className="text-[10px] text-[var(--db-text-faint)] uppercase tracking-widest">{t('db.kpi.totalProjects')}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2 w-full sm:w-1/2">
            {data.map(d => {
              const pct = Math.round((d.value / Math.max(total, 1)) * 100)
              return (
                <button
                  key={d.statut}
                  type="button"
                  onClick={() => navigate(`/projets?statut=${d.statut}`)}
                  className="flex items-center gap-2 text-xs hover:bg-[var(--db-bg-base)] rounded-lg px-2 py-1.5 transition-colors min-h-[36px]"
                >
                  <span className="w-3 h-3 rounded-md shrink-0" style={{ background: d.color }} />
                  <span className="text-[var(--db-text-muted)] truncate flex-1 text-left">{d.name}</span>
                  <span className="db-display-num text-sm text-[var(--db-text-primary)] shrink-0">{d.value}</span>
                  <span className="text-[10px] text-[var(--db-text-faint)] w-8 text-right shrink-0">{pct}%</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </BentoCard>
  )
}
