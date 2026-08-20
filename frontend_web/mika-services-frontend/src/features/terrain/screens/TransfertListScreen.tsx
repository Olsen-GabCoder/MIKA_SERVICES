/**
 * Transferts d'engins — liste des mouvements inter-chantiers.
 */
import { useEffect, useMemo, useState } from 'react'
import { terrainApi, type Transfert } from '@/api/terrainApi'
import { peekCachedGet } from '@/api/axios'
import { F, FC, ICON_MUTED, INK, INK_SOFT, MUTED, SURFACE, card, errMsg } from '../theme'
import { Fab, FilterChips, Skeleton, TopBar, TransfertStatutBadge } from '../components/ui'
import { IconChevronRight, IconPlus, IconSync, IconTransfer } from '../components/icons'
import { canTransfert, useTerrainMe } from '../me'

type FiltreTransfert = 'tous' | 'demandes' | 'a_partir' | 'en_transit' | 'recus'

export function TransfertListScreen({ prenom, photoUrl, onOpen, onCreate, onProfil, onError }: {
  prenom: string
  photoUrl: string | null
  onOpen: (t: Transfert) => void
  onCreate: () => void
  onProfil: () => void
  onError: (m: string) => void
}) {
  const me = useTerrainMe()
  // Stale-while-revalidate : cache immédiat (mêmes params que terrainApi.transferts), refresh en arrière-plan.
  const peek = () => peekCachedGet<{ content: Transfert[] }>('/terrain/transferts', { statut: undefined, sort: 'dateDemande,desc', size: 50 })
  const [transferts, setTransferts] = useState<Transfert[]>(() => peek()?.content ?? [])
  const [loading, setLoading] = useState(() => peek() === null)
  const [filtre, setFiltre] = useState<FiltreTransfert>('tous')
  const [recherche, setRecherche] = useState('')
  const initiales = (prenom || 'MK').slice(0, 2).toUpperCase()

  const load = async () => {
    try {
      setTransferts(await terrainApi.transferts())
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const visibles = useMemo(() => {
    let list = transferts
    if (filtre === 'demandes') list = list.filter((t) => t.statut === 'DEMANDE' || t.statut === 'REJETE')
    if (filtre === 'a_partir') list = list.filter((t) => t.statut === 'EN_ATTENTE_DEPART')
    if (filtre === 'en_transit') list = list.filter((t) => t.statut === 'EN_TRANSIT')
    if (filtre === 'recus') list = list.filter((t) => t.statut === 'RECU')
    const q = recherche.trim().toLowerCase()
    if (q) {
      list = list.filter((t) =>
        t.enginNom.toLowerCase().includes(q) || t.enginCode.toLowerCase().includes(q)
        || (t.projetOrigineNom ?? '').toLowerCase().includes(q)
        || t.projetDestinationNom.toLowerCase().includes(q))
    }
    return list
  }, [transferts, filtre, recherche])

  const chips: { id: FiltreTransfert; label: string; count: number }[] = [
    { id: 'tous', label: 'Tous', count: transferts.length },
    { id: 'demandes', label: 'À valider', count: transferts.filter((t) => t.statut === 'DEMANDE').length },
    { id: 'a_partir', label: 'À faire partir', count: transferts.filter((t) => t.statut === 'EN_ATTENTE_DEPART').length },
    { id: 'en_transit', label: 'En transit', count: transferts.filter((t) => t.statut === 'EN_TRANSIT').length },
    { id: 'recus', label: 'Reçus', count: transferts.filter((t) => t.statut === 'RECU').length },
  ]

  return (
    <div>
      <TopBar
        initiales={initiales}
        photoUrl={photoUrl}
        onAvatar={onProfil}
        recherche={recherche}
        onRecherche={setRecherche}
        placeholder="Rechercher un engin, un chantier…"
        right={(
          <button onClick={() => void load()} className="tk-press" aria-label="Actualiser" style={{ appearance: 'none', border: 'none', cursor: 'pointer', width: 42, height: 42, borderRadius: '50%', background: 'transparent', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconSync size={20} strokeWidth={1.9} />
          </button>
        )}
      />

      <div style={{ padding: '14px 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontFamily: FC, fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.15 }}>
            Transferts d'engins
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>
            Mouvements inter-chantiers — départ et réception
          </div>
        </div>

        {/* Chips de filtre */}
        <FilterChips
          chips={chips.map((c) => ({ ...c, count: loading ? undefined : c.count }))}
          value={filtre}
          onChange={setFiltre}
        />

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <><Skeleton height={96} /><Skeleton height={96} /><Skeleton height={96} /></>}

          {!loading && visibles.length === 0 && (
            <div style={{ ...card, padding: 22, textAlign: 'center', color: MUTED, fontSize: 14 }}>
              {transferts.length === 0 ? 'Aucun transfert pour le moment.' : 'Aucun transfert pour ce filtre.'}
            </div>
          )}

          {!loading && visibles.map((t) => (
            <button
              key={t.id}
              onClick={() => onOpen(t)}
              className="tk-press"
              style={{ ...card, appearance: 'none', padding: '13px 10px 13px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: F, display: 'flex', gap: 12, alignItems: 'center' }}
            >
              <span style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: SURFACE, color: INK_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconTransfer size={24} strokeWidth={1.7} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.enginNom}</span>
                  <TransfertStatutBadge statut={t.statut} />
                </span>
                <span style={{ fontSize: 12.5, color: INK_SOFT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.projetOrigineNom ?? 'Dépôt'} → {t.projetDestinationNom}
                </span>
                <span style={{ fontSize: 12.5, color: MUTED }}>
                  {t.enginCode} · demandé le {new Date(t.dateDemande).toLocaleDateString('fr-FR')}
                </span>
              </span>
              <span style={{ color: ICON_MUTED, display: 'flex', flexShrink: 0 }} aria-hidden="true">
                <IconChevronRight size={20} strokeWidth={1.9} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* FAB création — masqué pour les rôles sans droit d'initier un transfert */}
      {canTransfert(me) && (
        <Fab onClick={onCreate} ariaLabel="Nouveau transfert">
          <IconPlus size={26} strokeWidth={2.2} />
        </Fab>
      )}
    </div>
  )
}
