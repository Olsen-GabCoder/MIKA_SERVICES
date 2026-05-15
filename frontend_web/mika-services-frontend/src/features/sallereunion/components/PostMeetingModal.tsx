import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { salleReunionApi } from '@/api/salleReunionApi'
import type { SalleReunion } from '@/types/salleReunion'

interface PostMeetingModalProps {
  salle: SalleReunion
  onCancel: () => void
  onClose: () => Promise<void>
}

function formatDuration(startIso: string | null): string {
  if (!startIso) return '--'
  const start = new Date(startIso).getTime()
  const diffMs = Date.now() - start
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return `${hours}h ${rest.toString().padStart(2, '0')}min`
}

function formatTime(iso: string | null): string {
  if (!iso) return '--'
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function PostMeetingModal({ salle, onCancel, onClose }: PostMeetingModalProps) {
  const { t } = useTranslation('salleReunion')
  const navigate = useNavigate()
  const [participantCount, setParticipantCount] = useState<number | null>(null)
  const [closing, setClosing] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  useEffect(() => {
    if (salle.dateOuverture) {
      salleReunionApi.countParticipantsSince(salle.dateOuverture)
        .then(setParticipantCount)
        .catch(() => setParticipantCount(0))
    }
  }, [salle.dateOuverture])

  const handleCloseOnly = async () => {
    setClosing(true)
    await onClose()
  }

  const handleCloseAndPV = async () => {
    setClosing(true)
    await onClose()
    const dateReunion = salle.dateOuverture ? salle.dateOuverture.slice(0, 10) : new Date().toISOString().slice(0, 10)
    navigate(`/salle-mika/pv/nouveau?from=session&dateReunion=${dateReunion}`)
  }

  const duration = formatDuration(salle.dateOuverture)
  const openedAt = formatTime(salle.dateOuverture)
  const openedByName = salle.ouvertePar ? `${salle.ouvertePar.prenom} ${salle.ouvertePar.nom}` : '--'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 salle-anim-fade" role="dialog" aria-modal="true" aria-labelledby="postmeeting-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div ref={dialogRef} className="relative w-full max-w-[520px] rounded-3xl bg-white dark:bg-neutral-900 p-7 sm:p-8 salle-anim-scale border border-neutral-200 dark:border-neutral-800 shadow-2xl">
        <h3 id="postmeeting-title" className="text-[20px] font-bold tracking-[-0.02em] text-neutral-900 dark:text-white">
          {t('postMeeting.title')}
        </h3>
        <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">{t('postMeeting.desc')}</p>

        {/* Session stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 text-center">
            <div className="text-[22px] font-bold text-neutral-900 dark:text-white tabular-nums">{duration}</div>
            <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider font-medium">{t('postMeeting.duration')}</div>
          </div>
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 text-center">
            <div className="text-[22px] font-bold text-neutral-900 dark:text-white tabular-nums">{participantCount ?? '...'}</div>
            <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider font-medium">{t('postMeeting.participants')}</div>
          </div>
          <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 text-center">
            <div className="text-[15px] font-bold text-neutral-900 dark:text-white tabular-nums">{openedAt}</div>
            <div className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wider font-medium">{t('postMeeting.openedAt')}</div>
            <div className="text-[11px] text-neutral-400 mt-0.5 truncate">{openedByName}</div>
          </div>
        </div>

        {/* PV question */}
        <div className="mt-6 px-4 py-3.5 rounded-xl bg-[#FF6B35]/5 dark:bg-[#FF6B35]/10 border border-[#FF6B35]/15 text-[14px] text-neutral-700 dark:text-neutral-300 flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0 text-[#FF6B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span>{t('postMeeting.pvQuestion')}</span>
        </div>

        {/* Actions */}
        <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button ref={cancelRef} onClick={onCancel} disabled={closing} className="px-5 py-2.5 rounded-xl text-[15px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-150 min-h-[44px]">
            {t('modal.annuler')}
          </button>
          <button onClick={handleCloseOnly} disabled={closing} className="px-5 py-2.5 rounded-xl text-[15px] font-medium border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-[0.98] transition-all duration-150 min-h-[44px] disabled:opacity-50">
            {t('postMeeting.closeOnly')}
          </button>
          <button onClick={handleCloseAndPV} disabled={closing} className="px-5 py-2.5 rounded-xl text-[15px] font-semibold bg-[#FF6B35] text-white hover:bg-[#ef5e2b] hover:shadow-lg hover:shadow-[#FF6B35]/25 active:scale-[0.98] transition-all duration-150 min-h-[44px] disabled:opacity-50">
            {t('postMeeting.closeAndPV')}
          </button>
        </div>
      </div>
    </div>
  )
}
