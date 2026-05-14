import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useIsAdmin } from '@/features/dashboard/hooks/useIsAdmin'
import { useSalleReunion } from '../hooks/useSalleReunion'
import { useJaaSToken } from '../hooks/useJaaSToken'
import { useOuvrirSalle, useFermerSalle } from '../hooks/useSalleMutations'
import { ClosedView } from '../components/ClosedView'
import { LobbyView } from '../components/LobbyView'
import { ImmersiveRoom } from '../components/ImmersiveRoom'
import { AdminPanel } from '../components/AdminPanel'
import { ConfirmModal } from '../components/ConfirmModal'
import { StatCard } from '../components/StatCard'
import { Pill, Avatar } from '../components/Primitives'

type RoomState = 'closed' | 'opening' | 'open'

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function SalleReunionPage() {
  const { t } = useTranslation('salleReunion')
  const isAdmin = useIsAdmin()
  const { data: salle, loading, error } = useSalleReunion()
  const ouvrirMutation = useOuvrirSalle()
  const fermerMutation = useFermerSalle()

  const [joined, setJoined] = useState(false)
  const [modal, setModal] = useState<'open' | 'close' | null>(null)
  const [openingProgress, setOpeningProgress] = useState<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const jaasEnabled = !!salle?.ouverte && joined
  const { data: jaasToken } = useJaaSToken(jaasEnabled)

  const roomState: RoomState = openingProgress != null ? 'opening' : salle?.ouverte ? 'open' : 'closed'

  // If salle closes while joined, kick out
  useEffect(() => {
    if (!salle?.ouverte && joined) setJoined(false)
  }, [salle?.ouverte, joined])

  // Opening animation
  useEffect(() => {
    if (openingProgress === null) return
    if (openingProgress >= 100) return
    const id = setInterval(() => {
      setOpeningProgress(prev => {
        if (prev === null) return null
        const next = prev + Math.random() * 12 + 6
        if (next >= 100) {
          clearInterval(id)
          setTimeout(() => setOpeningProgress(null), 350)
          return 100
        }
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
      try {
        await ouvrirMutation.mutateAsync()
        setToast(t('messages.ouvertureSucces'))
      } catch (err) {
        setOpeningProgress(null)
        const msg = (err as { response?: { status?: number } })?.response?.status === 409
          ? t('messages.dejaOuverte')
          : t('messages.erreur')
        setToast(msg)
      }
    } else {
      try {
        await fermerMutation.mutateAsync()
        setJoined(false)
        setToast(t('messages.fermetureSucces'))
      } catch (err) {
        const msg = (err as { response?: { status?: number } })?.response?.status === 409
          ? t('messages.dejaFermee')
          : t('messages.erreur')
        setToast(msg)
      }
    }
  }, [modal, ouvrirMutation, fermerMutation, t])

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(id)
  }, [toast])

  const handleLeaveJitsi = useCallback(() => setJoined(false), [])

  // Loading skeleton
  if (loading && !salle) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-800 salle-skel" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2].map(i => <div key={i} className="h-24 rounded-xl bg-neutral-200 dark:bg-neutral-800 salle-skel" />)}
        </div>
        <div className="h-[400px] rounded-xl bg-neutral-200 dark:bg-neutral-800 salle-skel" />
      </div>
    )
  }

  if (error || !salle) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[14px] text-neutral-500">{t('messages.erreurChargement')}</p>
      </div>
    )
  }

  const openedBy = salle.ouvertePar
  const openedAt = formatTime(salle.dateOuverture)

  return (
    <>
      {/* ─── Mode immersif plein ecran via portail ─── */}
      {joined && roomState === 'open' && jaasToken && createPortal(
        <ImmersiveRoom jaasToken={jaasToken} onLeave={handleLeaveJitsi} />,
        document.body
      )}

      {/* ─── Vue normale (lobby / ferme / admin) ─── */}
      <div className="pb-24">
        {/* Page header */}
        <div className="flex items-end justify-between mb-5 gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">{t('espaceCollab')}</div>
            <h1 className="text-[32px] tracking-[-0.03em] font-semibold text-neutral-900 dark:text-white">{t('title')}</h1>
            <p className="mt-1 text-[13.5px] text-neutral-500 dark:text-neutral-400 max-w-xl">{t('subtitle')}</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {roomState === 'open' && !joined && (
              <button onClick={() => setJoined(true)} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FF6B35] text-white text-[13px] font-medium hover:bg-[#ef5e2b] transition-colors min-h-[44px]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                {t('actions.rejoindre')}
              </button>
            )}
            {isAdmin && roomState === 'closed' && (
              <button onClick={() => setModal('open')} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FF6B35] text-white text-[13px] font-medium hover:bg-[#ef5e2b] transition-colors min-h-[44px]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/></svg>
                {t('actions.ouvrir')}
              </button>
            )}
            {isAdmin && roomState === 'open' && (
              <button onClick={() => setModal('close')} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-[13px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors min-h-[44px]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M18.36 6.64A9 9 0 005.636 18.364M18.364 18.364A9 9 0 005.636 5.636"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></svg>
                {t('actions.fermerCourt')}
              </button>
            )}
          </div>
        </div>

        {/* Topbar badges (mobile) */}
        <div className="flex md:hidden items-center gap-2 mb-4">
          {roomState === 'open' && <Pill tone="live" dot pulse>{t('badge.enDirect')}</Pill>}
          {roomState === 'closed' && <Pill tone="closed" dot>{t('badge.fermee')}</Pill>}
          {roomState === 'opening' && <Pill tone="warning" dot>{t('badge.ouverture')}</Pill>}
          {roomState === 'open' && openedBy && (
            <span className="text-[12px] text-neutral-500 dark:text-neutral-400 tabular-nums">
              {openedBy.prenom} {openedBy.nom} · {openedAt}
            </span>
          )}
        </div>

        {/* Stat strip — 2 cards only (data reelle) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <StatCard
            label={t('stats.etatSalle')}
            value={roomState === 'open' ? t('statut.ouverte') : roomState === 'opening' ? t('statut.ouverture') : t('statut.fermee')}
            tone={roomState === 'open' ? 'live' : roomState === 'opening' ? 'warning' : 'closed'}
            live={roomState === 'open'}
          />
          <StatCard
            label={t('stats.ouvertePar')}
            value={roomState !== 'closed' && openedBy ? `${openedBy.prenom} ${openedBy.nom}` : '—'}
            sub={roomState !== 'closed' && openedAt ? t('stats.depuis', { time: openedAt }) : t('stats.inactive')}
            avatarNode={roomState !== 'closed' && openedBy ? (
              <Avatar initials={`${openedBy.prenom[0]}${openedBy.nom[0]}`} color="#FF6B35" size={22} />
            ) : undefined}
          />
        </div>

        {/* Main panel (lobby ou ferme — pas de JitsiRoom ici, il est dans le portail immersif) */}
        {roomState === 'open' && !joined ? (
          <LobbyView salle={salle} onJoin={() => setJoined(true)} />
        ) : roomState !== 'open' ? (
          <ClosedView salle={salle} isAdmin={isAdmin} onOpen={() => setModal('open')} openingProgress={roomState === 'opening' ? openingProgress : null} />
        ) : null}

        {/* Admin panel */}
        {isAdmin && !joined && (
          <AdminPanel salle={salle} onOpenModal={setModal} />
        )}

        {/* Confirm modal */}
        {modal && (
          <ConfirmModal
            kind={modal}
            loading={ouvrirMutation.isPending || fermerMutation.isPending}
            onCancel={() => setModal(null)}
            onConfirm={handleConfirm}
          />
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium shadow-xl salle-anim-fade" role="status">
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            {toast}
          </div>
        )}
      </div>
    </>
  )
}
