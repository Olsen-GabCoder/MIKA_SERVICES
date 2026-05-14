import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Meteo } from '@/types/meteo'

export interface DashHeaderProps {
  greetingKey: string
  greetingName: string
  notificationsCount: number
  meteo: Meteo | null
}

export function DashHeader({ greetingKey, greetingName, notificationsCount, meteo }: DashHeaderProps) {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()

  const dateStr = useMemo(() => {
    const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
    const d = new Date()
    const weekday = d.toLocaleDateString(locale, { weekday: 'long' })
    const rest = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${rest}`
  }, [i18n.language])

  return (
    <header className="flex items-center gap-4 py-1 pb-3.5" style={{ animation: 'db-rise 380ms ease-out both' }}>
      <div>
        <h1 className="m-0 text-[19px] font-semibold db-tight" style={{ color: 'var(--db-t1)' }}>
          {t('db.header')}
        </h1>
        <div className="text-[12.5px]" style={{ color: 'var(--db-t3)' }}>
          {t(greetingKey, { name: '' })}
          <strong className="font-medium" style={{ color: 'var(--db-t2)' }}>{greetingName}</strong>
          {' — '}{dateStr}
        </div>
      </div>

      <div className="flex-1" />

      {/* Meteo chip */}
      {meteo && (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] border"
          style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)', color: 'var(--db-t2)' }}
        >
          <img src={`https://openweathermap.org/img/wn/${meteo.icone}.png`} alt="" className="w-4 h-4" />
          <span className="db-num">{Math.round(meteo.temperature)}°</span>
          <span className="text-[11px]" style={{ color: 'var(--db-t3)' }}>{meteo.ville}</span>
        </div>
      )}

      {/* Notifications */}
      <button
        type="button"
        onClick={() => navigate('/notifications')}
        className="relative w-8 h-8 inline-grid place-items-center border rounded-lg transition-all duration-150 hover:bg-[var(--db-subtle)]"
        style={{ background: 'var(--db-card)', borderColor: 'var(--db-border)', color: 'var(--db-t2)' }}
        aria-label={t('db.band.notifications.aria', { count: notificationsCount })}
      >
        <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {notificationsCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-[15px] h-[15px] rounded-full grid place-items-center text-white text-[9.5px] font-semibold db-num"
            style={{ background: 'var(--db-orange)', border: '2px solid var(--db-page)' }}
          >
            {notificationsCount}
          </span>
        )}
      </button>
    </header>
  )
}
