import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useIsAdmin } from '@/features/dashboard/hooks/useIsAdmin'
import { useAppSelector } from '@/store/hooks'
import { useSalleReunion } from '../hooks/useSalleReunion'
import { useJaaSToken } from '../hooks/useJaaSToken'
import { useOuvrirSalle, useFermerSalle } from '../hooks/useSalleMutations'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useSalleNotifications } from '../hooks/useSalleNotifications'
import { useSalleWebSocket } from '../hooks/useSalleWebSocket'
import { useNetworkQuality } from '../hooks/useNetworkQuality'
import { useSalleParticipants } from '../hooks/useSalleParticipants'
import { ClosedView } from '../components/ClosedView'
import { LobbyView } from '../components/LobbyView'
import { ImmersiveRoom } from '../components/ImmersiveRoom'
import { AdminPanel } from '../components/AdminPanel'
import { ConfirmModal } from '../components/ConfirmModal'
import { PostMeetingModal } from '../components/PostMeetingModal'
import { ParticipantToasts } from '../components/ParticipantToasts'
import { KeyboardShortcutsOverlay } from '../components/KeyboardShortcutsOverlay'
import { Avatar } from '../components/Primitives'

type RoomState = 'closed' | 'opening' | 'open'
type ToastState = { message: string; type: 'success' | 'error' } | null

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function SalleReunionPage() {
  const { t } = useTranslation('salleReunion')
  const isAdmin = useIsAdmin()
  const authUser = useAppSelector(s => s.auth.user)
  const { data: salle, loading, error } = useSalleReunion()
  const ouvrirMutation = useOuvrirSalle()
  const fermerMutation = useFermerSalle()
  const network = useNetworkQuality(true)
  const { participants } = useSalleParticipants(!!salle?.ouverte)

  const [joined, setJoined] = useState(false)
  const [modal, setModal] = useState<'open' | 'close' | null>(null)
  const [showPostMeeting, setShowPostMeeting] = useState(false)
  const [openingProgress, setOpeningProgress] = useState<number | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const jitsiPrefsRef = useRef({ videoMuted: false, audioMuted: true })

  const jaasEnabled = !!salle?.ouverte && joined
  const { data: jaasToken } = useJaaSToken(jaasEnabled)
  const roomState: RoomState = openingProgress != null ? 'opening' : salle?.ouverte ? 'open' : 'closed'

  useSalleWebSocket(true)
  useSalleNotifications(salle, authUser?.id)

  useKeyboardShortcuts({
    isAdmin,
    roomOpen: roomState === 'open',
    joined,
    onJoin: useCallback(() => setJoined(true), []),
    onOpenModal: useCallback(() => setModal('open'), []),
    onCloseModal: useCallback(() => { if (isAdmin) setShowPostMeeting(true) }, [isAdmin]),
    onToggleHelp: useCallback(() => setShowShortcuts(prev => !prev), []),
  })

  useEffect(() => { if (!salle?.ouverte && joined) setJoined(false) }, [salle?.ouverte, joined])

  useEffect(() => {
    if (openingProgress === null || openingProgress >= 100) return
    const id = setInterval(() => {
      setOpeningProgress(prev => {
        if (prev === null) return null
        const next = prev + Math.random() * 12 + 6
        if (next >= 100) { clearInterval(id); setTimeout(() => setOpeningProgress(null), 350); return 100 }
        return Math.round(next)
      })
    }, 220)
    return () => clearInterval(id)
  }, [openingProgress !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfirm = useCallback(async () => {
    if (!modal) return
    setModal(null)
    if (modal === 'open') {
      setOpeningProgress(0)
      try { await ouvrirMutation.mutateAsync(); setToast({ message: t('messages.ouvertureSucces'), type: 'success' }) }
      catch (err) { setOpeningProgress(null); setToast({ message: (err as { response?: { status?: number } })?.response?.status === 409 ? t('messages.dejaOuverte') : t('messages.erreur'), type: 'error' }) }
    } else {
      try { await fermerMutation.mutateAsync(); setJoined(false); setToast({ message: t('messages.fermetureSucces'), type: 'success' }) }
      catch (err) { setToast({ message: (err as { response?: { status?: number } })?.response?.status === 409 ? t('messages.dejaFermee') : t('messages.erreur'), type: 'error' }) }
    }
  }, [modal, ouvrirMutation, fermerMutation, t])

  const handlePostMeetingClose = useCallback(async () => {
    try { await fermerMutation.mutateAsync(); setJoined(false); setShowPostMeeting(false); setToast({ message: t('messages.fermetureSucces'), type: 'success' }) }
    catch (err) { setToast({ message: (err as { response?: { status?: number } })?.response?.status === 409 ? t('messages.dejaFermee') : t('messages.erreur'), type: 'error' }); setShowPostMeeting(false) }
  }, [fermerMutation, t])

  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 3500); return () => clearTimeout(id) }, [toast])

  const handleLeaveJitsi = useCallback(() => setJoined(false), [])
  const handleLobbyJoin = useCallback((opts: { videoMuted: boolean; audioMuted: boolean }) => { jitsiPrefsRef.current = opts; setJoined(true) }, [])
  const handleCloseClick = useCallback(() => { if (isAdmin) setShowPostMeeting(true) }, [isAdmin])

  if (loading && !salle) {
    return (
      <div className="space-y-4 salle-anim-fade">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">{[1,2,3].map(i => <div key={i} className="h-24 rounded-[14px] bg-neutral-200 dark:bg-neutral-800 salle-skel" />)}</div>
        <div className="h-[400px] rounded-[18px] bg-neutral-200 dark:bg-neutral-800 salle-skel" />
      </div>
    )
  }

  if (error || !salle) {
    return <div className="flex items-center justify-center min-h-[400px]"><p className="text-[16px] text-neutral-500">{t('messages.erreurChargement')}</p></div>
  }

  const openedBy = salle.ouvertePar
  const openedAt = formatTime(salle.dateOuverture)
  const NET_COLOR: Record<string, string> = { excellent: 'text-[#48B5A0]', good: 'text-amber-500', limited: 'text-rose-500', measuring: 'text-neutral-400' }

  return (
    <>
      {joined && roomState === 'open' && jaasToken && createPortal(<ImmersiveRoom jaasToken={jaasToken} onLeave={handleLeaveJitsi} mediaPrefs={jitsiPrefsRef.current} />, document.body)}
      <ParticipantToasts enabled={roomState === 'open' && !joined} currentUserId={authUser?.id} />

      <div className="salle-anim-fade flex flex-col xl:h-[calc(100vh-var(--layout-header-height,4.5rem)-var(--layout-footer-height,3.5rem)-5rem)]">

        {/* ══ 3 STAT CARDS ═════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.4fr_1.4fr] gap-3.5 mb-4 shrink-0">

          {/* État de la salle */}
          <div className="relative bg-gradient-to-br from-[#FF6B35]/[0.18] to-[#FF6B35]/[0.04] dark:from-[#FF6B35]/[0.18] dark:to-[#FF6B35]/[0.04] border border-[#FF6B35]/25 rounded-[14px] p-[18px] overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="relative w-11 h-11 shrink-0">
                <div className="lobby-radio-pulse" />
                <div className="lobby-radio-pulse lobby-radio-pulse-2" />
                <div className="lobby-radio-pulse lobby-radio-pulse-3" />
                <div className="relative w-11 h-11 bg-[#FF6B35]/[0.18] border border-[#FF6B35]/40 rounded-full flex items-center justify-center text-[#FF6B35]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14" /></svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-neutral-500 dark:text-white/50 mb-1">{t('stats.etatSalle')}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-medium text-[#FF6B35] tracking-[-0.01em]">
                    {roomState === 'open' ? t('statut.ouverte') : roomState === 'opening' ? t('statut.ouverture') : t('statut.fermee')}
                  </span>
                  {roomState === 'open' && (
                    <span className="inline-flex items-center gap-[5px] px-[7px] py-px bg-[#FF6B35]/15 rounded-full text-[10px] font-medium text-[#FF6B35] tracking-[0.04em]">
                      <span className="w-[5px] h-[5px] rounded-full bg-[#FF6B35] lobby-live-pulse" />LIVE
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-3.5 text-[11px] leading-relaxed text-neutral-500 dark:text-white/50">{roomState === 'open' ? t('stats.descriptionOuverte') : t('stats.descriptionFermee')}</p>
          </div>

          {/* Ouverte par */}
          <div className="bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.08] rounded-[14px] p-[18px] flex items-center gap-3.5">
            {openedBy ? (
              <Avatar initials={`${openedBy.prenom[0]}${openedBy.nom[0]}`} color="#2E5266" size={44} />
            ) : (
              <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium tracking-[0.12em] uppercase text-neutral-500 dark:text-white/50 mb-1">{t('stats.ouvertePar')}</div>
              <div className="text-[15px] font-medium tracking-[-0.01em] text-neutral-900 dark:text-white truncate mb-0.5">
                {openedBy ? `${openedBy.prenom} ${openedBy.nom}` : '—'}
              </div>
              {openedAt && (
                <div className="flex items-center gap-[5px] text-[11px] text-neutral-400 dark:text-white/50">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  <span className="tabular-nums">{t('stats.depuis', { time: openedAt })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Attendus + Qualité */}
          <div className="bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.08] rounded-[14px] p-[18px] grid grid-cols-2 gap-[18px]">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg className="w-[13px] h-[13px] text-neutral-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.128V17a6.003 6.003 0 017.002-5.952A6 6 0 0115 16.128zM9.5 7.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-neutral-500 dark:text-white/50">{t('stats.connectes')}</span>
              </div>
              <div className="text-[22px] font-medium tracking-[-0.02em] text-neutral-900 dark:text-white tabular-nums">{participants.length}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <svg className="w-[13px] h-[13px] text-neutral-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
                <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-neutral-500 dark:text-white/50">{t('stats.qualite')}</span>
              </div>
              <div className={'text-[15px] font-medium tracking-[-0.01em] ' + (NET_COLOR[network.level] || 'text-neutral-400')}>{t(`lobby.network.${network.level}`)}</div>
              {network.latencyMs !== null && <div className="text-[10px] text-neutral-400 dark:text-white/40 tabular-nums mt-px">{network.latencyMs} ms</div>}
            </div>
          </div>
        </div>

        {/* ══ MAIN PANEL ═══════════════════════════════════════════ */}
        <div className="flex-1 min-h-0">
          {roomState === 'open' && !joined ? (
            <LobbyView salle={salle} onJoin={handleLobbyJoin} isAdmin={isAdmin} onCloseClick={handleCloseClick} />
          ) : roomState !== 'open' ? (
            <ClosedView salle={salle} isAdmin={isAdmin} onOpen={() => setModal('open')} openingProgress={roomState === 'opening' ? openingProgress : null} />
          ) : null}
        </div>

        {/* Admin panel — seulement quand salle fermée */}
        {isAdmin && !joined && roomState !== 'open' && <AdminPanel salle={salle} onOpenModal={setModal} />}

        {/* Modals */}
        {modal && <ConfirmModal kind={modal} loading={ouvrirMutation.isPending || fermerMutation.isPending} onCancel={() => setModal(null)} onConfirm={handleConfirm} />}
        {showPostMeeting && salle && <PostMeetingModal salle={salle} onCancel={() => setShowPostMeeting(false)} onClose={handlePostMeetingClose} />}
        {showShortcuts && <KeyboardShortcutsOverlay isAdmin={isAdmin} onClose={() => setShowShortcuts(false)} />}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[14px] font-semibold shadow-2xl salle-anim-up" role="status">
            <span className={'w-6 h-6 rounded-full flex items-center justify-center shrink-0 ' + (toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500')}>
              {toast.type === 'success' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              )}
            </span>
            {toast.message}
          </div>
        )}
      </div>
    </>
  )
}
