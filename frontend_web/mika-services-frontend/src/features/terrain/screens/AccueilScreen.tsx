import { useEffect, useMemo, useRef, useState } from 'react'
import type { TerrainEngin } from '@/api/terrainApi'
import EnginTypeIcon from '@/features/materiel/icons/EnginTypeIcon'
import { F, FC, ICON_MUTED, INK, INK_SOFT, MUTED, ORANGE, AMBER, SURFACE, card } from '../theme'
import { AuthImg, FilterChips, StatutBadge, Skeleton, TopBar } from '../components/ui'
import { IconAlert, IconBell, IconCheck, IconClipboard, IconFuel, IconGauge, IconMore, IconPin, IconScan, IconSync, IconTransfer, IconX } from '../components/icons'
import { canTransfert, hasParcComplet, isOperateur, useTerrainMe } from '../me'
import { shouldShowPushBanner, dismissPushBanner, activatePush } from '../push'

type Filtre = 'tous' | 'a_inspecter' | 'en_panne'

/** Taille d'un lot du feed (scroll infini : le lot suivant se charge en approchant du bas). */
const FEED_BATCH = 8

/** Distance de tirage (px) déclenchant l'actualisation. */
const PULL_THRESHOLD = 58

export function AccueilScreen({ prenom, photoUrl, engins, loading, unreadCount, onScan, onOpenEngin, onRefresh, onTransferts, onAlertes, onProfil }: {
  prenom: string
  photoUrl: string | null
  engins: TerrainEngin[]
  loading: boolean
  /** Notifications non lues (badge de la cloche). */
  unreadCount: number
  onScan: () => void
  onOpenEngin: (e: TerrainEngin) => void
  onRefresh: () => void
  onTransferts: () => void
  onAlertes: () => void
  onProfil: () => void
}) {
  const me = useTerrainMe()
  const operateur = isOperateur(me)
  // Utilisateur sans affectation en cours (hors rôles voyant tout le parc) : rien à afficher
  const sansAffectation = me !== null && !hasParcComplet(me) && me.chantiers.length === 0
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')

  const sansInspection = engins.filter((e) => !e.inspectionFaiteAujourdhui)
  const enPanne = engins.filter((e) => e.statut === 'EN_PANNE')
  const initiales = (prenom || 'MK').slice(0, 2).toUpperCase()

  const visibles = useMemo(() => {
    let list = engins
    if (filtre === 'a_inspecter') list = list.filter((e) => !e.inspectionFaiteAujourdhui)
    if (filtre === 'en_panne') list = list.filter((e) => e.statut === 'EN_PANNE')
    const q = recherche.trim().toLowerCase()
    if (q) {
      list = list.filter((e) =>
        e.nom.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)
        || (e.chantierNom ?? '').toLowerCase().includes(q) || e.type.toLowerCase().includes(q))
    }
    return list
  }, [engins, filtre, recherche])

  // Push notification banner
  const [showPushBanner, setShowPushBanner] = useState(() => shouldShowPushBanner())
  const [pushActivating, setPushActivating] = useState(false)
  const handleActivatePush = async () => {
    setPushActivating(true)
    await activatePush()
    setShowPushBanner(false)
    setPushActivating(false)
  }
  const handleDismissPush = () => {
    dismissPushBanner()
    setShowPushBanner(false)
  }

  // Scroll infini : on ne rend qu'un nombre limité de cartes, étendu quand la sentinelle devient visible
  const [renderCount, setRenderCount] = useState(FEED_BATCH)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { setRenderCount(FEED_BATCH) }, [filtre, recherche])
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || renderCount >= visibles.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setRenderCount((n) => Math.min(n + FEED_BATCH, visibles.length))
      },
      { rootMargin: '600px 0px' }, // précharge bien avant d'atteindre le bas
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [renderCount, visibles.length])
  const rendus = visibles.slice(0, renderCount)

  // Icônes monochromes — la couleur est réservée aux badges et au CTA scan.
  // Raccourcis conditionnés par le rôle (miroir des @PreAuthorize backend).
  const actions = [
    ...(operateur ? [{ Icon: IconClipboard, label: 'Inspection', onClick: onScan }] : []),
    { Icon: IconAlert, label: 'Panne', onClick: onScan },
    ...(operateur ? [
      { Icon: IconGauge, label: 'Compteur', onClick: onScan },
      { Icon: IconFuel, label: 'Carburant', onClick: onScan },
    ] : []),
    ...(canTransfert(me) ? [{ Icon: IconTransfer, label: 'Transfert', onClick: onTransferts }] : []),
  ]

  const chips: { id: Filtre; label: string; count?: number }[] = [
    { id: 'tous', label: 'Tous', count: engins.length },
    { id: 'a_inspecter', label: 'À inspecter', count: sansInspection.length },
    { id: 'en_panne', label: 'En panne', count: enPanne.length },
  ]

  // Pull-to-refresh : tirer le feed vers le bas depuis le haut de page pour actualiser
  const startY = useRef<number | null>(null)
  const [pull, setPull] = useState(0)
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = window.scrollY <= 0 ? e.touches[0].clientY : null
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0 && window.scrollY <= 0) setPull(Math.min(delta * 0.38, 78))
    else setPull(0)
  }
  const onTouchEnd = () => {
    if (pull >= PULL_THRESHOLD && !loading) onRefresh()
    startY.current = null
    setPull(0)
  }

  const iconBtn: React.CSSProperties = {
    appearance: 'none', border: 'none', cursor: 'pointer',
    width: 42, height: 42, borderRadius: '50%', background: 'transparent', color: INK,
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
  }

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {/* Top bar — avatar | recherche | cloche (convention LinkedIn) */}
      <TopBar
        initiales={initiales}
        photoUrl={photoUrl}
        onAvatar={onProfil}
        recherche={recherche}
        onRecherche={setRecherche}
        placeholder="Rechercher un engin, un chantier…"
        right={(
          <button onClick={onAlertes} className="tk-press" style={{ ...iconBtn, width: 50, height: 50 }} aria-label="Notifications">
            <IconBell size={30} strokeWidth={1.9} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 5, right: 6, minWidth: 17, height: 17, borderRadius: 999, background: ORANGE, color: '#fff', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid #fff' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      />

      {/* Indicateur pull-to-refresh */}
      {(pull > 0 || loading) && (
        <div style={{ display: 'flex', justifyContent: 'center', height: pull > 0 ? pull : 44, alignItems: 'center', overflow: 'hidden', transition: pull > 0 ? 'none' : 'height .2s ease' }}>
          <span style={{
            width: 34, height: 34, borderRadius: '50%', background: '#fff', border: '1px solid #E5EAEF',
            boxShadow: '0 2px 8px rgba(15,27,38,.08)', color: pull >= PULL_THRESHOLD || loading ? ORANGE : MUTED,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: loading ? undefined : `rotate(${pull * 2.4}deg)`,
            animation: loading ? 'tkSpin .8s linear infinite' : undefined,
          }}>
            <IconSync size={18} strokeWidth={2.1} />
          </span>
        </div>
      )}

      <div style={{ padding: '14px 0 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Salutation */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontFamily: FC, fontSize: 24, fontWeight: 700, color: INK, lineHeight: 1.15 }}>
            Bonjour{prenom ? `, ${prenom}` : ''}
          </div>
          <div style={{ fontSize: 13, color: MUTED, textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Actions rapides — monochromes, scan seul en accent */}
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '2px 16px', scrollbarWidth: 'none' }}>
          <button onClick={onScan} className="tk-press" style={{ appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: F, flexShrink: 0 }}>
            <span style={{
              width: 58, height: 58, borderRadius: '50%',
              background: `linear-gradient(135deg, ${ORANGE} 0%, #E85A24 100%)`, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(255,107,53,.32)',
            }}>
              <IconScan size={25} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>Scanner</span>
          </button>
          {actions.map(({ Icon, label, onClick }) => (
            <button key={label} onClick={onClick} className="tk-press" style={{ appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: F, flexShrink: 0 }}>
              <span style={{
                width: 58, height: 58, borderRadius: '50%', background: '#fff', color: INK_SOFT,
                border: '1px solid #E5EAEF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={24} strokeWidth={1.7} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: INK_SOFT }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Alerte inspections */}
        {!loading && sansInspection.length > 0 && (
          <div style={{ margin: '0 16px', background: '#FFF7ED', border: '1px solid #FDDCB8', borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: '#FDEECF', color: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconAlert size={20} strokeWidth={2} />
            </span>
            <div style={{ fontSize: 13.5, color: '#7C4A03', lineHeight: 1.4 }}>
              <strong>{sansInspection.length} inspection{sansInspection.length > 1 ? 's' : ''} du jour à faire</strong>
              <span style={{ display: 'block', fontSize: 12.5, color: '#A16A20' }}>
                {sansInspection.slice(0, 3).map((e) => e.code).join(' · ')}{sansInspection.length > 3 ? '…' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Bandeau push notifications */}
        {showPushBanner && (
          <div style={{ margin: '0 16px', background: '#fff', border: `1.5px solid ${ORANGE}`, borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0E8', color: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconBell size={20} strokeWidth={2} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>Activez les notifications</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.3, marginTop: 2 }}>Transferts, DMA et incidents en temps réel.</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={handleDismissPush}
                style={{ appearance: 'none', border: 'none', background: 'transparent', color: MUTED, cursor: 'pointer', padding: 6, display: 'flex' }}
                aria-label="Plus tard"
              >
                <IconX size={16} strokeWidth={2.2} />
              </button>
              <button
                onClick={() => void handleActivatePush()}
                disabled={pushActivating}
                className="tk-press"
                style={{
                  appearance: 'none', border: 'none', borderRadius: 10, background: ORANGE, color: '#fff',
                  padding: '8px 14px', fontSize: 13, fontWeight: 700, fontFamily: F, cursor: 'pointer',
                }}
              >
                {pushActivating ? '...' : 'Activer'}
              </button>
            </div>
          </div>
        )}

        {/* Chips de filtre */}
        <FilterChips
          chips={chips.map((c) => ({ ...c, count: loading ? undefined : c.count }))}
          value={filtre}
          onChange={setFiltre}
        />

        {/* Feed équipements */}
        <div style={{ padding: '0 16px' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton height={86} /><Skeleton height={86} /><Skeleton height={86} />
            </div>
          )}
          {!loading && visibles.length === 0 && (
            sansAffectation && engins.length === 0 ? (
              <div style={{ ...card, padding: '26px 20px', textAlign: 'center' }}>
                <span style={{ width: 52, height: 52, borderRadius: '50%', background: SURFACE, color: ICON_MUTED, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <IconPin size={26} strokeWidth={1.7} />
                </span>
                <div style={{ fontFamily: FC, fontSize: 18, fontWeight: 700, color: INK }}>Aucun chantier affecté</div>
                <div style={{ fontSize: 13.5, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
                  Vous n'êtes affecté à aucun chantier en cours. Les engins de vos chantiers apparaîtront ici — rapprochez-vous de votre chef de projet.
                </div>
              </div>
            ) : (
              <div style={{ ...card, padding: 18, textAlign: 'center', color: MUTED, fontSize: 14 }}>
                {engins.length === 0 ? 'Aucun engin sur vos chantiers.' : 'Aucun résultat pour cette recherche.'}
              </div>
            )
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rendus.map((e) => (
              <button
                key={e.id}
                onClick={() => onOpenEngin(e)}
                className="tk-press"
                style={{ ...card, appearance: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: F, overflow: 'hidden' }}
              >
                {/* En-tête type post : petit avatar + identité + kebab */}
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 8px 11px 14px' }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box',
                    border: `1.5px solid ${ORANGE}`, padding: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff',
                  }}>
                    <AuthImg
                      src={e.photo ?? ''}
                      alt=""
                      imgStyle={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                      fallback={
                        <span style={{ width: '100%', height: '100%', borderRadius: '50%', background: SURFACE, color: INK_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <EnginTypeIcon type={e.type} size={20} className="" />
                        </span>
                      }
                    />
                  </span>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nom}</span>
                    <span style={{ fontSize: 12.5, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.code}{e.marque ? ` · ${e.marque}${e.modele ? ` ${e.modele}` : ''}` : ''}
                    </span>
                  </span>
                  <span style={{ color: ICON_MUTED, display: 'flex', padding: 6, flexShrink: 0 }} aria-hidden="true">
                    <IconMore size={20} strokeWidth={1.8} />
                  </span>
                </span>

                {/* Média — la photo de l'engin en grand, pleine largeur */}
                <span style={{ display: 'block', width: '100%', height: 190, background: '#EDF1F5', position: 'relative' }}>
                  <AuthImg
                    src={e.photo ?? ''}
                    alt={e.nom}
                    imgStyle={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    fallback={
                      <span style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: ICON_MUTED, background: 'linear-gradient(160deg, #F0F3F7 0%, #E3E9EF 100%)' }}>
                        <EnginTypeIcon type={e.type} size={54} className="" />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Pas encore de photo</span>
                      </span>
                    }
                  />
                  {/* Statut en overlay sur le média */}
                  <span style={{ position: 'absolute', top: 10, left: 10 }}>
                    <StatutBadge statut={e.statut} />
                  </span>
                </span>

                {/* Rangée d'actions type like/suivre — remplacée par les infos engin */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: e.inspectionFaiteAujourdhui ? '#137A3D' : AMBER, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {e.inspectionFaiteAujourdhui
                      ? <><IconCheck size={14} strokeWidth={2.6} /> Inspection faite</>
                      : <><IconAlert size={14} strokeWidth={2.3} /> Inspection à faire</>}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: MUTED, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <IconGauge size={14} strokeWidth={2} /> {e.heuresCompteur} h
                  </span>
                </span>

                {/* Légende type caption : chantier en cours */}
                {e.chantierNom && (
                  <span style={{ display: 'block', padding: '0 14px 13px', fontSize: 13, color: INK_SOFT }}>
                    <strong style={{ color: INK }}>Chantier</strong> · {e.chantierNom}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sentinelle scroll infini + indicateur de chargement du lot suivant */}
          {!loading && renderCount < visibles.length && (
            <div ref={sentinelRef} style={{ padding: '14px 0' }}>
              <Skeleton height={86} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
