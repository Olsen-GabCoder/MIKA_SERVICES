/**
 * Alertes — notifications in-app de l'utilisateur terrain.
 */
import { useEffect, useMemo, useState } from 'react'
import { terrainApi, type TerrainNotification } from '@/api/terrainApi'
import { peekCachedGet } from '@/api/axios'
import { F, FC, HAIRLINE, ICON_MUTED, INK, INK_SOFT, MUTED, ORANGE, SURFACE, card, errMsg } from '../theme'
import { Skeleton } from '../components/ui'
import { IconAlert, IconBell, IconBox, IconCheck, IconSync, IconTransfer } from '../components/icons'

type FiltreAlertes = 'toutes' | 'non_lues'

function familleIcon(type: string) {
  if (type.startsWith('DMA')) return IconBox
  if (type.startsWith('MOUVEMENT')) return IconTransfer
  if (type === 'INCIDENT' || type.includes('INCIDENT')) return IconAlert
  return IconBell
}

function dateRelative(iso: string): string {
  const d = new Date(iso)
  const diffMin = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000))
  if (diffMin < 1) return 'À l\u2019instant'
  if (diffMin < 60) return `Il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `Il y a ${diffH} h`
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function groupeDate(iso: string): 'Aujourd\u2019hui' | 'Hier' | 'Plus ancien' {
  const d = new Date(iso)
  const now = new Date()
  const jour = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
  if (jour(d) === jour(now)) return 'Aujourd\u2019hui'
  const hier = new Date(now)
  hier.setDate(now.getDate() - 1)
  if (jour(d) === jour(hier)) return 'Hier'
  return 'Plus ancien'
}

export function AlertesScreen({ onNavigate, onError, onCountChanged }: {
  /** Navigation par type de notification (dma-list, transfert-list). */
  onNavigate: (target: 'dma-list' | 'transfert-list') => void
  onError: (m: string) => void
  onCountChanged: () => void
}) {
  // Stale-while-revalidate : cache immédiat (mêmes params que terrainApi.notifications), refresh en arrière-plan.
  const peek = () => peekCachedGet<{ content: TerrainNotification[] }>('/terrain/notifications', { size: 50 })
  const [notifs, setNotifs] = useState<TerrainNotification[]>(() => peek()?.content ?? [])
  const [loading, setLoading] = useState(() => peek() === null)
  const [filtre, setFiltre] = useState<FiltreAlertes>('toutes')

  const load = async () => {
    try {
      setNotifs(await terrainApi.notifications())
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const nonLues = notifs.filter((n) => !n.lu).length

  const visibles = useMemo(
    () => (filtre === 'non_lues' ? notifs.filter((n) => !n.lu) : notifs),
    [notifs, filtre],
  )

  const groupes = useMemo(() => {
    const ordre: ('Aujourd\u2019hui' | 'Hier' | 'Plus ancien')[] = ['Aujourd\u2019hui', 'Hier', 'Plus ancien']
    return ordre
      .map((g) => ({ titre: g, items: visibles.filter((n) => groupeDate(n.dateCreation) === g) }))
      .filter((g) => g.items.length > 0)
  }, [visibles])

  const openNotif = (n: TerrainNotification) => {
    if (!n.lu) {
      // Optimiste : marquer lue localement, l'appel part en arrière-plan.
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, lu: true } : x)))
      terrainApi.marquerNotifLue(n.id).then(onCountChanged).catch(() => { /* silencieux */ })
    }
    if (n.typeNotification.startsWith('DMA')) onNavigate('dma-list')
    else if (n.typeNotification.startsWith('MOUVEMENT')) onNavigate('transfert-list')
  }

  const marquerToutLu = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })))
    try {
      await terrainApi.toutLu()
      onCountChanged()
    } catch (e) {
      onError(errMsg(e))
    }
  }

  return (
    <div>
      {/* Top bar — titre | sync */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${HAIRLINE}`,
        padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: '#fff', border: `1.5px solid ${ORANGE}`, color: ORANGE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconBell size={20} strokeWidth={1.9} />
        </div>
        <div style={{ flex: 1, fontFamily: FC, fontSize: 20, fontWeight: 700, color: INK }}>Alertes</div>
        <button onClick={() => void load()} className="tk-press" aria-label="Actualiser" style={{ appearance: 'none', border: 'none', cursor: 'pointer', width: 42, height: 42, borderRadius: '50%', background: 'transparent', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconSync size={20} strokeWidth={1.9} />
        </button>
      </div>

      <div style={{ padding: '14px 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Chips + tout marquer lu */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {([
            { id: 'toutes' as const, label: 'Toutes', count: notifs.length },
            { id: 'non_lues' as const, label: 'Non lues', count: nonLues },
          ]).map((c) => {
            const actif = filtre === c.id
            return (
              <button
                key={c.id}
                onClick={() => setFiltre(c.id)}
                style={{
                  appearance: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13.5, fontWeight: 600,
                  padding: '8px 14px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
                  border: `1.5px solid ${actif ? INK : '#DDE3E9'}`,
                  background: actif ? INK : '#fff', color: actif ? '#fff' : INK_SOFT,
                }}
              >
                {c.label}{!loading ? ` ${c.count}` : ''}
              </button>
            )
          })}
          <div style={{ flex: 1 }} />
          {nonLues > 0 && (
            <button
              onClick={() => void marquerToutLu()}
              className="tk-press"
              style={{
                appearance: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0,
                padding: '8px 13px', borderRadius: 999, border: `1.5px solid ${ORANGE}`,
                background: '#fff', color: ORANGE,
              }}
            >
              <IconCheck size={15} strokeWidth={2.2} />
              Tout marquer lu
            </button>
          )}
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <><Skeleton height={84} /><Skeleton height={84} /><Skeleton height={84} /></>}

          {!loading && visibles.length === 0 && (
            <div style={{ ...card, padding: 22, textAlign: 'center', color: MUTED, fontSize: 14 }}>
              {notifs.length === 0 ? 'Aucune alerte pour le moment.' : 'Aucune alerte non lue.'}
            </div>
          )}

          {!loading && groupes.map((g) => (
            <div key={g.titre} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontFamily: FC, fontSize: 13.5, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.05em', padding: '4px 2px 0' }}>
                {g.titre}
              </div>
              {g.items.map((n) => {
                const Icon = familleIcon(n.typeNotification)
                return (
                  <button
                    key={n.id}
                    onClick={() => openNotif(n)}
                    className="tk-press"
                    style={{ ...card, appearance: 'none', padding: '13px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: F, display: 'flex', gap: 12, alignItems: 'flex-start' }}
                  >
                    <span style={{ position: 'relative', width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: SURFACE, color: INK_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={24} strokeWidth={1.7} />
                      {!n.lu && (
                        <span aria-label="Non lue" style={{ position: 'absolute', top: -3, right: -3, width: 11, height: 11, borderRadius: '50%', background: ORANGE, border: '2px solid #fff' }} />
                      )}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 14.5, fontWeight: n.lu ? 600 : 700, color: INK }}>{n.titre}</span>
                      {n.contenu && (
                        <span style={{ fontSize: 12.5, color: MUTED, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {n.contenu}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: ICON_MUTED }}>{dateRelative(n.dateCreation)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
