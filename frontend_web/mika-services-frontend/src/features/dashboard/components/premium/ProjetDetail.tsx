import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { STATUT_LABELS } from '../../constants/projetStatuts'
import type { ProjetSummary, StatutProjet } from '@/types/projet'
import type { ProjetReport } from '@/types/reporting'

export interface ProjetDetailProps {
  projets: ProjetSummary[]
  report: ProjetReport | null
  selectedId: number | null
  onSelect: (id: number | null) => void
}

export function ProjetDetail({ projets, report, selectedId, onSelect }: ProjetDetailProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { formatShort } = useFormatNumber()

  const minis = report ? [
    { label: t('db.transversal.kpiAvancement'), value: `${report.planning?.tauxAvancement ?? 0}%`, sub: `${report.planning?.tachesTerminees ?? 0} / ${report.planning?.tachesTotal ?? 0} tâches terminées`, fill: 'var(--db-t1)', pct: report.planning?.tauxAvancement ?? 0 },
    { label: t('db.transversal.kpiBudget'), value: `${report.budget?.tauxConsommation ?? 0}%`, sub: `${formatShort(report.budget?.depensesTotales ?? 0)} / ${formatShort(report.budget?.budgetTotalPrevu ?? 0)} consommé`, fill: 'var(--db-orange)', pct: report.budget?.tauxConsommation ?? 0 },
    { label: t('db.transversal.kpiQualite'), value: `${report.qualite?.tauxConformite ?? 0}%`, sub: `${report.qualite?.ncOuvertes ?? 0} non-conformités ouvertes`, fill: 'var(--db-success)', pct: report.qualite?.tauxConformite ?? 0, success: (report.qualite?.tauxConformite ?? 0) >= 80 },
    { label: `${t('db.transversal.kpiSecurite')} — Incidents`, value: String(report.securite?.incidentsGraves ?? 0), sub: `${report.securite?.risquesCritiques ?? 0} risque critique en suivi`, fill: 'var(--db-success)', pct: 100, success: (report.securite?.incidentsGraves ?? 0) === 0 },
  ] : []

  return (
    <div className="col-span-12 rounded-xl p-4" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 540ms both' }}>
      <div className="flex items-start gap-3.5 mb-3.5">
        <div>
          <div className="text-[15px] font-semibold db-tight" style={{ color: 'var(--db-t1)' }}>
            {t('db.transversal.projetReport')}
          </div>
          {report && (
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--db-t3)' }}>
              {report.projetNom} — {STATUT_LABELS[report.statut as StatutProjet] ?? report.statut}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={selectedId ?? ''}
            onChange={e => onSelect(e.target.value ? Number(e.target.value) : null)}
            className="appearance-none rounded-lg px-3 py-1.5 pr-7 text-[12px] font-medium cursor-pointer border-0 transition-colors min-h-[36px]"
            style={{ background: 'var(--db-subtle)', color: 'var(--db-t1)' }}
          >
            <option value="">{t('db.transversal.selectProjet')}</option>
            {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
          </select>
          {report && (
            <button type="button" onClick={() => navigate(`/projets/${report.projetId}`)} className="text-[11.5px] whitespace-nowrap hover:text-[var(--db-t1)] transition-colors" style={{ color: 'var(--db-t3)' }}>
              Rapport complet →
            </button>
          )}
        </div>
      </div>

      {!selectedId ? (
        <div className="flex items-center justify-center h-32 text-[12px]" style={{ color: 'var(--db-t3)' }}>
          {t('db.transversal.noProjetSelected')}
        </div>
      ) : !report ? (
        <div className="grid grid-cols-4 gap-px rounded-[10px] overflow-hidden p-px" style={{ background: 'var(--db-subtle)' }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="h-24 rounded-[9px] animate-pulse" style={{ background: 'var(--db-subtle)' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-[10px] overflow-hidden p-px" style={{ background: 'var(--db-subtle)' }}>
          {minis.map((m, i) => (
            <div key={i} className="rounded-[9px] p-3.5 px-4" style={{ background: 'var(--db-subtle)' }}>
              <div className="text-[10.5px] uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{m.label}</div>
              <div className={`text-[26px] font-semibold db-tight db-num my-1 ${m.success ? 'text-[var(--db-success)]' : ''}`} style={m.success ? {} : { color: 'var(--db-t1)' }}>
                {m.value}
              </div>
              <div className="text-[11.5px] db-num" style={{ color: 'var(--db-t3)' }}>{m.sub}</div>
              <div className="h-[3px] rounded-sm mt-2.5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <div className="h-full rounded-sm" style={{ width: `${Math.min(m.pct, 100)}%`, background: m.fill }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
