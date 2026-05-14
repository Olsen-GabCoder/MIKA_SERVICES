import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { STATUT_LABELS } from '../../constants/projetStatuts'
import type { ProjetSummary, StatutProjet } from '@/types/projet'

export interface ProjetsTableProps { projets: ProjetSummary[] }

const statusCls: Record<string, string> = {
  EN_COURS_EXECUTION: 'bg-[var(--db-teal-soft)] text-[var(--db-success)]',
  EN_AVANCE: 'bg-[var(--db-teal-soft)] text-[var(--db-success)]',
  SUSPENSION: 'bg-[var(--db-warn-bg)] text-[var(--db-warn)]',
  RECEPTION_PROVISOIRE: 'bg-[var(--db-info-bg2)] text-[var(--db-info)]',
  RECEPTION_DEFINITIVE: 'bg-[var(--db-info-bg2)] text-[var(--db-info)]',
}

export function ProjetsTable({ projets }: ProjetsTableProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { formatShort } = useFormatNumber()

  const rows = useMemo(() =>
    [...projets].filter(p => ['EN_COURS_EXECUTION', 'EN_AVANCE', 'SUSPENSION', 'RECEPTION_PROVISOIRE'].includes(p.statut))
      .sort((a, b) => (b.avancementGlobal ?? 0) - (a.avancementGlobal ?? 0)).slice(0, 5),
    [projets])

  return (
    <div className="col-span-12 lg:col-span-8 rounded-xl p-4" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 300ms both' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{t('db.premium.projetsActifs')}</span>
        <button type="button" onClick={() => navigate('/projets')} className="ml-auto inline-flex items-center gap-1 text-[11.5px] hover:text-[var(--db-t1)] transition-colors" style={{ color: 'var(--db-t3)' }}>
          {t('db.premium.voirTous')} <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--db-border)' }}>
            {[t('db.operations.colNom'), t('db.operations.colStatut'), t('db.operations.colAvancement'), t('db.operations.colMontant')].map((h, i) => (
              <th key={i} className={`text-left text-[10.5px] font-medium uppercase tracking-[0.08em] py-2 pr-2 ${i === 3 ? 'text-right pr-0' : ''}`} style={{ color: 'var(--db-t4)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(p => {
            const pct = p.avancementGlobal ?? 0
            const fillCls = pct < 40 ? 'bg-[var(--db-warn)]' : pct >= 90 ? 'bg-[var(--db-info)]' : ''
            return (
              <tr key={p.id} onClick={() => navigate(`/projets/${p.id}`)} className="border-b cursor-pointer transition-colors hover:bg-[var(--db-subtle)]" style={{ borderColor: 'var(--db-border)' }}>
                <td className="py-3 pr-2">
                  <span className="font-medium text-[12.5px]" style={{ color: 'var(--db-t1)' }}>{p.nom}</span>
                  {p.clientNom && <span className="block text-[10.5px] tracking-[0.04em] mt-0.5" style={{ color: 'var(--db-t4)' }}>{p.clientNom}</span>}
                </td>
                <td className="py-3 pr-2">
                  <span className={`inline-flex items-center gap-[5px] text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${statusCls[p.statut] ?? 'bg-[var(--db-subtle)] text-[var(--db-t2)]'}`}>
                    <span className="w-[5px] h-[5px] rounded-full bg-current" />
                    {STATUT_LABELS[p.statut as StatutProjet] ?? p.statut}
                  </span>
                </td>
                <td className="py-3 pr-2">
                  <div className="flex items-center gap-2.5 min-w-[130px]">
                    <div className="flex-1 h-1 rounded-sm overflow-hidden" style={{ background: 'var(--db-subtle)' }}>
                      <div className={`h-full rounded-sm ${fillCls}`} style={{ width: `${pct}%`, background: fillCls ? undefined : 'var(--db-t1)' }} />
                    </div>
                    <span className="text-[11.5px] db-num min-w-[28px] text-right" style={{ color: 'var(--db-t2)' }}>{pct}%</span>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="font-medium db-num db-tight text-[12.5px]" style={{ color: 'var(--db-t1)' }}>
                    {p.montantHT ? formatShort(p.montantHT) : '—'}
                    <span className="font-normal ml-0.5 text-[10.5px] tracking-[0.04em]" style={{ color: 'var(--db-t4)' }}>FCFA</span>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
