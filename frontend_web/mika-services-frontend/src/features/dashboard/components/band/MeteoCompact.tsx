import { useTranslation } from 'react-i18next'
import type { Meteo } from '@/types/meteo'

export interface MeteoCompactProps {
  meteo: Meteo | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

export function MeteoCompact({ meteo, loading, error, onRetry }: MeteoCompactProps) {
  const { t } = useTranslation('common')

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[var(--db-border-subtle)] bg-[var(--db-bg-surface)] animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-[var(--db-border-default)]" />
        <div className="h-3 w-16 rounded bg-[var(--db-border-default)]" />
        <div className="h-3 w-24 rounded bg-[var(--db-border-subtle)]" />
      </div>
    )
  }

  /* ── Error state ── */
  if (error || !meteo) {
    return (
      <div className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[var(--db-border-subtle)] bg-[var(--db-bg-surface)]">
        <svg className="w-5 h-5 text-[var(--db-text-faint)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
        <span className="text-xs text-[var(--db-text-faint)]">
          {t('db.band.meteo.unavailable')}
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-medium text-[var(--db-accent)] hover:underline min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {t('db.band.meteo.retry')}
          </button>
        )}
      </div>
    )
  }

  const ct = meteo.conditionTravail
  const favorable = ct.favorable

  return (
    <div className="flex items-center gap-3 h-14 px-4 rounded-xl border border-[var(--db-border-subtle)] bg-[var(--db-bg-surface)] overflow-hidden">
      {/* Weather icon */}
      <img
        src={`https://openweathermap.org/img/wn/${meteo.icone}.png`}
        alt={meteo.description}
        className="w-8 h-8 shrink-0"
      />

      {/* Temperature */}
      <span className="db-display-num text-xl text-[var(--db-text-primary)] shrink-0">
        {Math.round(meteo.temperature)}°
      </span>

      {/* Description + city */}
      <div className="min-w-0 hidden sm:block">
        <p className="text-xs text-[var(--db-text-muted)] truncate capitalize">
          {meteo.description}
        </p>
        <p className="text-[10px] text-[var(--db-text-faint)] truncate">
          {meteo.ville}
        </p>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--db-border-default)] shrink-0 hidden sm:block" />

      {/* Stats compactes */}
      <div className="flex items-center gap-3 text-[10px] text-[var(--db-text-faint)] hidden md:flex">
        <span>{t('meteo.humidity')} {meteo.humidite}%</span>
        <span>{t('meteo.wind')} {meteo.vitesseVent} km/h</span>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-[var(--db-border-default)] shrink-0 hidden md:block" />

      {/* Working condition chip */}
      <span
        className={[
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 border',
          favorable
            ? 'bg-[var(--db-success-bg)] text-[var(--db-success-text)] border-[var(--db-success-border)]'
            : 'bg-[var(--db-danger-bg)] text-[var(--db-danger-text)] border-[var(--db-danger-border)]',
        ].join(' ')}
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${favorable ? 'bg-[var(--db-success-text)]' : 'bg-[var(--db-danger-text)]'}`} />
        {favorable ? ct.message : t('db.band.meteo.conditionsDefavorables')}
      </span>
    </div>
  )
}
