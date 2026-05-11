import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// ── Types ────────────────────────────────────────────────────────────
export interface BudgetRow {
  label: string
  mois: number
  annee: number
  caPrevisionnel: number
  caRealise: number
}

export interface ComputedBudgetRow extends BudgetRow {
  cumulPrevu: number
  cumulRealise: number
  ecartMensuel: number
  ecartCumule: number
  avancementPrevu: number
  avancementRealise: number
}

interface BudgetTotals {
  totalPrevu: number
  totalRealise: number
  ecart: number
  avancementPrevu: number
  avancementRealise: number
}

interface BudgetTrackerProps {
  rows: BudgetRow[]
  budgetTotal: number
  editable?: boolean
  showDeleteColumn?: boolean
  onChange?: (idx: number, field: 'caPrevisionnel' | 'caRealise', value: number) => void
  onDelete?: (idx: number) => void
}

// ── Formatters ───────────────────────────────────────────────────────
function fmtMoney(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '\u2014'
  if (n === 0) return '\u2014'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) {
    const v = (abs / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '')
    return `${sign}${v}Md`
  }
  if (abs >= 1_000_000) {
    const v = (abs / 1_000_000).toFixed(1).replace('.0', '')
    return `${sign}${v}M`
  }
  if (abs >= 10_000) return `${sign}${Math.round(abs / 1_000)}k`
  return n.toLocaleString('fr-FR')
}

function fmtPct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '\u2014'
  return `${n.toFixed(1).replace('.0', '')} %`
}

function fmtDelta(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '\u2014'
  if (n === 0) return '0'
  const sign = n > 0 ? '+' : ''
  return `${sign}${fmtMoney(n)}`
}

// ── Editable cell ────────────────────────────────────────────────────
function EditableCell({
  value,
  onChange,
  editable,
}: {
  value: number
  onChange: (v: number) => void
  editable: boolean
}) {
  if (!editable) return <span className="tabular-nums">{fmtMoney(value)}</span>
  return (
    <input
      type="number"
      min={0}
      value={value !== 0 ? value : ''}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      className="w-full bg-transparent text-right tabular-nums px-1 py-0.5 rounded border border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-800 focus:outline-none transition-colors dark:text-gray-100"
      placeholder="0"
    />
  )
}

// ── Mini progress bar ────────────────────────────────────────────────
function MiniBar({ pct, color }: { pct: number; color: 'amber' | 'emerald' }) {
  const bg = color === 'amber'
    ? 'bg-amber-400 dark:bg-amber-500'
    : 'bg-emerald-400 dark:bg-emerald-500'
  return (
    <div className="w-10 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0">
      <div
        className={`h-full rounded-full transition-all duration-300 ${bg}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}

// ── Ecart color helper ───────────────────────────────────────────────
function ecartCls(n: number): string {
  if (n > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (n < 0) return 'text-rose-600 dark:text-rose-400'
  return 'text-gray-500 dark:text-gray-400'
}

// ── Component ────────────────────────────────────────────────────────
export default function BudgetTracker({
  rows,
  budgetTotal,
  editable = false,
  showDeleteColumn = false,
  onChange,
  onDelete,
}: BudgetTrackerProps) {
  const { t } = useTranslation('projet')

  const computed: ComputedBudgetRow[] = useMemo(() => {
    let cumulPrevu = 0
    let cumulRealise = 0
    return rows.map((r) => {
      const prevu = Number(r.caPrevisionnel) || 0
      const realise = Number(r.caRealise) || 0
      cumulPrevu += prevu
      cumulRealise += realise
      return {
        ...r,
        cumulPrevu,
        cumulRealise,
        ecartMensuel: realise - prevu,
        ecartCumule: cumulRealise - cumulPrevu,
        avancementPrevu: budgetTotal > 0 ? (cumulPrevu / budgetTotal) * 100 : 0,
        avancementRealise: budgetTotal > 0 ? (cumulRealise / budgetTotal) * 100 : 0,
      }
    })
  }, [rows, budgetTotal])

  const lastRow = computed.length > 0 ? computed[computed.length - 1] : null

  const totals: BudgetTotals = useMemo(() => {
    const totalPrevu = rows.reduce((s, r) => s + (Number(r.caPrevisionnel) || 0), 0)
    const totalRealise = rows.reduce((s, r) => s + (Number(r.caRealise) || 0), 0)
    return {
      totalPrevu,
      totalRealise,
      ecart: totalRealise - totalPrevu,
      avancementPrevu: budgetTotal > 0 ? (totalPrevu / budgetTotal) * 100 : 0,
      avancementRealise: budgetTotal > 0 ? (totalRealise / budgetTotal) * 100 : 0,
    }
  }, [rows, budgetTotal])

  if (rows.length === 0) return null

  const thTop = 'px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-center border-b border-gray-200 dark:border-gray-600'
  const thSub = 'px-2.5 py-1.5 text-[10px] font-semibold text-right border-b border-gray-200 dark:border-gray-600 whitespace-nowrap'
  const td = 'px-2.5 py-2 text-sm text-right tabular-nums whitespace-nowrap'
  const cumBg = 'bg-gray-50/60 dark:bg-gray-800/40'

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <table className="min-w-[1100px] w-full border-collapse">
        <thead>
          {/* Row 1 : grouped headers */}
          <tr className="bg-gray-50 dark:bg-gray-700/60">
            <th
              rowSpan={2}
              className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left text-gray-700 dark:text-gray-200 border-b border-r border-gray-200 dark:border-gray-600 min-w-[100px]"
            >
              {t('detail.colMonth')}
            </th>
            <th colSpan={2} className={`${thTop} text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-900/30`}>
              {t('suivi.groupPrevu')}
            </th>
            <th colSpan={2} className={`${thTop} text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-900/30`}>
              {t('suivi.groupRealise')}
            </th>
            <th colSpan={2} className={`${thTop} text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600/50`}>
              {t('suivi.groupEcarts')}
            </th>
            <th colSpan={2} className={`${thTop} text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-900/30`}>
              {t('suivi.groupAvancement')}
            </th>
            {showDeleteColumn && (
              <th rowSpan={2} className={`${thTop} text-gray-500 dark:text-gray-400 w-16`} />
            )}
          </tr>
          {/* Row 2 : sub-headers */}
          <tr className="bg-gray-50/60 dark:bg-gray-700/40">
            <th className={`${thSub} text-blue-700 dark:text-blue-300`}>{t('suivi.colMensuel')}</th>
            <th className={`${thSub} text-blue-700 dark:text-blue-300 ${cumBg}`}>{t('suivi.colCumule')}</th>
            <th className={`${thSub} text-emerald-700 dark:text-emerald-300`}>{t('suivi.colMensuel')}</th>
            <th className={`${thSub} text-emerald-700 dark:text-emerald-300 ${cumBg}`}>{t('suivi.colCumule')}</th>
            <th className={`${thSub} text-gray-600 dark:text-gray-300`}>{t('suivi.colMensuel')}</th>
            <th className={`${thSub} text-gray-600 dark:text-gray-300 ${cumBg}`}>{t('suivi.colCumule')}</th>
            <th className={`${thSub} text-amber-700 dark:text-amber-300`}>{t('suivi.colPrevu')}</th>
            <th className={`${thSub} text-amber-700 dark:text-amber-300 ${cumBg}`}>{t('suivi.colRealise')}</th>
          </tr>
        </thead>

        <tbody>
          {computed.map((row, idx) => {
            const hasData = row.caPrevisionnel !== 0 || row.caRealise !== 0
            return (
              <tr
                key={`${row.mois}-${row.annee}`}
                className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors ${!hasData ? 'opacity-50' : ''}`}
              >
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 px-3 py-2 text-sm font-medium text-gray-800 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                    {row.label}
                  </span>
                </td>
                {/* CA Prévu mensuel */}
                <td className={td}>
                  <EditableCell
                    value={row.caPrevisionnel}
                    editable={editable}
                    onChange={(v) => onChange?.(idx, 'caPrevisionnel', v)}
                  />
                </td>
                {/* CA Prévu cumulé */}
                <td className={`${td} ${cumBg} text-blue-700 dark:text-blue-300 font-medium`}>
                  {fmtMoney(row.cumulPrevu)}
                </td>
                {/* CA Réalisé mensuel */}
                <td className={td}>
                  <EditableCell
                    value={row.caRealise}
                    editable={editable}
                    onChange={(v) => onChange?.(idx, 'caRealise', v)}
                  />
                </td>
                {/* CA Réalisé cumulé */}
                <td className={`${td} ${cumBg} text-emerald-700 dark:text-emerald-300 font-medium`}>
                  {fmtMoney(row.cumulRealise)}
                </td>
                {/* Écart mensuel */}
                <td className={`${td} ${ecartCls(row.ecartMensuel)}`}>
                  {fmtDelta(row.ecartMensuel)}
                </td>
                {/* Écart cumulé */}
                <td className={`${td} ${cumBg} ${ecartCls(row.ecartCumule)} font-medium`}>
                  {fmtDelta(row.ecartCumule)}
                </td>
                {/* Avancement prévu */}
                <td className={`${td} text-amber-700 dark:text-amber-300`}>
                  <div className="flex items-center justify-end gap-1.5">
                    <MiniBar pct={row.avancementPrevu} color="amber" />
                    <span className="min-w-[42px]">{fmtPct(row.avancementPrevu)}</span>
                  </div>
                </td>
                {/* Avancement réalisé */}
                <td className={`${td} ${cumBg} text-amber-700 dark:text-amber-300 font-medium`}>
                  <div className="flex items-center justify-end gap-1.5">
                    <MiniBar pct={row.avancementRealise} color="emerald" />
                    <span className="min-w-[42px]">{fmtPct(row.avancementRealise)}</span>
                  </div>
                </td>
                {/* Delete (mode manuel) */}
                {showDeleteColumn && (
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => onDelete?.(idx)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-semibold transition-colors"
                      aria-label={t('form.deleteLabel')}
                    >
                      &times;
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>

        {/* Footer : totals */}
        <tfoot>
          <tr className="bg-gray-100 dark:bg-gray-700/80 font-semibold border-t-2 border-gray-300 dark:border-gray-500">
            <td className="sticky left-0 z-20 bg-gray-100 dark:bg-gray-700 px-3 py-2.5 text-[10px] text-gray-800 dark:text-gray-100 uppercase tracking-wider border-r border-gray-300 dark:border-gray-500 font-bold">
              {t('detail.total')}
            </td>
            <td className={`${td} text-blue-700 dark:text-blue-300 font-bold`}>{fmtMoney(totals.totalPrevu)}</td>
            <td className={`${td} ${cumBg} text-blue-700 dark:text-blue-300 font-bold`}>{fmtMoney(lastRow?.cumulPrevu)}</td>
            <td className={`${td} text-emerald-700 dark:text-emerald-300 font-bold`}>{fmtMoney(totals.totalRealise)}</td>
            <td className={`${td} ${cumBg} text-emerald-700 dark:text-emerald-300 font-bold`}>{fmtMoney(lastRow?.cumulRealise)}</td>
            <td className={`${td} ${ecartCls(totals.ecart)} font-bold`}>{fmtDelta(totals.ecart)}</td>
            <td className={`${td} ${cumBg} ${ecartCls(lastRow?.ecartCumule ?? 0)} font-bold`}>{fmtDelta(lastRow?.ecartCumule)}</td>
            <td className={`${td} text-amber-700 dark:text-amber-300 font-bold`}>{fmtPct(totals.avancementPrevu)}</td>
            <td className={`${td} ${cumBg} text-amber-700 dark:text-amber-300 font-bold`}>{fmtPct(totals.avancementRealise)}</td>
            {showDeleteColumn && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
