/**
 * Application mobile terrain (/terrain) — shell : navigation interne + tab bar + toasts.
 * Écrans dans ../screens/, design system dans ../theme.ts et ../components/.
 * Usage terrain : cibles >= 56px, gants, plein soleil — Barlow, fond #F4F6F8.
 */
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchUserFromToken, logoutUser, refreshToken } from '@/store/slices/authSlice'
import { getAccessToken } from '@/utils/tokenStorage'
import { TerrainLoginScreen } from '../screens/TerrainLoginScreen'
import { terrainApi, type TerrainEngin, type TerrainMe } from '@/api/terrainApi'
import { userApi } from '@/api/userApi'
import { TerrainMeProvider } from '../me'
import type { PositionEngin } from '@/types/materiel'
import { submitTerrainMutation } from '../offline/submitTerrainMutation'
import { replayAll } from '../offline/terrainOutbox'
import { useTerrainOutbox } from '../offline/useTerrainOutbox'
import { useIsOnline } from '@/hooks/useConnectivity'
import { peekCachedGet } from '@/api/axios'
import { clearResponseCacheMatching } from '@/utils/responseCache'
import { TerrainInstallBanner } from '../components/TerrainInstallBanner'
import { BG, F, HEADER_DARK, INK, MUTED, errMsg, getGps } from '../theme'
import { Toast } from '../components/ui'
import { IconBox, IconCloudOff, IconHome, IconScan, IconSync, IconTransfer } from '../components/icons'
import type { Screen } from '../screens/shared'
import type { Dma, Transfert } from '@/api/terrainApi'
import { DmaListScreen } from '../screens/DmaListScreen'
import { DmaFormScreen } from '../screens/DmaFormScreen'
import { DmaDetailScreen } from '../screens/DmaDetailScreen'
import { TransfertListScreen } from '../screens/TransfertListScreen'
import { TransfertFormScreen } from '../screens/TransfertFormScreen'
import { TransfertDetailScreen } from '../screens/TransfertDetailScreen'
import { BonTransfertScreen } from '../screens/BonTransfertScreen'
import { ReceptionTransfertScreen } from '../screens/ReceptionTransfertScreen'
import { AccueilScreen } from '../screens/AccueilScreen'
import { ScanScreen } from '../screens/ScanScreen'
import { EnginScreen } from '../screens/EnginScreen'
import { SignalementScreen } from '../screens/SignalementScreen'
import { InspectionScreen } from '../screens/InspectionScreen'
import { ReleveScreen } from '../screens/ReleveScreen'
import { RavitaillementScreen } from '../screens/RavitaillementScreen'
import { SyncScreen } from '../screens/SyncScreen'
import { AlertesScreen } from '../screens/AlertesScreen'
import { ProfilScreen } from '../screens/ProfilScreen'

const GLOBAL_CSS = `
@keyframes tkShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes tkIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes tkSpin { to { transform: rotate(360deg); } }
html, body { overscroll-behavior-y: contain; }
.tk-press { transition: transform .12s ease, box-shadow .12s ease; }
.tk-press:active { transform: scale(.98); }
.tk-screen { animation: tkIn .18s ease; }
`

const QUEUED_MSG = 'Enregistré sur l\u2019appareil — sera synchronisé au retour du réseau'

/**
 * Gate d'authentification terrain : restaure la session (cookie refresh httpOnly)
 * puis affiche l'app, sinon l'écran de connexion dédié mobile.
 */
export function TerrainAppPage() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const [checking, setChecking] = useState(() => !isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) { setChecking(false); return }
    let cancelled = false
    ;(async () => {
      try {
        if (!getAccessToken()) await dispatch(refreshToken()).unwrap()
        await dispatch(fetchUserFromToken()).unwrap()
      } catch { /* pas de session restaurable → écran de connexion */ }
      if (!cancelled) setChecking(false)
    })()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img
          src="/Logo_mika_services.png"
          alt="MIKA Services"
          style={{ width: 160, maxWidth: '55vw', height: 'auto', display: 'block' }}
        />
      </div>
    )
  }
  if (!isAuthenticated) return <TerrainLoginScreen />
  return <TerrainShell />
}

function TerrainShell() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const prenom = user?.prenom || user?.nom || ''

  const [screen, setScreen] = useState<Screen>('accueil')
  // Contexte rôles/permissions/chantiers — SWR (cache immédiat, refresh en arrière-plan)
  const [me, setMe] = useState<TerrainMe | null>(() => peekCachedGet<TerrainMe>('/terrain/me'))
  useEffect(() => {
    let alive = true
    terrainApi.me().then((m) => { if (alive) setMe(m) }).catch(() => { /* offline : cache ou helpers permissifs */ })
    return () => { alive = false }
  }, [])

  // Photo de profil (blob authentifié) — partagée entre les top bars et l'écran Profil
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const loadPhoto = useCallback(() => {
    userApi.getPhotoBlob().then((blob) => {
      setPhotoUrl((old) => {
        if (old) URL.revokeObjectURL(old)
        return blob ? URL.createObjectURL(blob) : null
      })
    })
  }, [])
  useEffect(() => { loadPhoto() }, [loadPhoto])
  // Stale-while-revalidate : affichage immédiat du dernier cache, refresh en arrière-plan.
  const [engins, setEngins] = useState<TerrainEngin[]>(() => peekCachedGet<TerrainEngin[]>('/terrain/mes-engins') ?? [])
  const [loading, setLoading] = useState(() => peekCachedGet<TerrainEngin[]>('/terrain/mes-engins') === null)
  const [engin, setEngin] = useState<TerrainEngin | null>(null)
  const [dma, setDma] = useState<Dma | null>(null)
  /** DMA source pour la duplication (pré-remplit le formulaire de création). */
  const [dmaModele, setDmaModele] = useState<Dma | null>(null)
  const [transfert, setTransfert] = useState<Transfert | null>(null)
  const [transfertEnginInitial, setTransfertEnginInitial] = useState<TerrainEngin | null>(null)
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null)

  const showToast = useCallback((msg: string, error?: boolean) => {
    setToast({ msg, error })
    window.setTimeout(() => setToast(null), 3500)
  }, [])

  const loadEngins = useCallback(async () => {
    try {
      setEngins(await terrainApi.mesEngins())
    } catch (e) {
      showToast(errMsg(e), true)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { void loadEngins() }, [loadEngins])

  // ── Alertes : compteur de notifications non lues (pas de STOMP avant Phase 6) ──
  const [unreadCount, setUnreadCount] = useState(0)
  const refreshUnread = useCallback(() => {
    terrainApi.notificationsCount().then(setUnreadCount).catch(() => { /* silencieux (offline) */ })
  }, [])
  useEffect(() => {
    refreshUnread()
    window.addEventListener('online', refreshUnread)
    return () => window.removeEventListener('online', refreshUnread)
  }, [refreshUnread])
  useEffect(() => { if (screen === 'alertes') refreshUnread() }, [screen, refreshUnread])

  // ── Offline : outbox + replay au retour du réseau et au montage ──
  const outbox = useTerrainOutbox()
  const online = useIsOnline()
  const pendingCount = outbox.filter((i) => i.status !== 'error').length
  const errorCount = outbox.length - pendingCount

  useEffect(() => {
    const run = () => {
      void replayAll().then(({ done }) => {
        if (done > 0) {
          showToast(`${done} action${done > 1 ? 's' : ''} synchronisée${done > 1 ? 's' : ''}`)
          // Les mutations rejouées ont pu toucher n'importe quelle liste : invalider les caches SWR
          clearResponseCacheMatching('/terrain/demandes')
          clearResponseCacheMatching('/terrain/transferts')
          clearResponseCacheMatching('/terrain/engins')
          clearResponseCacheMatching('/terrain/notifications')
          void loadEngins()
          refreshUnread()
        }
      })
    }
    if (navigator.onLine) run()
    window.addEventListener('online', run)
    return () => window.removeEventListener('online', run)
  }, [showToast, loadEngins, refreshUnread])

  // Entrée directe par scan QR (URL /terrain?engin={id} après redirection du QR /materiel/engins/{id})
  const [searchParams, setSearchParams] = useSearchParams()
  const enginParam = searchParams.get('engin')
  useEffect(() => {
    if (!enginParam) return
    setSearchParams({}, { replace: true })
    ;(async () => {
      try {
        const e = await terrainApi.scan(`/engins/${enginParam}`)
        setEngin(e)
        setScreen('engin')
      } catch (err) {
        showToast(errMsg(err), true)
      }
    })()
  }, [enginParam, setSearchParams, showToast])

  const openEngin = (e: TerrainEngin) => { setEngin(e); setScreen('engin') }
  const backToEngin = () => setScreen(engin ? 'engin' : 'accueil')
  const refreshEngin = useCallback(async (id: number) => {
    try {
      const fresh = await terrainApi.scan(`/engins/${id}`)
      setEngin(fresh)
    } catch { /* silencieux */ }
    void loadEngins()
  }, [loadEngins])

  const showTabBar = screen === 'accueil' || screen === 'dma-list' || screen === 'transfert-list' || screen === 'alertes'

  return (
    <TerrainMeProvider value={me}>
    <div style={{ fontFamily: F, background: BG, minHeight: '100vh', color: INK, maxWidth: 560, margin: '0 auto', paddingBottom: showTabBar ? 88 : 0 }}>
      <style>{GLOBAL_CSS}</style>
      <TerrainInstallBanner />
      <div className="tk-screen" key={screen}>
        {screen === 'accueil' && (
          <AccueilScreen
            prenom={prenom}
            photoUrl={photoUrl}
            engins={engins}
            loading={loading}
            unreadCount={unreadCount}
            onScan={() => setScreen('scan')}
            onOpenEngin={openEngin}
            onRefresh={loadEngins}
            onTransferts={() => setScreen('transfert-list')}
            onAlertes={() => setScreen('alertes')}
            onProfil={() => setScreen('profil')}
          />
        )}
        {screen === 'scan' && (
          <ScanScreen
            onBack={() => setScreen('accueil')}
            onFound={(e) => { setEngin(e); setScreen('engin') }}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'engin' && engin && (
          <EnginScreen
            engin={engin}
            onBack={() => setScreen('accueil')}
            onAction={(s) => {
              if (s === 'transfert-form') setTransfertEnginInitial(engin)
              setScreen(s)
            }}
            onConfirmPosition={async () => {
              const gps = await getGps()
              if (!gps) { showToast('Position GPS indisponible — activez la localisation', true); return }
              try {
                const res = await submitTerrainMutation<PositionEngin>('position', { ...gps }, { enginId: engin.id, contexte: engin.code })
                showToast(res.queued ? QUEUED_MSG : 'Position confirmée')
              } catch (e) { showToast(errMsg(e), true) }
            }}
          />
        )}
        {screen === 'signalement' && engin && (
          <SignalementScreen
            engin={engin}
            onBack={backToEngin}
            onDone={() => { showToast('Incident signalé'); void refreshEngin(engin.id); backToEngin() }}
            onQueued={() => { showToast(QUEUED_MSG); backToEngin() }}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'inspection' && engin && (
          <InspectionScreen
            engin={engin}
            onBack={backToEngin}
            onDone={(anomalies) => {
              showToast(anomalies ? 'Inspection validée — incident créé pour les anomalies' : 'Inspection validée')
              void refreshEngin(engin.id)
              backToEngin()
            }}
            onQueued={() => { showToast(QUEUED_MSG); backToEngin() }}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'releve' && engin && (
          <ReleveScreen
            engin={engin}
            onBack={backToEngin}
            onDone={() => { showToast('Relevé enregistré'); void refreshEngin(engin.id); backToEngin() }}
            onQueued={() => { showToast(QUEUED_MSG); backToEngin() }}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'dma-list' && (
          <DmaListScreen
            prenom={prenom}
            photoUrl={photoUrl}
            onOpen={(d) => { setDma(d); setScreen('dma-detail') }}
            onCreate={() => { setDmaModele(null); setScreen('dma-form') }}
            onProfil={() => setScreen('profil')}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'dma-form' && (
          <DmaFormScreen
            key={dmaModele ? `copie-${dmaModele.id}` : 'neuve'}
            modele={dmaModele}
            onBack={() => setScreen(dmaModele ? 'dma-detail' : 'dma-list')}
            onDone={(d) => { clearResponseCacheMatching('/terrain/demandes'); setDma(d); showToast(`Demande ${d.reference} soumise`); setScreen('dma-detail') }}
            onQueued={() => { showToast(QUEUED_MSG); setScreen('dma-list') }}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'dma-detail' && dma && (
          <DmaDetailScreen
            demande={dma}
            onBack={() => setScreen('dma-list')}
            onUpdated={(d) => { clearResponseCacheMatching('/terrain/demandes'); setDma(d) }}
            onDupliquer={() => { setDmaModele(dma); setScreen('dma-form') }}
            onQueued={() => showToast(QUEUED_MSG)}
            onToast={(m) => showToast(m)}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'transfert-list' && (
          <TransfertListScreen
            prenom={prenom}
            photoUrl={photoUrl}
            onOpen={(t) => { setTransfert(t); setScreen('transfert-detail') }}
            onCreate={() => { setTransfertEnginInitial(null); setScreen('transfert-form') }}
            onProfil={() => setScreen('profil')}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'transfert-form' && (
          <TransfertFormScreen
            engins={engins}
            enginInitial={transfertEnginInitial}
            onBack={() => setScreen(transfertEnginInitial && engin ? 'engin' : 'transfert-list')}
            onDone={(t) => {
              clearResponseCacheMatching('/terrain/transferts')
              setTransfert(t)
              showToast('Demande de transfert enregistrée')
              void loadEngins()
              setScreen('transfert-detail')
            }}
            onQueued={() => { showToast(QUEUED_MSG); setScreen('transfert-list') }}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'transfert-detail' && transfert && (
          <TransfertDetailScreen
            transfert={transfert}
            onBack={() => setScreen('transfert-list')}
            onUpdated={(t) => { clearResponseCacheMatching('/terrain/transferts'); setTransfert(t); void loadEngins() }}
            onQueued={() => showToast(QUEUED_MSG)}
            onToast={(m) => showToast(m)}
            onError={(m) => showToast(m, true)}
            onOpenBon={(t) => { setTransfert(t); setScreen('transfert-bon') }}
            onOpenReception={(t) => { setTransfert(t); setScreen('transfert-reception') }}
          />
        )}
        {screen === 'transfert-bon' && transfert && (
          <BonTransfertScreen
            transfert={transfert}
            onBack={() => setScreen('transfert-detail')}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'transfert-reception' && transfert && (
          <ReceptionTransfertScreen
            transfert={transfert}
            onBack={() => setScreen('transfert-detail')}
            onDone={(t) => {
              clearResponseCacheMatching('/terrain/transferts')
              setTransfert(t)
              showToast(t.receptionAvecReserves ? 'Réception avec réserves — incident créé' : 'Réception confirmée — affectation basculée')
              void loadEngins()
              setScreen('transfert-detail')
            }}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'ravitaillement' && engin && (
          <RavitaillementScreen
            engin={engin}
            onBack={backToEngin}
            onDone={() => { showToast('Ravitaillement enregistré'); void refreshEngin(engin.id); backToEngin() }}
            onQueued={() => { showToast(QUEUED_MSG); backToEngin() }}
            onError={(m) => showToast(m, true)}
          />
        )}
        {screen === 'alertes' && (
          <AlertesScreen
            onNavigate={(target) => setScreen(target)}
            onError={(m) => showToast(m, true)}
            onCountChanged={refreshUnread}
          />
        )}
        {screen === 'profil' && (
          <ProfilScreen
            me={me}
            photoUrl={photoUrl}
            onPhotoChanged={loadPhoto}
            onBack={() => setScreen('accueil')}
            onLogout={async () => { await dispatch(logoutUser()) }}
            onToast={showToast}
          />
        )}
        {screen === 'sync' && (
          <SyncScreen
            onBack={() => setScreen('accueil')}
            onToast={showToast}
            onSynced={() => { void loadEngins() }}
          />
        )}
      </div>

      {/* Indicateur offline / synchronisation en attente */}
      {screen !== 'sync' && (!online || outbox.length > 0) && (
        <button
          onClick={() => setScreen('sync')}
          className="tk-press"
          aria-label="Synchronisation"
          style={{
            position: 'fixed', bottom: 'calc(96px + env(safe-area-inset-bottom))', left: 16, zIndex: 60,
            appearance: 'none', cursor: 'pointer', fontFamily: F, border: 'none',
            display: 'flex', alignItems: 'center', gap: 7,
            background: errorCount > 0 ? '#B91C1C' : HEADER_DARK, color: '#fff',
            borderRadius: 999, padding: '8px 13px', fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 14px rgba(15,27,38,.3)',
          }}
        >
          {online ? <IconSync size={16} strokeWidth={2.2} /> : <IconCloudOff size={16} strokeWidth={2} />}
          {!online && outbox.length === 0 ? 'Hors ligne' : String(outbox.length)}
        </button>
      )}

      {/* Tab bar avec bouton scan central */}
      {showTabBar && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          maxWidth: 560, margin: '0 auto',
          background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid #E5EAEF',
          display: 'flex', alignItems: 'center',
          padding: '8px 12px calc(8px + env(safe-area-inset-bottom))',
        }}>
          <button
            onClick={() => setScreen('accueil')}
            style={{ appearance: 'none', border: 'none', background: 'transparent', color: screen === 'accueil' ? HEADER_DARK : MUTED, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: screen === 'accueil' ? 700 : 600, flex: 1, padding: '4px 0' }}
          >
            <IconHome size={23} strokeWidth={2} />
            Accueil
          </button>
          <button
            onClick={() => setScreen('transfert-list')}
            style={{ appearance: 'none', border: 'none', background: 'transparent', color: screen === 'transfert-list' ? HEADER_DARK : MUTED, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: screen === 'transfert-list' ? 700 : 600, flex: 1, padding: '4px 0' }}
          >
            <IconTransfer size={23} strokeWidth={2} />
            Transferts
          </button>
          <button
            onClick={() => setScreen('scan')}
            style={{ appearance: 'none', border: 'none', background: 'transparent', color: MUTED, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 600, flex: 1, padding: '4px 0' }}
          >
            <IconScan size={23} strokeWidth={2} />
            Scanner
          </button>
          <button
            onClick={() => setScreen('dma-list')}
            style={{ appearance: 'none', border: 'none', background: 'transparent', color: screen === 'dma-list' ? HEADER_DARK : MUTED, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: screen === 'dma-list' ? 700 : 600, flex: 1, padding: '4px 0' }}
          >
            <IconBox size={23} strokeWidth={2} />
            Demandes
          </button>
        </nav>
      )}

      {toast && <Toast msg={toast.msg} error={toast.error} />}
    </div>
    </TerrainMeProvider>
  )
}
