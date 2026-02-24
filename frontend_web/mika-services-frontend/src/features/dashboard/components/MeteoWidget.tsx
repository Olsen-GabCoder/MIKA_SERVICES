import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { meteoApi } from '../../../api/meteoApi'
import type { Meteo, Previsions } from '../../../types/meteo'

export default function MeteoWidget() {
  const { t, i18n } = useTranslation('common')
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  const [meteo, setMeteo] = useState<Meteo | null>(null)
  const [previsions, setPrevisions] = useState<Previsions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [m, p] = await Promise.all([meteoApi.getActuelle(), meteoApi.getPrevisions()])
        setMeteo(m)
        setPrevisions(p)
      } catch {
        // Silently fail - widget non-critique
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 animate-pulse h-40" />
  if (!meteo) return null

  const iconUrl = `https://openweathermap.org/img/wn/${meteo.icone}@2x.png`
  const ct = meteo.conditionTravail

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 overflow-hidden">
      {/* Météo actuelle */}
      <div className={`p-4 ${ct.favorable ? 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30' : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{meteo.ville}</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{Math.round(meteo.temperature)}°C</span>
              <img src={iconUrl} alt={meteo.description} className="w-12 h-12" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">{meteo.description}</p>
          </div>
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>{t('meteo.feelsLike')} {Math.round(meteo.temperatureRessentie)}°C</p>
            <p>{t('meteo.humidity')} {meteo.humidite}%</p>
            <p>{t('meteo.wind')} {meteo.vitesseVent} km/h</p>
          </div>
        </div>

        {/* Condition travail */}
        <div className={`mt-3 p-2 rounded-lg text-sm ${ct.favorable ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'}`}>
          <p className="font-medium">{ct.message}</p>
        </div>
        {ct.alertes.length > 0 && (
          <div className="mt-2 space-y-1">
            {ct.alertes.map((a, i) => (
              <p key={i} className="text-xs text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded">{a}</p>
            ))}
          </div>
        )}
      </div>

      {/* Prévisions 5 jours */}
      {previsions && previsions.previsions.length > 0 && (
        <div className="p-3 border-t dark:border-gray-600">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('meteo.forecast5Days')}</p>
          <div className="flex gap-2 overflow-x-auto">
            {previsions.previsions.map((jour, i) => {
              const dayName = new Date(jour.date).toLocaleDateString(locale, { weekday: 'short' })
              return (
                <div key={i} className="flex flex-col items-center min-w-[60px] text-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{dayName}</span>
                  <img src={`https://openweathermap.org/img/wn/${jour.icone}.png`} alt="" className="w-8 h-8" />
                  <span className="text-xs font-medium dark:text-gray-200">{Math.round(jour.temperatureMax)}°</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{Math.round(jour.temperatureMin)}°</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
