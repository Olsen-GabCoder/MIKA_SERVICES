import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BentoCard } from '../shared/BentoCard'
import { STATUT_LABELS, STATUT_COLOR_INDEX } from '../../constants/projetStatuts'
import { useChartColors } from '../../hooks/useChartColors'
import type { ProjetSummary, StatutProjet } from '@/types/projet'
import type { ProjetReport } from '@/types/reporting'

export interface ProjetReportBlockProps {
  projets: ProjetSummary[]
  projetReport: ProjetReport | null
  selectedProjetId: number | null
  onSelectProjet: (id: number | null) => void
  loading?: boolean
}

function MiniKpi({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--db-bg-base)]">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-[var(--db-text-faint)] uppercase tracking-widest">{label}</p>
        <p className="db-display-num text-2xl" style={{ color }}>{value}</p>
        <p className="text-[10px] text-[var(--db-text-muted)] truncate">{sub}</p>
      </div>
    </div>
  )
}

export function ProjetReportBlock({ projets, projetReport, selectedProjetId, onSelectProjet, loading = false }: ProjetReportBlockProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const colors = useChartColors()

  const report = projetReport

  return (
    <BentoCard
      title={t('db.transversal.projetReport')}
      subtitle={t('db.transversal.projetReportSubtitle')}
      colSpan={12}
      colSpanTablet={12}
      colSpanMobile={12}
      action={
        <div className="relative max-w-[260px]">
          <select
            value={selectedProjetId ?? ''}
            onChange={e => onSelectProjet(e.target.value ? Number(e.target.value) : null)}
            className="w-full appearance-none rounded-xl border border-[var(--db-border-default)] bg-[var(--db-bg-base)] px-3 py-2 pr-8 text-xs text-[var(--db-text-primary)] focus:border-[var(--db-accent)] focus:ring-2 focus:ring-[var(--db-accent-muted)] focus:outline-none transition min-h-[44px] cursor-pointer"
          >
            <option value="">{t('db.transversal.selectProjet')}</option>
            {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[var(--db-text-faint)]">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.755a.75.75 0 111.08 1.04l-4.25 4.3a.75.75 0 01-1.08 0l-4.25-4.3a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
          </div>
        </div>
      }
    >
      {!selectedProjetId ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 min-h-[200px]">
          <svg className="w-10 h-10 text-[var(--db-text-faint)] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-[var(--db-text-faint)] text-center">{t('db.transversal.noProjetSelected')}</p>
        </div>
      ) : loading || !report ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse min-h-[200px]">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-lg bg-[var(--db-border-default)]" />)}
        </div>
      ) : (
        <>
          {/* Project header */}
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--db-border-subtle)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-[var(--db-text-primary)] truncate">{report.projetNom}</span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border shrink-0"
                style={{
                  background: `color-mix(in srgb, ${colors.series[STATUT_COLOR_INDEX[report.statut as StatutProjet] ?? 0]} 12%, transparent)`,
                  borderColor: `color-mix(in srgb, ${colors.series[STATUT_COLOR_INDEX[report.statut as StatutProjet] ?? 0]} 30%, transparent)`,
                  color: colors.series[STATUT_COLOR_INDEX[report.statut as StatutProjet] ?? 0],
                }}
              >
                {STATUT_LABELS[report.statut as StatutProjet] ?? report.statut}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/projets/${report.projetId}`)}
              className="text-xs font-semibold text-[var(--db-accent)] hover:underline min-h-[44px] flex items-center shrink-0"
            >
              {t('db.transversal.voirDetail')} &rarr;
            </button>
          </div>

          {/* 4 mini-KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniKpi
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
              label={t('db.transversal.kpiAvancement')}
              value={`${report.planning?.tauxAvancement ?? 0}%`}
              sub={t('db.transversal.subTaches', { terminees: report.planning?.tachesTerminees ?? 0, total: report.planning?.tachesTotal ?? 0 })}
              color="var(--db-accent)"
            />
            <MiniKpi
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label={t('db.transversal.kpiBudget')}
              value={`${report.budget?.tauxConsommation ?? 0}%`}
              sub={t('db.transversal.subConsomme')}
              color={(report.budget?.tauxConsommation ?? 0) > 100 ? 'var(--db-danger-text)' : (report.budget?.tauxConsommation ?? 0) > 80 ? 'var(--db-warning-text)' : 'var(--db-accent)'}
            />
            <MiniKpi
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>}
              label={t('db.transversal.kpiQualite')}
              value={`${report.qualite?.tauxConformite ?? 0}%`}
              sub={t('db.transversal.subNcOuvertes', { count: report.qualite?.ncOuvertes ?? 0 })}
              color={(report.qualite?.tauxConformite ?? 0) >= 90 ? 'var(--db-success-text)' : (report.qualite?.tauxConformite ?? 0) >= 75 ? 'var(--db-warning-text)' : 'var(--db-danger-text)'}
            />
            <MiniKpi
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
              label={t('db.transversal.kpiSecurite')}
              value={String(report.securite?.incidentsGraves ?? 0)}
              sub={t('db.transversal.subRisqueCritique', { count: report.securite?.risquesCritiques ?? 0 })}
              color={(report.securite?.incidentsGraves ?? 0) > 0 ? 'var(--db-danger-text)' : 'var(--db-success-text)'}
            />
          </div>
        </>
      )}
    </BentoCard>
  )
}
