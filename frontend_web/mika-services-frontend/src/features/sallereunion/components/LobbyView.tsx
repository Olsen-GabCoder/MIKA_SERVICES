import { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/store/hooks'
import { useMediaDevices } from '../hooks/useMediaDevices'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useNetworkQuality, type NetworkLevel } from '../hooks/useNetworkQuality'
import { useSalleParticipants } from '../hooks/useSalleParticipants'
import type { SalleReunion } from '@/types/salleReunion'

interface LobbyViewProps {
  salle: SalleReunion
  onJoin: (opts: { videoMuted: boolean; audioMuted: boolean }) => void
  isAdmin?: boolean
  onCloseClick?: () => void
}

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
function ini(p?: string, n?: string): string { return ((p?.[0] ?? '') + (n?.[0] ?? '')) || '?' }

const NC: Record<NetworkLevel, string> = { excellent: 'text-[#48B5A0]', good: 'text-amber-500', limited: 'text-rose-500', measuring: 'text-neutral-400' }

export function LobbyView({ salle, onJoin, isAdmin, onCloseClick }: LobbyViewProps) {
  const { t } = useTranslation('salleReunion')
  const authUser = useAppSelector(s => s.auth.user)
  const openedBy = salle.ouvertePar
  const openedAt = fmtTime(salle.dateOuverture)
  const videoRef = useRef<HTMLVideoElement>(null)

  const media = useMediaDevices()
  useAudioLevel(media.stream, media.audioEnabled)
  const network = useNetworkQuality(true)
  const { participants } = useSalleParticipants(true)

  const [devOpen, setDevOpen] = useState(false)
  const devRef = useRef<HTMLDivElement>(null)
  const devBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { if (videoRef.current && media.stream) videoRef.current.srcObject = media.stream }, [media.stream])

  useEffect(() => {
    if (!devOpen) return
    const h = (e: MouseEvent) => { if (devRef.current && !devRef.current.contains(e.target as Node) && devBtnRef.current && !devBtnRef.current.contains(e.target as Node)) setDevOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [devOpen])

  const handleJoin = useCallback(() => { media.cleanup(); onJoin({ videoMuted: !media.videoEnabled, audioMuted: !media.audioEnabled }) }, [media, onJoin])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5 h-full">

      {/* ═══ GAUCHE — Preview + Contrôles (même carte) ═══════════ */}
      <div className="bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.08] rounded-[18px] overflow-hidden flex flex-col">

        {/* Video preview */}
        <div className="relative w-full flex-1 min-h-[240px]" style={{ aspectRatio: '16/10' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2832] via-[#2E5266] to-[#0f1820]">
            <video ref={videoRef} autoPlay playsInline muted
              className={'absolute inset-0 w-full h-full object-cover ' + (media.videoEnabled && media.stream ? 'opacity-100' : 'opacity-0')}
              style={{ transform: 'scaleX(-1)', transition: 'opacity 200ms ease' }} />
          </div>

          {!media.videoEnabled && (
            <div className="absolute inset-0 z-[1] flex items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center">
                <span className="text-[28px] sm:text-[32px] font-medium text-white/60">{ini(authUser?.prenom, authUser?.nom)}</span>
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 z-[2] inline-flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-xl border border-white/[0.18] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] lobby-live-pulse" />
            <span className="text-[10px] font-medium tracking-[0.04em] text-white">{t('lobby.enDirect')}</span>
          </div>

          <div className="absolute bottom-3 left-3 z-[2] px-3 py-2 bg-black/55 backdrop-blur-xl border border-white/[0.15] rounded-lg flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#48B5A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
            <div>
              <div className="text-[11px] font-medium text-white leading-tight">{media.videoEnabled ? t('lobby.camOn') : t('lobby.camOff')}</div>
              <div className="text-[9px] text-white/50 leading-tight mt-px">{media.videoEnabled ? t('lobby.visibleAux') : t('lobby.camDisabled')}</div>
            </div>
          </div>
        </div>

        {/* Contrôles — collés sous la preview, groupés au centre */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-neutral-200 dark:border-white/[0.06]">
          {/* Camera + Micro — côte à côte, proches */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <button onClick={media.toggleVideo}
                className={'w-12 h-12 rounded-full flex items-center justify-center transition-all hover:-translate-y-px active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#48B5A0]/30 ' + (media.videoEnabled ? 'bg-[#48B5A0]/12 border border-[#48B5A0]/35 text-[#48B5A0]' : 'bg-rose-500/12 border border-rose-500/35 text-rose-500')}
                aria-label={media.videoEnabled ? t('lobby.cameraOn') : t('lobby.cameraOff')}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
              </button>
              <span className="text-[9px] font-medium text-neutral-500 dark:text-white/50">{t('controls.camera')}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button onClick={media.toggleAudio}
                className={'w-12 h-12 rounded-full flex items-center justify-center transition-all hover:-translate-y-px active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#48B5A0]/30 ' + (media.audioEnabled ? 'bg-[#48B5A0]/12 border border-[#48B5A0]/35 text-[#48B5A0]' : 'bg-rose-500/12 border border-rose-500/35 text-rose-500')}
                aria-label={media.audioEnabled ? t('lobby.micOnLabel') : t('lobby.micOffLabel')}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
              </button>
              <span className="text-[9px] font-medium text-neutral-500 dark:text-white/50">{t('controls.micro')}</span>
            </div>
          </div>

          {/* Périphériques */}
          <div className="flex flex-col items-center gap-1 relative">
            <button ref={devBtnRef} onClick={() => setDevOpen(v => !v)}
              className={'relative w-12 h-12 rounded-full flex items-center justify-center transition-all hover:-translate-y-px active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 ' + (devOpen ? 'bg-[#FF6B35]/12 border border-[#FF6B35]/35 text-[#FF6B35]' : 'bg-neutral-100 dark:bg-white/[0.06] border border-neutral-200 dark:border-white/[0.12] text-neutral-600 dark:text-white/70')}
              aria-label={t('lobby.devices')} aria-expanded={devOpen}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
              {!devOpen && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF6B35] rounded-full" />}
            </button>
            <span className="text-[9px] font-medium text-neutral-500 dark:text-white/50">{t('lobby.devices')}</span>

            {devOpen && (
              <div ref={devRef} className="absolute bottom-full mb-3 right-0 w-[300px] bg-white dark:bg-[#141820] border border-neutral-200 dark:border-white/[0.1] rounded-2xl shadow-2xl z-50 salle-anim-scale overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-neutral-100 dark:border-white/[0.06]">
                  <div className="text-[14px] font-semibold text-neutral-900 dark:text-white">{t('lobby.devices')}</div>
                  <div className="text-[11px] text-neutral-400 dark:text-white/40 mt-0.5">{t('lobby.selectionnerAppareils')}</div>
                </div>

                <div className="p-2">
                  {/* Camera section */}
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                    <svg className="w-4 h-4 text-neutral-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-white/50">{t('lobby.selectCamera')}</span>
                  </div>
                  {media.videoDevices.map(d => {
                    const active = d.deviceId === media.selectedVideoId
                    return (
                      <button key={d.deviceId} onClick={() => { media.setSelectedVideoId(d.deviceId); setDevOpen(false) }}
                        className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-left transition-colors min-h-[40px] ' + (active ? 'bg-[#48B5A0]/10 text-[#48B5A0] font-medium' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.04]')}>
                        <span className={'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ' + (active ? 'border-[#48B5A0]' : 'border-neutral-300 dark:border-neutral-600')}>
                          {active && <span className="w-2 h-2 rounded-full bg-[#48B5A0]" />}
                        </span>
                        <span className="truncate">{d.label}</span>
                      </button>
                    )
                  })}

                  <div className="my-2 mx-3 h-px bg-neutral-100 dark:bg-white/[0.06]" />

                  {/* Mic section */}
                  <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
                    <svg className="w-4 h-4 text-neutral-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-white/50">{t('lobby.selectMic')}</span>
                  </div>
                  {media.audioDevices.map(d => {
                    const active = d.deviceId === media.selectedAudioId
                    return (
                      <button key={d.deviceId} onClick={() => { media.setSelectedAudioId(d.deviceId); setDevOpen(false) }}
                        className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-left transition-colors min-h-[40px] ' + (active ? 'bg-[#48B5A0]/10 text-[#48B5A0] font-medium' : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.04]')}>
                        <span className={'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ' + (active ? 'border-[#48B5A0]' : 'border-neutral-300 dark:border-neutral-600')}>
                          {active && <span className="w-2 h-2 rounded-full bg-[#48B5A0]" />}
                        </span>
                        <span className="truncate">{d.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ DROITE — Infos salle + Fermer + Rejoindre ═══════════ */}
      <div className="relative bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.08] rounded-[18px] p-5 sm:p-6 flex flex-col overflow-hidden">

        {/* Blob décoratif */}
        <div className="absolute top-3 right-3 w-20 h-20 rounded-xl opacity-30 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(46,82,102,.6), rgba(255,107,53,.15))' }} />

        {/* Badge + time */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#48B5A0]/12 border border-[#48B5A0]/30 rounded-full text-[10px] font-medium tracking-[0.05em] text-[#48B5A0]">
            <span className="w-[5px] h-[5px] rounded-full bg-[#48B5A0] lobby-live-pulse" />
            {t('badge.salleOuverte')}
          </span>
          {openedAt && (
            <span className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-white/40 tabular-nums">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              {t('lobby.depuisTime', { time: openedAt })}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="mt-4 text-[26px] sm:text-[30px] font-semibold tracking-[-0.025em] leading-[1.1] text-neutral-900 dark:text-white">{salle.libelle}</h2>

        {/* 3-col info */}
        <div className="mt-4 grid grid-cols-3 gap-3 py-4 border-t border-b border-neutral-200/60 dark:border-white/[0.06]">
          <div>
            <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-400 dark:text-white/40 mb-2">{t('stats.ouvertePar')}</div>
            {openedBy && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2E5266] text-white flex items-center justify-center text-[10px] font-medium shrink-0">{ini(openedBy.prenom, openedBy.nom)}</div>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium text-neutral-800 dark:text-white leading-tight truncate">{openedBy.prenom} {openedBy.nom}</div>
                  <div className="text-[10px] text-[#FF6B35] leading-tight mt-px">{t('lobby.admin')}</div>
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-400 dark:text-white/40 mb-2">{t('stats.connectes')}</div>
            <div className="flex items-center">
              {participants.slice(0, 4).map((p, i) => (
                <div key={p.id} className="w-6 h-6 rounded-full text-white flex items-center justify-center text-[8px] font-medium border-2 border-white dark:border-[#0a0e13]" style={{ background: i === 0 ? '#FF6B35' : i === 2 ? '#48B5A0' : '#2E5266', marginLeft: i > 0 ? -6 : 0 }} title={`${p.user.prenom} ${p.user.nom}`}>
                  {ini(p.user.prenom, p.user.nom)}
                </div>
              ))}
              {participants.length > 4 && <div className="h-6 px-1.5 rounded-full bg-neutral-200 dark:bg-white/[0.06] border border-neutral-300 dark:border-white/10 text-neutral-500 dark:text-white/60 flex items-center text-[9px] font-medium" style={{ marginLeft: -2 }}>+{participants.length - 4}</div>}
              {participants.length === 0 && <span className="text-[12px] text-neutral-400">0</span>}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-medium tracking-[0.1em] uppercase text-neutral-400 dark:text-white/40 mb-2">{t('stats.reseau')}</div>
            <div className="flex items-center gap-1.5">
              <svg className={'w-4 h-4 ' + NC[network.level]} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
              <div>
                <div className="text-[12px] font-medium text-neutral-800 dark:text-white leading-tight tabular-nums">{network.latencyMs ?? '--'} ms</div>
                <div className={'text-[10px] leading-tight mt-px ' + NC[network.level]}>{t(`lobby.network.${network.level}`)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Journal récent */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-neutral-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            <span className="text-[11px] font-medium text-neutral-600 dark:text-white/65">{t('admin.journalRecent')}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {salle.ouvertePar && salle.dateOuverture && (
              <div className="flex items-center gap-2.5 px-2.5 py-1.5 bg-neutral-100/60 dark:bg-white/[0.02] rounded-md text-[11px]">
                <span className="tabular-nums text-[10px] text-neutral-400 dark:text-white/40 min-w-[32px]">{fmtTime(salle.dateOuverture)}</span>
                <span className="w-[5px] h-[5px] rounded-full bg-[#FF6B35] shrink-0" />
                <span className="text-neutral-600 dark:text-white/80 truncate"><strong className="font-medium text-neutral-800 dark:text-white">{salle.ouvertePar.prenom} {salle.ouvertePar.nom}</strong> {t('lobby.aOuvertSalle')}</span>
              </div>
            )}
            {salle.fermeePar && salle.dateFermeture && (
              <div className="flex items-center gap-2.5 px-2.5 py-1.5 bg-neutral-100/60 dark:bg-white/[0.02] rounded-md text-[11px]">
                <span className="tabular-nums text-[10px] text-neutral-400 dark:text-white/40 min-w-[32px]">{fmtTime(salle.dateFermeture)}</span>
                <span className="w-[5px] h-[5px] rounded-full bg-rose-400 shrink-0" />
                <span className="text-neutral-600 dark:text-white/80 truncate"><strong className="font-medium text-neutral-800 dark:text-white">{salle.fermeePar.prenom} {salle.fermeePar.nom}</strong> {t('lobby.aFermeSalle')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-3" />

        {/* Actions */}
        <div className="mt-4 flex flex-col gap-3">
          {/* Fermer — admin only */}
          {isAdmin && onCloseClick && (
            <button onClick={onCloseClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-500/25 text-rose-600 dark:text-rose-400 text-[13px] font-medium hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-[0.98] transition-all min-h-[44px]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M18.36 6.64A9 9 0 005.636 18.364M18.364 18.364A9 9 0 005.636 5.636" /><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" /></svg>
              {t('actions.fermer')}
            </button>
          )}

          {/* Rejoindre */}
          <button onClick={handleJoin}
            className="group w-full px-5 py-3.5 bg-[#FF6B35] text-white rounded-xl text-[13px] font-medium flex items-center justify-between transition-all hover:-translate-y-px hover:shadow-lg hover:shadow-[#FF6B35]/25 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 min-h-[48px]">
            <span className="flex items-center gap-2.5">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              <span className="flex flex-col items-start leading-tight">
                <span>{t('lobby.rejoindreLong')}</span>
                <span className="text-[10px] font-normal opacity-80 mt-px">{t('lobby.visibleInfo')}</span>
              </span>
            </span>
            <svg className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
