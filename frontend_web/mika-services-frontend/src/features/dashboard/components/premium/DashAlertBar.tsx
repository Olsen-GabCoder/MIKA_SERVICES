import { useTranslation } from 'react-i18next'

export interface DashAlertBarProps {
  projetsEnRetard: number
  tachesEnRetard: number
  incidentsGraves: number
  risquesCritiques: number
  stocksBas: number
}

function Item({ value, label, variant }: { value: number; label: string; variant: 'danger' | 'warn' | 'muted' }) {
  const colorMap = { danger: 'var(--db-danger)', warn: 'var(--db-warn)', muted: 'var(--db-t1)' }
  return (
    <span className="inline-flex items-baseline gap-[7px] px-3.5 relative text-[12px]" style={{ color: 'var(--db-t2)' }}>
      <span className="font-semibold text-[13.5px] db-num db-tight" style={{ color: colorMap[variant] }}>{value}</span>
      {label}
    </span>
  )
}

export function DashAlertBar({ projetsEnRetard, tachesEnRetard, incidentsGraves, risquesCritiques, stocksBas }: DashAlertBarProps) {
  const { t } = useTranslation('common')

  return (
    <div
      className="flex items-center rounded-xl h-10 px-3.5 mb-3 overflow-hidden"
      style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out both' }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.1em] pr-3 mr-3 border-r"
        style={{ color: 'var(--db-t4)', borderColor: 'var(--db-border)' }}
      >
        {t('db.premium.alertes')}
      </span>

      <div className="flex items-center divide-x" style={{ '--tw-divide-color': 'var(--db-border)' } as React.CSSProperties}>
        {projetsEnRetard > 0 && <Item value={projetsEnRetard} label={t('db.premium.projetsRetard')} variant="danger" />}
        {tachesEnRetard > 0 && <Item value={tachesEnRetard} label={t('db.premium.tachesRetard')} variant="warn" />}
        {incidentsGraves > 0 && <Item value={incidentsGraves} label={t('db.premium.incidentsGraves')} variant="danger" />}
        {risquesCritiques > 0 && <Item value={risquesCritiques} label={t('db.premium.risqueCritique')} variant="danger" />}
        {stocksBas > 0 && <Item value={stocksBas} label={t('db.premium.stocksBas')} variant="warn" />}
      </div>

      <span className="ml-auto inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--db-success)', animation: 'db-pulse 2s infinite' }} />
        {t('db.premium.tempsReel')}
      </span>
    </div>
  )
}
