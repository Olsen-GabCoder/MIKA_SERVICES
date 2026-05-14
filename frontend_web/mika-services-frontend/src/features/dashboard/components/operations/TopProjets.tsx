import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { BentoCard } from '../shared/BentoCard'
import { DashboardTooltip } from '../shared/CustomTooltip'
import { useChartColors } from '../../hooks/useChartColors'
import type { ProjetSummary } from '@/types/projet'

export interface TopProjetsProps {
  projets: ProjetSummary[]
}

export function TopProjets({ projets }: TopProjetsProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const colors = useChartColors()
  const { formatMontant, formatShort } = useFormatNumber()

  const data = useMemo(() =>
    [...projets]
      .filter(p => (p.montantHT ?? 0) > 0)
      .sort((a, b) => (b.montantHT ?? 0) - (a.montantHT ?? 0))
      .slice(0, 8)
      .map(p => ({
        id: p.id,
        name: p.nom.length > 22 ? p.nom.slice(0, 20) + '…' : p.nom,
        montant: p.montantHT ?? 0,
      })),
    [projets],
  )

  return (
    <BentoCard
      title={t('db.operations.topProjets')}
      subtitle={t('db.topProjets.subtitle')}
      colSpan={6}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-sm text-[var(--db-text-faint)]">
          {t('db.operations.emptyTopProjets')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
            onClick={(state) => {
              if (state?.activePayload?.[0]?.payload?.id) {
                navigate(`/projets/${state.activePayload[0].payload.id}`)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.grid} />
            <XAxis
              type="number"
              tickFormatter={v => formatShort(v)}
              tick={{ fontSize: 10, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 10, fill: colors.tick }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<DashboardTooltip formatter={formatMontant} />} />
            <Bar
              dataKey="montant"
              name={t('db.topProjets.amount')}
              fill={colors.series[2]}
              radius={[0, 8, 8, 0]}
              barSize={18}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </BentoCard>
  )
}
