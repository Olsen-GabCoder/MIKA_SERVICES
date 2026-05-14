import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { useFormatDate } from '@/hooks/useFormatDate'
import { BentoCard } from '../shared/BentoCard'
import { useChartColors } from '../../hooks/useChartColors'
import { STATUT_LABELS, STATUT_COLOR_INDEX } from '../../constants/projetStatuts'
import type { ProjetSummary, StatutProjet } from '@/types/projet'

export interface ProjetTableProps {
  projets: ProjetSummary[]
}

const ACTIVE_STATUTS: StatutProjet[] = ['EN_COURS_EXECUTION', 'EN_AVANCE', 'INITIALISATION']

function getBarColor(pct: number): string {
  if (pct >= 75) return 'var(--db-success-text)'
  if (pct >= 40) return 'var(--db-info-text)'
  return 'var(--db-warning-text)'
}

function getInitials(name?: string): string {
  if (!name) return '—'
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function EcheanceBadge({ dateFin, t, formatDate }: { dateFin?: string; t: (k: string, o?: Record<string, unknown>) => string; formatDate: (d: string | Date | undefined | null, o?: Record<string, unknown>) => string }) {
  if (!dateFin) return <span className="text-[var(--db-text-faint)]">—</span>

  const now = new Date()
  const fin = new Date(dateFin)
  const diffDays = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="flex flex-col">
      <span className="text-xs text-[var(--db-text-muted)]">{formatDate(dateFin, { monthStyle: 'short' })}</span>
      {diffDays < 0 && (
        <span className="text-[9px] font-semibold text-[var(--db-danger-text)]">{t('db.operations.enRetardEcheance')}</span>
      )}
      {diffDays >= 0 && diffDays <= 30 && (
        <span className="text-[9px] font-medium text-[var(--db-warning-text)]">{t('db.operations.dansXJours', { count: diffDays })}</span>
      )}
    </div>
  )
}

export function ProjetTable({ projets }: ProjetTableProps) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { formatShort } = useFormatNumber()
  const formatDate = useFormatDate()
  const colors = useChartColors()

  const activeProjects = useMemo(() =>
    [...projets]
      .filter(p => ACTIVE_STATUTS.includes(p.statut))
      .sort((a, b) => (b.avancementGlobal ?? 0) - (a.avancementGlobal ?? 0))
      .slice(0, 10),
    [projets],
  )

  return (
    <BentoCard
      title={t('db.operations.projetTable')}
      subtitle={t('db.operations.projetTableSubtitle')}
      colSpan={12}
      colSpanTablet={12}
      colSpanMobile={12}
    >
      {activeProjects.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--db-text-faint)]">
          {t('db.operations.emptyProjetTable')}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--db-border-default)]">
                  {[
                    { label: t('db.operations.colNom'), align: '' },
                    { label: t('db.operations.colStatut'), align: '' },
                    { label: t('db.operations.colAvancement'), align: 'pl-4 w-36' },
                    { label: t('db.operations.colMontant'), align: 'text-right' },
                    { label: t('db.operations.colEcheance'), align: '' },
                    { label: t('db.operations.colManager'), align: '' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      className={`py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--db-text-faint)] ${col.align}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeProjects.map(p => {
                  const pct = p.avancementGlobal ?? 0
                  const statutColor = colors.series[STATUT_COLOR_INDEX[p.statut] ?? 0]
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projets/${p.id}`)}
                      className="border-b border-[var(--db-border-subtle)] hover:bg-[var(--db-bg-base)] cursor-pointer transition-colors duration-100 group h-14"
                    >
                      {/* Nom */}
                      <td className="py-3 pr-3 max-w-[200px]">
                        <span className="font-semibold text-[var(--db-text-primary)] text-xs line-clamp-1 group-hover:text-[var(--db-accent)] transition-colors">
                          {p.nom}
                        </span>
                        {p.clientNom && (
                          <span className="block text-[10px] text-[var(--db-text-faint)] mt-0.5 truncate">{p.clientNom}</span>
                        )}
                      </td>

                      {/* Statut badge */}
                      <td className="py-3 pr-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{
                            background: `color-mix(in srgb, ${statutColor} 12%, transparent)`,
                            borderColor: `color-mix(in srgb, ${statutColor} 30%, transparent)`,
                            color: statutColor,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statutColor }} />
                          {STATUT_LABELS[p.statut] ?? p.statut}
                        </span>
                      </td>

                      {/* Avancement */}
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--db-border-subtle)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: getBarColor(pct) }}
                            />
                          </div>
                          <span className="db-display-num text-xs text-[var(--db-text-primary)] w-9 text-right shrink-0">{pct}%</span>
                        </div>
                      </td>

                      {/* Montant */}
                      <td className="py-3 pr-3 text-right">
                        <span className="db-display-num text-xs text-[var(--db-text-primary)]">
                          {p.montantHT ? formatShort(p.montantHT) : '—'}
                        </span>
                      </td>

                      {/* Echeance */}
                      <td className="py-3 pr-3">
                        <EcheanceBadge dateFin={p.dateFin} t={t} formatDate={formatDate} />
                      </td>

                      {/* Manager */}
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: colors.series[p.id % colors.series.length] }}
                          >
                            {getInitials(p.responsableNom)}
                          </div>
                          <span className="text-[10px] text-[var(--db-text-faint)] truncate max-w-[80px]">
                            {p.responsableNom ?? '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {activeProjects.map(p => {
              const pct = p.avancementGlobal ?? 0
              const statutColor = colors.series[STATUT_COLOR_INDEX[p.statut] ?? 0]
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projets/${p.id}`)}
                  className="p-3.5 rounded-xl border border-[var(--db-border-subtle)] hover:bg-[var(--db-bg-base)] cursor-pointer transition-all min-h-[44px]"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--db-text-primary)] text-xs line-clamp-1">{p.nom}</span>
                      {p.clientNom && <span className="block text-[10px] text-[var(--db-text-faint)] mt-0.5">{p.clientNom}</span>}
                    </div>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold shrink-0"
                      style={{
                        background: `color-mix(in srgb, ${statutColor} 12%, transparent)`,
                        color: statutColor,
                      }}
                    >
                      {STATUT_LABELS[p.statut] ?? p.statut}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--db-border-subtle)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: getBarColor(pct) }} />
                    </div>
                    <span className="db-display-num text-xs text-[var(--db-text-primary)] w-8 text-right">{pct}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--db-text-faint)]">
                    <span>{p.montantHT ? formatShort(p.montantHT) : '—'}</span>
                    <span>{p.responsableNom ?? '—'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </BentoCard>
  )
}
