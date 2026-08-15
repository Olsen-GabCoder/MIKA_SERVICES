import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tache, DependanceResponse } from '@/types/planning'
import { StatutTache } from '@/types/planning'

function ganttLateDays(tache: Tache): number {
  if (!tache.dateEcheance) return 0
  if (tache.statut !== StatutTache.A_FAIRE && tache.statut !== StatutTache.EN_COURS) return 0
  const diff = Math.floor((Date.now() - new Date(tache.dateEcheance).getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

function initials(tache: Tache): string {
  if (!tache.assigneA) return ''
  const n = tache.assigneA.nom?.[0] || ''
  const p = tache.assigneA.prenom?.[0] || ''
  return (p + n).toUpperCase()
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}`
}

function weekNumber(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

interface GanttChartProps {
  taches: Tache[]
  dependances: DependanceResponse[]
  cheminCritique: number[]
  onEdit?: (tache: Tache) => void
}

const STATUT_COLORS: Record<string, string> = {
  A_FAIRE: '#6B7280',
  EN_COURS: '#3F6B83',
  EN_ATTENTE: '#C48A2B',
  TERMINEE: '#2C9C7E',
  ANNULEE: '#B08078',
}

type ZoomLevel = 'day' | 'week'

const ZOOM_CONF = { day: { dayW: 26, label: 'Jour' }, week: { dayW: 11, label: 'Semaine' } }
const ROW_H = 38
const LEFT_W = 310
const BAR_H = 24

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export function GanttChart({ taches, dependances, cheminCritique, onEdit }: GanttChartProps) {
  const { t } = useTranslation('planning')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; tache: Tache } | null>(null)
  const [zoom, setZoom] = useState<ZoomLevel>('day')

  const DAY_W = ZOOM_CONF[zoom].dayW

  const sorted = useMemo(() => {
    const dated = taches.filter((t) => t.dateDebut && (t.dateFin || t.dateEcheance))
    return [...dated].sort((a, b) => {
      if (a.ordreAffichage != null && b.ordreAffichage != null) return a.ordreAffichage - b.ordreAffichage
      return (a.dateDebut || '').localeCompare(b.dateDebut || '')
    })
  }, [taches])

  const { startDate, nDays, days, months, weeks, weekendBands } = useMemo(() => {
    if (sorted.length === 0) {
      return { startDate: new Date(), nDays: 0, days: [], months: [], weeks: [], weekendBands: [] }
    }
    const dates = sorted.flatMap((t) => [t.dateDebut, t.dateFin, t.dateEcheance].filter(Boolean) as string[]).map((d) => new Date(d))
    const min = new Date(Math.min(...dates.map((d) => d.getTime())))
    min.setDate(min.getDate() - 6)
    const max = new Date(Math.max(...dates.map((d) => d.getTime())))
    max.setDate(max.getDate() + 8)
    const n = Math.round((max.getTime() - min.getTime()) / 86400000) + 1

    const dArr: { label: number; isWeekend: boolean; date: Date }[] = []
    const wBands: number[] = []
    const mAgg: { key: string; n: number; d: Date }[] = []
    const wAgg: { key: string; n: number; weekNum: number }[] = []

    for (let i = 0; i < n; i++) {
      const dd = new Date(min)
      dd.setDate(min.getDate() + i)
      const we = dd.getDay() === 0 || dd.getDay() === 6
      dArr.push({ label: dd.getDate(), isWeekend: we, date: new Date(dd) })
      if (we) wBands.push(i)

      const mk = `${dd.getFullYear()}-${dd.getMonth()}`
      const lastM = mAgg[mAgg.length - 1]
      if (lastM && lastM.key === mk) lastM.n++
      else mAgg.push({ key: mk, n: 1, d: new Date(dd) })

      const wn = weekNumber(dd)
      const wk = `${dd.getFullYear()}-W${wn}`
      const lastW = wAgg[wAgg.length - 1]
      if (lastW && lastW.key === wk) lastW.n++
      else wAgg.push({ key: wk, n: 1, weekNum: wn })
    }

    return {
      startDate: min,
      nDays: n,
      days: dArr,
      months: mAgg.map((m) => ({ label: `${MONTH_NAMES[m.d.getMonth()]} ${m.d.getFullYear()}`, width: m.n * DAY_W })),
      weeks: wAgg.map((w) => ({ label: `S${w.weekNum}`, width: w.n * DAY_W })),
      weekendBands: wBands,
    }
  }, [sorted, DAY_W])

  // Scroll to today on mount
  useEffect(() => {
    if (!scrollRef.current || nDays === 0) return
    const todayOff = Math.round((Date.now() - startDate.getTime()) / 86400000)
    const px = todayOff * DAY_W - scrollRef.current.clientWidth / 3
    if (px > 0) scrollRef.current.scrollLeft = px
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted.length > 0, zoom])

  const handleBarMouseEnter = useCallback((e: React.MouseEvent, tache: Tache) => {
    setHoveredId(tache.id)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const container = scrollRef.current?.parentElement?.getBoundingClientRect()
    if (container) {
      setTooltip({
        x: rect.left - container.left + rect.width / 2,
        y: rect.top - container.top - 8,
        tache,
      })
    }
  }, [])

  const handleBarMouseLeave = useCallback(() => {
    setHoveredId(null)
    setTooltip(null)
  }, [])

  if (sorted.length === 0) {
    return (
      <div style={{
        background: 'var(--db-card)', border: '1px solid var(--db-border)',
        borderRadius: 'var(--db-radius)', padding: '48px 16px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: 'var(--db-t3)' }}>
          {t('ganttEmpty', { defaultValue: 'Aucune tache avec des dates pour afficher le Gantt' })}
        </p>
      </div>
    )
  }

  function dayOff(dateStr: string): number {
    return Math.round((new Date(dateStr).getTime() - startDate.getTime()) / 86400000)
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayX = dayOff(todayStr) * DAY_W + DAY_W / 2
  const canvasW = nDays * DAY_W
  const bodyH = sorted.length * ROW_H

  // Dependency segments
  const depSegs: React.CSSProperties[] = []
  const idx: Record<number, number> = {}
  sorted.forEach((t, i) => { idx[t.id] = i })

  dependances.forEach((dp) => {
    const si = idx[dp.tacheSourceId]
    const ci = idx[dp.tacheCibleId]
    if (si === undefined || ci === undefined) return
    const src = sorted[si]
    const cbl = sorted[ci]
    const sEnd = src.dateFin || src.dateEcheance || src.dateDebut
    const cStart = cbl.dateDebut || cbl.dateEcheance
    if (!sEnd || !cStart) return

    const barMidY = ROW_H / 2
    const a = { x: (dayOff(sEnd) + 1) * DAY_W, y: si * ROW_H + barMidY }
    const b = { x: dayOff(cStart) * DAY_W, y: ci * ROW_H + barMidY }
    const y1 = a.y, y2 = b.y, x1 = a.x, x2 = b.x
    const mx = Math.max(x1 + 8, x2 - 10)
    const line = dp.typeDependance === 'FIN_DEBUT' ? 'solid' : 'dashed'

    depSegs.push({ position: 'absolute', left: x1, top: y1, width: mx - x1, borderTop: `1.5px ${line} var(--db-t3)`, opacity: 0.75 })
    depSegs.push({ position: 'absolute', left: mx, top: Math.min(y1, y2), height: Math.abs(y2 - y1), borderLeft: `1.5px ${line} var(--db-t3)`, opacity: 0.75 })
    depSegs.push({ position: 'absolute', left: mx, top: y2, width: Math.max(0, x2 - mx - 5), borderTop: `1.5px ${line} var(--db-t3)`, opacity: 0.75 })
    depSegs.push({ position: 'absolute', left: x2 - 6, top: y2 - 4, width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid var(--db-t3)', opacity: 0.85 })
  })

  const headerH = zoom === 'day' ? 56 : 56

  return (
    <div style={{
      background: 'var(--db-card)',
      border: '1px solid var(--db-border)',
      borderRadius: 'var(--db-radius)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--db-border)',
        background: 'var(--db-subtle)',
      }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--db-t2)' }}>
          {sorted.length} tache{sorted.length > 1 ? 's' : ''} planifiee{sorted.length > 1 ? 's' : ''}
          {cheminCritique.length > 0 && (
            <span style={{ marginLeft: 12, color: 'var(--db-danger)', fontWeight: 800 }}>
              {cheminCritique.length} sur chemin critique
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['day', 'week'] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              style={{
                padding: '4px 12px', fontSize: 11.5, fontWeight: 700,
                borderRadius: 'var(--db-radius-xs)',
                border: '1px solid var(--db-border)',
                background: zoom === z ? 'var(--db-orange)' : 'var(--db-card)',
                color: zoom === z ? '#fff' : 'var(--db-t2)',
                cursor: 'pointer',
                transition: 'all .15s ease',
              }}
            >{ZOOM_CONF[z].label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Left panel: task list */}
        <div style={{ width: LEFT_W, minWidth: LEFT_W, borderRight: '1px solid var(--db-border)' }}>
          <div style={{
            height: headerH, display: 'flex', alignItems: 'flex-end',
            padding: '0 12px 7px',
            background: 'var(--db-subtle)',
            borderBottom: '1px solid var(--db-border)',
          }}>
            <div style={{ display: 'flex', width: '100%', fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: 'var(--db-t3)' }}>
              <span style={{ flex: 1 }}>Tache</span>
              <span style={{ width: 58, textAlign: 'center' }}>Dates</span>
              <span style={{ width: 32, textAlign: 'center' }}>%</span>
              <span style={{ width: 28, textAlign: 'center' }}></span>
            </div>
          </div>
          {sorted.map((tache) => {
            const isCritical = cheminCritique.includes(tache.id)
            const hovered = hoveredId === tache.id
            const color = STATUT_COLORS[tache.statut] || '#6B7280'
            const late = ganttLateDays(tache)
            const ini = initials(tache)
            return (
              <div
                key={tache.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0 12px', height: ROW_H,
                  borderBottom: '1px solid var(--db-border)',
                  background: hovered ? 'var(--db-subtle)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background .1s',
                }}
                onMouseEnter={() => setHoveredId(tache.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onEdit?.(tache)}
              >
                {tache.estJalon ? (
                  <span style={{ width: 9, height: 9, minWidth: 9, background: 'var(--db-teal-dk)', transform: 'rotate(45deg)' }} />
                ) : (
                  <span style={{ width: 9, height: 9, minWidth: 9, borderRadius: 3, background: color }} />
                )}
                <span style={{
                  flex: 1, fontSize: 11.5, fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  minWidth: 0,
                }}>{tache.titre}</span>
                {isCritical && (
                  <span style={{
                    fontSize: 9, fontWeight: 800,
                    color: 'var(--db-danger)', border: '1px solid var(--db-danger)',
                    borderRadius: 3, padding: '0px 4px', lineHeight: '16px',
                  }}>CC</span>
                )}
                {late > 0 && !isCritical && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, color: '#fff',
                    background: 'var(--db-danger)', borderRadius: 3,
                    padding: '0px 4px', lineHeight: '16px',
                  }}>J+{late}</span>
                )}
                <span style={{
                  width: 56, textAlign: 'center', fontSize: 9.5, color: 'var(--db-t3)',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {fmtDate(tache.dateDebut)}{tache.dateFin ? `→${fmtDate(tache.dateFin)}` : ''}
                </span>
                <span style={{
                  width: 30, textAlign: 'right', fontSize: 10, fontWeight: 700,
                  color: tache.pourcentageAvancement === 100 ? 'var(--db-success)' : 'var(--db-t2)',
                  fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                }}>{tache.pourcentageAvancement}%</span>
                {ini ? (
                  <span style={{
                    width: 22, height: 22, minWidth: 22,
                    borderRadius: '50%', background: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#fff',
                    letterSpacing: '-.02em',
                  }}>{ini}</span>
                ) : (
                  <span style={{ width: 22, minWidth: 22 }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Right panel: timeline */}
        <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto' }}>
          <div style={{ width: canvasW, minWidth: canvasW }}>
            {/* Month headers */}
            <div style={{
              display: 'flex', height: 28,
              borderBottom: '1px solid var(--db-border)',
              background: 'var(--db-subtle)',
            }}>
              {months.map((m, i) => (
                <div key={i} style={{
                  width: m.width, minWidth: m.width,
                  display: 'flex', alignItems: 'center',
                  padding: '0 10px',
                  fontSize: 11, fontWeight: 800,
                  letterSpacing: '.04em', color: 'var(--db-t1)',
                  borderRight: '1px solid var(--db-border)',
                }}>{m.label}</div>
              ))}
            </div>
            {/* Day / Week sub-headers */}
            {zoom === 'day' ? (
              <div style={{
                display: 'flex', height: 27,
                borderBottom: '1px solid var(--db-border)',
                background: 'var(--db-subtle)',
              }}>
                {days.map((d, i) => (
                  <div key={i} style={{
                    width: DAY_W, minWidth: DAY_W,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9.5,
                    fontWeight: d.isWeekend ? 700 : 500,
                    color: d.isWeekend ? 'var(--db-t3)' : 'var(--db-t2)',
                    background: d.isWeekend ? 'var(--db-subtle)' : 'transparent',
                    borderRight: '1px solid var(--db-border)',
                  }}>{d.label}</div>
                ))}
              </div>
            ) : (
              <div style={{
                display: 'flex', height: 27,
                borderBottom: '1px solid var(--db-border)',
                background: 'var(--db-subtle)',
              }}>
                {weeks.map((w, i) => (
                  <div key={i} style={{
                    width: w.width, minWidth: w.width,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9.5, fontWeight: 700,
                    color: 'var(--db-t2)',
                    borderRight: '1px solid var(--db-border)',
                  }}>{w.label}</div>
                ))}
              </div>
            )}

            {/* Body */}
            <div style={{ position: 'relative', height: bodyH }}>
              {/* Weekend bands */}
              {weekendBands.map((i) => (
                <div key={`we-${i}`} style={{
                  position: 'absolute', left: i * DAY_W, top: 0,
                  width: DAY_W, height: bodyH,
                  background: 'var(--db-subtle)',
                }} />
              ))}

              {/* Today line */}
              {todayX > 0 && todayX < canvasW && (
                <>
                  <div style={{
                    position: 'absolute', left: todayX, top: 0,
                    width: 2, height: bodyH,
                    background: 'var(--db-orange)', zIndex: 3,
                    opacity: 0.85,
                  }} />
                  <div style={{
                    position: 'absolute', left: todayX + 4, top: 2,
                    fontSize: 9, fontWeight: 800, color: '#fff',
                    background: 'var(--db-orange)',
                    borderRadius: 3, padding: '2px 6px',
                    zIndex: 4, whiteSpace: 'nowrap',
                  }}>Aujourd'hui</div>
                </>
              )}

              {/* Grid rows */}
              {sorted.map((_, i) => (
                <div key={`gr-${i}`} style={{
                  position: 'absolute', left: 0, right: 0,
                  top: (i + 1) * ROW_H - 1, height: 1,
                  background: 'var(--db-border)',
                }} />
              ))}

              {/* Dependency segments */}
              {depSegs.map((style, i) => (
                <div key={`dep-${i}`} style={style} />
              ))}

              {/* Bars */}
              {sorted.map((tache, i) => {
                const dStr = tache.dateDebut!
                const fStr = tache.dateFin || tache.dateEcheance || tache.dateDebut!
                const x = dayOff(dStr) * DAY_W
                const w = Math.max(DAY_W, (Math.round((new Date(fStr).getTime() - new Date(dStr).getTime()) / 86400000) + 1) * DAY_W)
                const y = i * ROW_H + (ROW_H - BAR_H) / 2
                const isCritical = cheminCritique.includes(tache.id)
                const isLate = ganttLateDays(tache) > 0
                const lateDays = ganttLateDays(tache)
                const color = STATUT_COLORS[tache.statut] || '#6B7280'
                const hovered = hoveredId === tache.id

                if (tache.estJalon) {
                  return (
                    <div
                      key={tache.id}
                      style={{
                        position: 'absolute',
                        left: x + DAY_W / 2 - 10, top: y,
                        width: 20, height: 20,
                        background: 'var(--db-teal-dk)',
                        transform: 'rotate(45deg)',
                        border: isCritical ? '2px solid var(--db-danger)' : '1px solid var(--db-teal-dk)',
                        boxShadow: hovered ? '0 0 0 3px rgba(46,82,102,.22)' : undefined,
                        cursor: 'pointer', zIndex: 10,
                        transition: 'box-shadow .15s',
                      }}
                      onClick={() => onEdit?.(tache)}
                      onMouseEnter={(e) => handleBarMouseEnter(e, tache)}
                      onMouseLeave={handleBarMouseLeave}
                    />
                  )
                }

                const barBorder = isCritical
                  ? '2px solid var(--db-danger)'
                  : isLate
                    ? '2px dashed var(--db-danger)'
                    : '1px solid rgba(0,0,0,.12)'

                return (
                  <div
                    key={tache.id}
                    style={{
                      position: 'absolute', left: x, top: y,
                      width: w, height: BAR_H,
                      borderRadius: 5,
                      background: color,
                      border: barBorder,
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden', cursor: 'pointer',
                      boxShadow: hovered ? '0 2px 12px rgba(0,0,0,.28)' : '0 1px 3px rgba(0,0,0,.1)',
                      filter: hovered ? 'brightness(1.08)' : undefined,
                      zIndex: 10,
                      transition: 'box-shadow .15s, filter .15s',
                    }}
                    onClick={() => onEdit?.(tache)}
                    onMouseEnter={(e) => handleBarMouseEnter(e, tache)}
                    onMouseLeave={handleBarMouseLeave}
                  >
                    {/* Progress fill — darker band */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${tache.pourcentageAvancement}%`,
                      background: 'rgba(0,0,0,.18)',
                      borderRadius: '5px 0 0 5px',
                    }} />
                    {/* Title inside bar */}
                    {w > 64 && (
                      <span style={{
                        position: 'relative', zIndex: 2,
                        fontSize: 10.5, fontWeight: 700, color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        padding: '0 7px',
                        textShadow: '0 1px 2px rgba(0,0,0,.3)',
                        maxWidth: w - 44,
                      }}>{tache.titre}</span>
                    )}
                    {/* Percentage at right of bar */}
                    <span style={{
                      position: 'absolute', right: 6, top: 0, bottom: 0,
                      display: 'flex', alignItems: 'center',
                      fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,.9)',
                      textShadow: '0 1px 2px rgba(0,0,0,.3)',
                      zIndex: 2,
                    }}>{tache.pourcentageAvancement}%</span>
                    {/* Late badge on bar */}
                    {isLate && (
                      <span style={{
                        position: 'absolute', right: -1, top: -9,
                        fontSize: 8.5, fontWeight: 800, color: '#fff',
                        background: 'var(--db-danger)',
                        borderRadius: 4, padding: '1px 4px',
                        zIndex: 12, lineHeight: '13px',
                        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                      }}>J+{lateDays}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Rich tooltip */}
        {tooltip && (() => {
          const tache = tooltip.tache
          const late = ganttLateDays(tache)
          const color = STATUT_COLORS[tache.statut] || '#6B7280'
          return (
            <div style={{
              position: 'absolute',
              left: LEFT_W + tooltip.x - 120,
              top: tooltip.y - 4,
              transform: 'translateY(-100%)',
              width: 240,
              background: 'var(--db-card)',
              border: '1px solid var(--db-border)',
              borderRadius: 'var(--db-radius)',
              boxShadow: '0 8px 24px rgba(0,0,0,.18)',
              padding: '10px 12px',
              zIndex: 100,
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{tache.titre}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 10.5, color: 'var(--db-t2)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  {t(`statut.${tache.statut}`)}
                </span>
                <span><b>{tache.pourcentageAvancement}%</b> avancement</span>
                {tache.assigneA && <span>{tache.assigneA.prenom} {tache.assigneA.nom}</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--db-t3)', marginTop: 5 }}>
                <span>Debut: {fmtDate(tache.dateDebut)}</span>
                <span>Fin: {fmtDate(tache.dateFin)}</span>
                {tache.dateEcheance && <span>Echeance: {fmtDate(tache.dateEcheance)}</span>}
              </div>
              {late > 0 && (
                <div style={{
                  marginTop: 5, fontSize: 10, fontWeight: 800,
                  color: 'var(--db-danger)',
                }}>En retard de {late} jour{late > 1 ? 's' : ''}</div>
              )}
              {cheminCritique.includes(tache.id) && (
                <div style={{ marginTop: 3, fontSize: 10, fontWeight: 800, color: 'var(--db-danger)' }}>
                  Chemin critique
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 18,
        padding: '10px 16px',
        borderTop: '1px solid var(--db-border)',
        background: 'var(--db-subtle)',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: 'var(--db-t3)' }}>Legende</span>
        {[
          { color: '#3F6B83', label: 'en cours', shape: 'bar' },
          { color: '#2C9C7E', label: 'terminee', shape: 'bar' },
          { color: '#6B7280', label: 'a faire', shape: 'bar' },
          { color: '#C48A2B', label: 'en attente', shape: 'bar' },
        ].map((l) => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--db-t2)' }}>
            <span style={{ width: 20, height: 10, borderRadius: 3, background: l.color }} />
            {l.label}
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--db-t2)' }}>
          <span style={{ width: 10, height: 10, background: 'var(--db-teal-dk)', transform: 'rotate(45deg)' }} />
          jalon
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--db-t2)' }}>
          <span style={{ width: 20, height: 10, borderRadius: 3, border: '1.5px solid var(--db-danger)', background: 'transparent' }} />
          chemin critique
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--db-t2)' }}>
          <span style={{ display: 'inline-block', width: 20, height: 10, borderRadius: 3, border: '1.5px dashed var(--db-danger)', background: 'transparent' }} />
          en retard
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--db-t2)' }}>
          <span style={{ width: 20, borderTop: '1.5px solid var(--db-t3)' }} />
          dependance
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--db-t2)' }}>
          <span style={{
            width: 14, height: 14, borderRadius: '50%', background: '#3F6B83',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7.5, fontWeight: 800, color: '#fff',
          }}>AB</span>
          assigne
        </span>
      </div>
    </div>
  )
}
