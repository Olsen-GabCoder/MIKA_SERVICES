import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchGlobalDashboard } from '../../../store/slices/reportingSlice'
import { fetchNotificationsNonLuesCount, fetchMessagesNonLusCount } from '../../../store/slices/communicationSlice'
import { PageContainer } from '@/components/layout/PageContainer'
import MeteoWidget from '../components/MeteoWidget'

export default function DashboardPage() {
  const { t, i18n } = useTranslation('common')
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  const formatMontant = (val: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(val)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { dashboard, loading } = useAppSelector((state) => state.reporting)
  const currentUser = useAppSelector((state) => state.auth.user)
  const { messagesNonLusCount, notificationsNonLuesCount } = useAppSelector((state) => state.communication)

  useEffect(() => {
    dispatch(fetchGlobalDashboard())
    if (currentUser?.id) {
      dispatch(fetchNotificationsNonLuesCount(currentUser.id))
      dispatch(fetchMessagesNonLusCount(currentUser.id))
    }
  }, [dispatch, currentUser?.id])

  if (loading && !dashboard) {
    return (
      <PageContainer size="full">
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('dashboard.loading')}</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="full" className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('dashboard.greeting', { name: currentUser?.prenom || t('dashboard.userFallback') })}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {(messagesNonLusCount > 0 || notificationsNonLuesCount > 0) && (
        <div className="flex gap-3 flex-wrap">
          {notificationsNonLuesCount > 0 && (
            <button
              onClick={() => navigate('/notifications')}
              className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition text-sm"
            >
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              {t('dashboard.notificationsUnread', { count: notificationsNonLuesCount })}
            </button>
          )}
          {messagesNonLusCount > 0 && (
            <button
              onClick={() => navigate('/messagerie')}
              className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-sm"
            >
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              {t('dashboard.messagesUnread', { count: messagesNonLusCount })}
            </button>
          )}
        </div>
      )}

      {dashboard && (
        <>
          {/* KPI principaux */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label={t('dashboard.kpi.activeProjects')}
              value={dashboard.projets.enCours}
              sub={`${dashboard.projets.total} ${t('dashboard.kpi.total')}`}
              color="blue"
              onClick={() => navigate('/projets')}
            />
            <KpiCard
              label={t('dashboard.kpi.tasksInProgress')}
              value={dashboard.planning.tachesEnCours}
              sub={`${dashboard.planning.tachesTerminees} ${t('dashboard.kpi.completed')}`}
              color="purple"
              onClick={() => navigate('/planning')}
            />
            <KpiCard
              label={t('dashboard.kpi.budgetConsumed')}
              value={`${dashboard.budget.tauxConsommation}%`}
              sub={formatMontant(dashboard.budget.depensesTotales)}
              color="green"
              onClick={() => navigate('/budget')}
            />
          </div>

          {/* Barres de progression */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avancement global */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.progress.global')}</h3>
                <span className="text-lg font-bold text-primary-600">{dashboard.planning.tauxAvancement}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-primary-500 transition-all"
                  style={{ width: `${dashboard.planning.tauxAvancement}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{dashboard.planning.tachesTerminees} {t('dashboard.progress.completed')}</span>
                <span>{dashboard.planning.tachesTotal} {t('dashboard.progress.total')}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.progress.budgetConsumption')}</h3>
                <span className={`text-lg font-bold ${dashboard.budget.tauxConsommation > 90 ? 'text-red-600' : dashboard.budget.tauxConsommation > 70 ? 'text-orange-600' : 'text-green-600'}`}>
                  {dashboard.budget.tauxConsommation}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${dashboard.budget.tauxConsommation > 90 ? 'bg-red-500' : dashboard.budget.tauxConsommation > 70 ? 'bg-orange-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(dashboard.budget.tauxConsommation, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatMontant(dashboard.budget.depensesTotales)} {t('dashboard.progress.spent')}</span>
                <span>{formatMontant(dashboard.budget.budgetTotalPrevu)} {t('dashboard.progress.planned')}</span>
              </div>
            </div>
          </div>

          {/* Alertes et indicateurs critiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alertes retard */}
            {(dashboard.projets.enRetard > 0 || dashboard.planning.tachesEnRetard > 0) && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">{t('dashboard.alerts.delays')}</h3>
                <div className="space-y-1 text-sm">
                  {dashboard.projets.enRetard > 0 && (
                    <p className="text-red-700 dark:text-red-300">{t('dashboard.alerts.projectsDelayed', { count: dashboard.projets.enRetard })}</p>
                  )}
                  {dashboard.planning.tachesEnRetard > 0 && (
                    <p className="text-red-700 dark:text-red-300">{t('dashboard.alerts.tasksDelayed', { count: dashboard.planning.tachesEnRetard })}</p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('dashboard.alerts.quality')}</h3>
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-bold ${dashboard.qualite.tauxConformite >= 80 ? 'text-green-600' : dashboard.qualite.tauxConformite >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                  {dashboard.qualite.tauxConformite}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.alerts.conformity')}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {dashboard.qualite.controlesTotal} {t('dashboard.alerts.controls')} — {dashboard.qualite.ncOuvertes} {t('dashboard.alerts.ncOpen')}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('dashboard.alerts.safety')}</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{dashboard.securite.incidentsTotal}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.alerts.incidents')}</span>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                {dashboard.securite.incidentsGraves > 0 && (
                  <p className="text-red-600">{t('dashboard.alerts.seriousIncidents', { count: dashboard.securite.incidentsGraves })}</p>
                )}
                {dashboard.securite.risquesCritiques > 0 && (
                  <p className="text-orange-600">{t('dashboard.alerts.criticalRisks', { count: dashboard.securite.risquesCritiques })}</p>
                )}
                {dashboard.securite.joursArretTotal > 0 && (
                  <p className="text-gray-500 dark:text-gray-400">{dashboard.securite.joursArretTotal} {t('dashboard.alerts.daysStopped')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Matériel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('dashboard.alerts.equipmentPark')}</h3>
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dashboard.materiel.enginsTotal}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.alerts.equipmentTotal')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{dashboard.materiel.enginsDisponibles}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.alerts.available')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dashboard.materiel.enginsTotal - dashboard.materiel.enginsDisponibles}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.alerts.inService')}</p>
                </div>
              </div>
            </div>
            {dashboard.materiel.materiauxStockBas > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">{t('dashboard.alerts.stockAlerts')}</h3>
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  {t('dashboard.alerts.materialsLow', { count: dashboard.materiel.materiauxStockBas })}
                </p>
                <button
                  onClick={() => navigate('/materiaux')}
                  className="mt-2 text-xs text-amber-800 dark:text-amber-200 underline hover:no-underline"
                >
                  {t('dashboard.alerts.seeDetails')}
                </button>
              </div>
            )}
          </div>

          {/* Météo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MeteoWidget />
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4 flex flex-col justify-center items-center text-center">
              <p className="text-4xl font-bold text-primary-600">{dashboard.projets.total}</p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.alerts.projectsManaged')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{dashboard.planning.tachesTotal} {t('dashboard.alerts.tasks')}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-600 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('dashboard.alerts.quickAccess')}</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'dashboard.shortcuts.projets', path: '/projets' },
                { key: 'dashboard.shortcuts.planning', path: '/planning' },
                { key: 'dashboard.shortcuts.budget', path: '/budget' },
                { key: 'dashboard.shortcuts.engins', path: '/engins' },
                { key: 'dashboard.shortcuts.materiaux', path: '/materiaux' },
                { key: 'dashboard.shortcuts.qualite', path: '/qualite' },
                { key: 'dashboard.shortcuts.securite', path: '/securite' },
                { key: 'dashboard.shortcuts.messagerie', path: '/messagerie' },
                { key: 'dashboard.shortcuts.reporting', path: '/reporting' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary/20 hover:border-primary-200 dark:hover:border-primary/50 hover:text-primary-700 dark:hover:text-primary-300 transition"
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </PageContainer>
  )
}

// Composant KPI Card réutilisable (mode clair : dégradé ; mode sombre : fond sombre + bordure colorée)
function KpiCard({ label, value, sub, color, onClick }: {
  label: string
  value: number | string
  sub: string
  color: string
  onClick?: () => void
}) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
  }
  const darkMap: Record<string, string> = {
    blue: 'dark:bg-gray-800 dark:border-blue-600/60 dark:ring-1 dark:ring-blue-500/30',
    indigo: 'dark:bg-gray-800 dark:border-indigo-600/60 dark:ring-1 dark:ring-indigo-500/30',
    purple: 'dark:bg-gray-800 dark:border-purple-600/60 dark:ring-1 dark:ring-purple-500/30',
    green: 'dark:bg-gray-800 dark:border-green-600/60 dark:ring-1 dark:ring-green-500/30',
    red: 'dark:bg-gray-800 dark:border-red-600/60 dark:ring-1 dark:ring-red-500/30',
    orange: 'dark:bg-gray-800 dark:border-orange-600/60 dark:ring-1 dark:ring-orange-500/30',
  }
  const darkTextMap: Record<string, string> = {
    blue: 'dark:text-blue-300',
    indigo: 'dark:text-indigo-300',
    purple: 'dark:text-purple-300',
    green: 'dark:text-green-300',
    red: 'dark:text-red-300',
    orange: 'dark:text-orange-300',
  }
  const c = colorMap[color] || colorMap.blue
  const d = darkMap[color] || darkMap.blue
  const dt = darkTextMap[color] || darkTextMap.blue

  return (
    <button
      onClick={onClick}
      className={`rounded-xl shadow-sm p-5 text-left hover:shadow-md transition w-full border-2 border-transparent
        bg-gradient-to-br ${c} text-white
        dark:border ${d} dark:text-gray-100`}
    >
      <div className="rounded-lg p-0 text-left">
        <p className="text-white/80 dark:text-gray-400 text-sm">{label}</p>
        <p className={`text-3xl font-bold mt-1 dark:text-white ${dt}`}>{value}</p>
        <p className="text-white/70 dark:text-gray-500 text-xs mt-1">{sub}</p>
      </div>
    </button>
  )
}
