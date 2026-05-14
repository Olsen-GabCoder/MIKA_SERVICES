import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AlertChip } from '../shared/AlertChip'

export interface AlertBarAlerts {
  projetsEnRetard: number
  tachesEnRetard: number
  materiauxStockBas: number
  incidentsGraves: number
  risquesCritiques: number
}

export interface AlertBarProps {
  alerts: AlertBarAlerts
}

export function AlertBar({ alerts }: AlertBarProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const hasAlerts =
    alerts.projetsEnRetard > 0 ||
    alerts.tachesEnRetard > 0 ||
    alerts.materiauxStockBas > 0 ||
    alerts.incidentsGraves > 0 ||
    alerts.risquesCritiques > 0

  if (!hasAlerts) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--db-success-border)] bg-[var(--db-success-bg)]">
        <svg className="w-4 h-4 text-[var(--db-success-text)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-medium text-[var(--db-success-text)]">
          {t('db.band.alerts.empty')}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {alerts.incidentsGraves > 0 && (
        <AlertChip
          text={t('db.band.alerts.incidentsGraves', { count: alerts.incidentsGraves })}
          variant="danger"
          onClick={() => navigate('/qshe/incidents')}
        />
      )}
      {alerts.risquesCritiques > 0 && (
        <AlertChip
          text={t('db.band.alerts.risquesCritiques', { count: alerts.risquesCritiques })}
          variant="danger"
          onClick={() => navigate('/qshe/risques')}
        />
      )}
      {alerts.projetsEnRetard > 0 && (
        <AlertChip
          text={t('db.band.alerts.projetsEnRetard', { count: alerts.projetsEnRetard })}
          variant="warning"
          onClick={() => navigate('/projets')}
        />
      )}
      {alerts.tachesEnRetard > 0 && (
        <AlertChip
          text={t('db.band.alerts.tachesEnRetard', { count: alerts.tachesEnRetard })}
          variant="warning"
          onClick={() => navigate('/planning')}
        />
      )}
      {alerts.materiauxStockBas > 0 && (
        <AlertChip
          text={t('db.band.alerts.materiauxStockBas', { count: alerts.materiauxStockBas })}
          variant="warning"
          onClick={() => navigate('/materiaux')}
        />
      )}
    </div>
  )
}
