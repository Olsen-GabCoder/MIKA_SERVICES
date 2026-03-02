import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { meteoApi } from '../../../api/meteoApi'
import type { Meteo, Previsions } from '../../../types/meteo'
import { useFormatDate } from '@/hooks/useFormatDate'

/* ── Stat pill ── */
function StatPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[64px]">
      <span className="text-base">{icon}</span>
      <span className="text-[10px] text-white/70 leading-none">{label}</span>
      <span className="text-xs font-bold text-white">{value}</span>
    </div>
  )
}

/* ── Forecast day card ── */
function ForecastDay({ jour, locale }: { jour: any; locale: string }) {
  const dayName = new Date(jour.date).toLocaleDateString(locale, { weekday: 'short' })
  return (
    <div className="flex flex-col items-center gap-1 min-w-[56px] text-center group">
      <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider capitalize">
        {dayName}
      </span>
      <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-150">
        <img
          src={`https://openweathermap.org/img/wn/${jour.icone}.png`}
          alt=""
          className="w-8 h-8"
        />
      </div>
      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
        {Math.round(jour.temperatureMax)}°
      </span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500">
        {Math.round(jour.temperatureMin)}°
      </span>
      {/* Mini temp range bar */}
      <div className="w-full h-1 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden mt-0.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-orange-400"
          style={{ width: `${Math.min(100, Math.max(20, ((jour.temperatureMax - jour.temperatureMin) / 20) * 100))}%` }}
        />
      </div>
    </div>
  )
}

export default function MeteoWidget() {
  const { t, i18n } = useTranslation('common')
  const formatDate = useFormatDate()
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  const [meteo, setMeteo] = useState<Meteo | null>(null)
  const [previsions, setPrevisions] = useState<Previsions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [m, p] = await Promise.all([meteoApi.getActuelle(), meteoApi.getPrevisions()])
        setMeteo(m)
        setPrevisions(p)
      } catch {
        /* non-critique */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm animate-pulse">
        <div className="h-40 bg-gradient-to-br from-sky-200 to-blue-300 dark:from-sky-900 dark:to-blue-900" />
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 h-16 rounded-xl bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!meteo) return null

  const ct = meteo.conditionTravail
  const favorable = ct.favorable

  /* Gradient adapté à la météo */
  const heroGradient = favorable
    ? 'from-[#1a6fa8] via-[#1e8cbf] to-[#2aacde]'
    : 'from-[#7c3a2d] via-[#b34a30] to-[#e07050]'

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/80 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">

      {/* ── Hero météo ── */}
      <div className={`relative bg-gradient-to-br ${heroGradient} px-5 py-5 overflow-hidden`}>
        {/* Blobs décoratifs */}
        <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 w-28 h-28 rounded-full bg-black/10 blur-2xl" />

        <div className="relative z-10">
          {/* Ville + heure */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-white/60 text-xs">📍</span>
              <span className="text-white/80 text-xs font-medium tracking-wide">{meteo.ville}</span>
            </div>
            <span className="text-white/50 text-[10px]">
              {formatDate(new Date().toISOString(), { timeOnly: true })}
            </span>
          </div>

          {/* Température principale + icône */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-end gap-1 leading-none">
                <span className="text-5xl font-extrabold text-white tabular-nums tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                  {Math.round(meteo.temperature)}
                </span>
                <span className="text-2xl font-bold text-white/70 mb-1">°C</span>
              </div>
              <p className="text-white/70 text-sm capitalize mt-1">{meteo.description}</p>
            </div>
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <img
                  src={`https://openweathermap.org/img/wn/${meteo.icone}@2x.png`}
                  alt={meteo.description}
                  className="w-16 h-16 drop-shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Stats en ligne */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-0.5 scrollbar-none">
            <StatPill icon="🌡️" label={t('meteo.feelsLike')} value={`${Math.round(meteo.temperatureRessentie)}°`} />
            <StatPill icon="💧" label={t('meteo.humidity')} value={`${meteo.humidite}%`} />
            <StatPill icon="💨" label={t('meteo.wind')} value={`${meteo.vitesseVent} km/h`} />
          </div>
        </div>
      </div>

      {/* ── Bandeau condition de travail ── */}
      <div className={`flex items-start gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-700
        ${favorable
          ? 'bg-green-50 dark:bg-green-900/20'
          : 'bg-red-50 dark:bg-red-900/20'}`}>
        <span className="text-lg mt-0.5 shrink-0">{favorable ? '✅' : '⚠️'}</span>
        <div className="min-w-0">
          <p className={`text-xs font-semibold leading-snug
            ${favorable ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
            {ct.message}
          </p>
          {ct.alertes.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {ct.alertes.map((a, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-700/50">
                  ⚡ {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Prévisions 5 jours ── */}
      {previsions && previsions.previsions.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
            {t('meteo.forecast5Days')}
          </p>
          <div className="flex justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {previsions.previsions.map((jour, i) => (
              <ForecastDay key={i} jour={jour} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}