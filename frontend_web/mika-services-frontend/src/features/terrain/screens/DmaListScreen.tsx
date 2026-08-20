/**
 * DMA — liste des demandes de matériel (feed mobile terrain).
 */
import { useEffect, useMemo, useState } from 'react'
import { terrainApi, type Dma, type StatutDma } from '@/api/terrainApi'
import { peekCachedGet } from '@/api/axios'
import { DMA_PRIORITE_COLORS, F, FC, ICON_MUTED, INK, INK_SOFT, MUTED, SURFACE, card, errMsg } from '../theme'
import { DmaStatutBadge, Fab, FilterChips, Skeleton, TopBar } from '../components/ui'
import { IconBox, IconChevronRight, IconPlus, IconSync } from '../components/icons'
import { canCreateDma, useTerrainMe } from '../me'

type FiltreDma = 'toutes' | 'en_cours' | 'a_valider' | 'livrees' | 'rejetees'
const EN_COURS: StatutDma[] = ['SOUMISE', 'PRISE_EN_CHARGE', 'EN_ATTENTE_COMPLEMENT', 'EN_COMMANDE']
/** Circuit à une porte : « à traiter » = en attente d'arbitrage logistique. */
const A_VALIDER: StatutDma[] = ['SOUMISE']

export function DmaListScreen({ prenom, photoUrl, onOpen, onCreate, onProfil, onError }: {
  prenom: string
  photoUrl: string | null
  onOpen: (d: Dma) => void
  onCreate: () => void
  onProfil: () => void
  onError: (m: string) => void
}) {
  const me = useTerrainMe()
  // Stale-while-revalidate : cache immédiat (mêmes params que terrainApi.demandes), refresh en arrière-plan.
  const peek = () => peekCachedGet<{ content: Dma[] }>('/terrain/demandes', { statut: undefined, sort: 'createdAt,desc', size: 50 })
  const [demandes, setDemandes] = useState<Dma[]>(() => peek()?.content ?? [])
  const [loading, setLoading] = useState(() => peek() === null)
  const [filtre, setFiltre] = useState<FiltreDma>('toutes')
  const [recherche, setRecherche] = useState('')
  const initiales = (prenom || 'MK').slice(0, 2).toUpperCase()

  const load = async () => {
    try {
      setDemandes(await terrainApi.demandes())
    } catch (e) {
      onError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const visibles = useMemo(() => {
    let list = demandes
    if (filtre === 'en_cours') list = list.filter((d) => EN_COURS.includes(d.statut))
    if (filtre === 'a_valider') list = list.filter((d) => A_VALIDER.includes(d.statut))
    if (filtre === 'livrees') list = list.filter((d) => d.statut === 'LIVRE' || d.statut === 'CLOTUREE')
    if (filtre === 'rejetees') list = list.filter((d) => d.statut === 'REJETEE')
    const q = recherche.trim().toLowerCase()
    if (q) {
      list = list.filter((d) =>
        d.reference.toLowerCase().includes(q)
        || d.projetNom.toLowerCase().includes(q)
        || d.createurNom.toLowerCase().includes(q)
        || d.lignes.some((l) => l.designation.toLowerCase().includes(q)))
    }
    return list
  }, [demandes, filtre, recherche])

  const chips: { id: FiltreDma; label: string; count: number }[] = [
    { id: 'toutes', label: 'Toutes', count: demandes.length },
    { id: 'en_cours', label: 'En cours', count: demandes.filter((d) => EN_COURS.includes(d.statut)).length },
    { id: 'a_valider', label: 'À traiter', count: demandes.filter((d) => A_VALIDER.includes(d.statut)).length },
    { id: 'livrees', label: 'Livrées', count: demandes.filter((d) => d.statut === 'LIVRE' || d.statut === 'CLOTUREE').length },
    { id: 'rejetees', label: 'Rejetées', count: demandes.filter((d) => d.statut === 'REJETEE').length },
  ]

  return (
    <div>
      <TopBar
        initiales={initiales}
        photoUrl={photoUrl}
        onAvatar={onProfil}
        recherche={recherche}
        onRecherche={setRecherche}
        placeholder="Rechercher une demande, un chantier…"
        right={(
          <button onClick={() => void load()} className="tk-press" aria-label="Actualiser" style={{ appearance: 'none', border: 'none', cursor: 'pointer', width: 42, height: 42, borderRadius: '50%', background: 'transparent', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconSync size={20} strokeWidth={1.9} />
          </button>
        )}
      />

      <div style={{ padding: '14px 0 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Titre de section */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontFamily: FC, fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.15 }}>
            Demandes de matériel
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>
            Suivi des DMA — création, validation et livraison
          </div>
        </div>

        {/* Chips de filtre */}
        <FilterChips
          chips={chips.map((c) => ({ ...c, count: loading ? undefined : c.count }))}
          value={filtre}
          onChange={setFiltre}
        />

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <><Skeleton height={92} /><Skeleton height={92} /><Skeleton height={92} /></>}

          {!loading && visibles.length === 0 && (
            <div style={{ ...card, padding: 22, textAlign: 'center', color: MUTED, fontSize: 14 }}>
              {demandes.length === 0 ? 'Aucune demande de matériel pour le moment.' : 'Aucune demande pour ce filtre.'}
            </div>
          )}

          {!loading && visibles.map((d) => (
            <button
              key={d.id}
              onClick={() => onOpen(d)}
              className="tk-press"
              style={{ ...card, appearance: 'none', padding: '13px 10px 13px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: F, display: 'flex', gap: 12, alignItems: 'center' }}
            >
              <span style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: SURFACE, color: INK_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBox size={24} strokeWidth={1.7} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reference}</span>
                  <DmaStatutBadge statut={d.statut} />
                </span>
                <span style={{ fontSize: 12.5, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.projetNom} · {d.lignes.length} ligne{d.lignes.length > 1 ? 's' : ''} · {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: DMA_PRIORITE_COLORS[d.priorite] ?? MUTED }}>
                  Priorité {d.priorite.toLowerCase()}
                </span>
              </span>
              <span style={{ color: ICON_MUTED, display: 'flex', flexShrink: 0 }} aria-hidden="true">
                <IconChevronRight size={20} strokeWidth={1.9} />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* FAB création — masqué pour les rôles sans droit de création */}
      {canCreateDma(me) && (
        <Fab onClick={onCreate} ariaLabel="Nouvelle demande">
          <IconPlus size={26} strokeWidth={2.2} />
        </Fab>
      )}
    </div>
  )
}
