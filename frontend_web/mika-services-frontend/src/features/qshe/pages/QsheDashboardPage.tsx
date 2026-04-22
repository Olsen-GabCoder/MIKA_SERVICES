import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchProjets } from '@/store/slices/projetSlice'
import { qsheDashboardApi } from '@/api/qsheDashboardApi'
import apiClient from '@/api/axios'
import { API_ENDPOINTS } from '@/constants/api'
import type { QsheDashboardResponse } from '@/types/qsheDashboard'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

export default function QsheDashboardPage() {
  const { t } = useTranslation('qshe')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const projets = useAppSelector(s => s.projet.projets)

  const [projetId, setProjetId] = useState<number | null>(null)
  const [dashboard, setDashboard] = useState<QsheDashboardResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { dispatch(fetchProjets({ page: 0, size: 200 })) }, [dispatch])

  useEffect(() => {
    if (!projetId) { setDashboard(null); return }
    setLoading(true)
    qsheDashboardApi.getDashboard(projetId)
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false))
  }, [projetId])

  const d = dashboard
  const inc = d?.incidents
  const act = d?.actions

  const KpiCard = ({ value, label, accent = '', onClick, sub }: {
    value: number | string; label: string; accent?: string; onClick?: () => void; sub?: string
  }) => (
    <div className={`${CARD} ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-primary/30 transition' : ''}`} onClick={onClick}>
      <div className={`${BODY} text-center`}>
        <p className={`text-xl sm:text-2xl font-bold tabular-nums ${accent || 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )

  const BreakdownCard = ({ title, data, colorFn }: {
    title: string; data: Record<string, number>; colorFn: (key: string) => string
  }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0)
    if (total === 0) return null
    return (
      <div className={CARD}>
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</div>
        <div className={BODY}>
          <div className="space-y-2">
            {Object.entries(data).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-600 dark:text-gray-300">{t(`typeIncident.${key}`, key)}{t(`graviteIncident.${key}`, '')}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-100">{val}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colorFn(key)}`} style={{ width: `${(val / total) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{t('sidebar.dashboard')} QSHE</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Indicateurs transversaux Qualite, Securite, Hygiene, Environnement</p>
      </div>

      {/* Project selector */}
      <div className={CARD}>
        <div className={BODY}>
          <select value={projetId ?? ''} onChange={e => setProjetId(e.target.value ? Number(e.target.value) : null)}
            className="w-full sm:max-w-md border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary">
            <option value="">{t('incidents.chooseProject')}</option>
            {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
        </div>
      </div>

      {!projetId && <p className="text-center text-gray-400 py-8">{t('incidents.noProject')}</p>}

      {loading && <p className="text-center text-gray-400 py-8">{t('incidents.loading')}</p>}

      {d && inc && act && (
        <>
          {/* Row 1 — KPIs principaux */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard value={inc.totalIncidents} label={t('incidents.kpi.total')} onClick={() => navigate('/qshe/incidents')} />
            <KpiCard value={inc.incidentsGraves} label={t('incidents.kpi.graves')} accent="text-red-600 dark:text-red-400" />
            <KpiCard value={inc.declarationsCnssEnRetard} label={t('incidents.kpi.cnssRetard')}
              accent={inc.declarationsCnssEnRetard > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-green-600 dark:text-green-400'} />
            <KpiCard value={d.joursDepuisDernierAT !== null ? `${d.joursDepuisDernierAT}j` : '—'} label="Jours sans AT avec arrêt"
              accent="text-blue-600 dark:text-blue-400" />
          </div>

          {/* Row 2 — TF/TG + CAPA */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiCard value={d.tauxFrequence !== null ? d.tauxFrequence.toFixed(2) : '—'} label="Taux de fréquence (TF)"
              sub={d.tauxFrequence === null ? 'Heures travaillées non renseignées' : undefined} />
            <KpiCard value={d.tauxGravite !== null ? d.tauxGravite.toFixed(2) : '—'} label="Taux de gravité (TG)"
              sub={d.tauxGravite === null ? 'Heures travaillées non renseignées' : undefined} />
            <KpiCard value={act.actionsEnRetard} label="Actions CAPA en retard"
              accent={act.actionsEnRetard > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} />
            <KpiCard value={`${act.tauxCloture}%`} label="Taux clôture CAPA"
              accent={act.tauxCloture >= 80 ? 'text-green-600 dark:text-green-400' : act.tauxCloture >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'} />
          </div>

          {/* Row 3 — Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <BreakdownCard title="Incidents par type" data={inc.incidentsParType}
              colorFn={(k) => k === 'ACCIDENT_TRAVAIL' ? 'bg-red-500' : k === 'PRESQU_ACCIDENT' ? 'bg-orange-400' : k === 'INCIDENT_ENVIRONNEMENTAL' ? 'bg-green-500' : 'bg-blue-400'} />
            <BreakdownCard title="Incidents par gravité" data={inc.incidentsParGravite}
              colorFn={(k) => k === 'MORTELLE' ? 'bg-red-700' : k === 'GRAVE' ? 'bg-red-500' : k === 'LEGERE' ? 'bg-yellow-400' : 'bg-gray-300'} />
            <BreakdownCard title="CAPA par priorité" data={act.parPriorite}
              colorFn={(k) => k === 'URGENTE' ? 'bg-red-500' : k === 'HAUTE' ? 'bg-orange-400' : k === 'NORMALE' ? 'bg-blue-400' : 'bg-gray-300'} />
          </div>

          {/* Row 4 — Quick links + Export */}
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/qshe/incidents')}
              className="px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition">
              Voir tous les incidents →
            </button>
            <button onClick={async () => {
              if (!projetId) return
              try {
                const { data } = await apiClient.get(API_ENDPOINTS.QSHE_REPORT.BY_PROJET(projetId))
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = `rapport-qshe-projet-${projetId}.json`; a.click()
                URL.revokeObjectURL(url)
              } catch { /* silencieux */ }
            }}
              className="px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 text-sm font-medium transition">
              Exporter rapport QSHE (JSON)
            </button>
          </div>
        </>
      )}
    </PageContainer>
  )
}
