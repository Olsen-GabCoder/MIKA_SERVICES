import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Pill, Avatar } from './Primitives'
import { useMediaDevices } from '../hooks/useMediaDevices'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useNetworkQuality } from '../hooks/useNetworkQuality'
import { useSalleParticipants } from '../hooks/useSalleParticipants'
import type { SalleReunion } from '@/types/salleReunion'

interface LobbyViewProps {
  salle: SalleReunion
  onJoin: (opts: { videoMuted: boolean; audioMuted: boolean }) => void
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const NETWORK_COLORS = {
  excellent: 'text-emerald-500',
  good: 'text-amber-500',
  limited: 'text-rose-500',
  measuring: 'text-neutral-400',
} as const

const NETWORK_BG = {
  excellent: 'bg-emerald-500',
  good: 'bg-amber-500',
  limited: 'bg-rose-500',
  measuring: 'bg-neutral-400',
} as const

export function LobbyView({ salle, onJoin }: LobbyViewProps) {
  const { t } = useTranslation('salleReunion')
  const openedBy = salle.ouvertePar
  const openedAt = formatTime(salle.dateOuverture)
  const videoRef = useRef<HTMLVideoElement>(null)

  const media = useMediaDevices()
  const audioLevel = useAudioLevel(media.stream, media.audioEnabled)
  const network = useNetworkQuality(true)
  const { participants } = useSalleParticipants(true)

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && media.stream) {
      videoRef.current.srcObject = media.stream
    }
  }, [media.stream])

  const handleJoin = () => {
    media.cleanup()
    onJoin({ videoMuted: !media.videoEnabled, audioMuted: !media.audioEnabled })
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-900/70 overflow-hidden border border-neutral-100 dark:border-neutral-800/60 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto">
        {/* Left — camera preview */}
        <div className="p-5 sm:p-7">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-900">
            {media.stream && media.videoEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <>
                <div className="absolute inset-0 salle-grain" />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(46,82,102,0.40), rgba(0,0,0,0.90))' }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-2xl flex items-center justify-center bg-neutral-800">
                    <svg className="w-10 h-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/></svg>
                  </div>
                  <div className="mt-4 text-[13px] uppercase tracking-[0.15em] text-white/40 font-medium">
                    {media.error ? t('lobby.camDenied') : t('lobby.camOff')}
                  </div>
                </div>
              </>
            )}

            {/* HUD overlays */}
            <div className="absolute top-4 left-4">
              <Pill tone="live" dot pulse>{t('badge.enDirect')}</Pill>
            </div>

            {/* Audio level bar */}
            {media.audioEnabled && (
              <div className="absolute bottom-4 left-4 flex items-end gap-[3px] h-6">
                {[0.15, 0.30, 0.45, 0.60, 0.75].map((threshold, i) => (
                  <div
                    key={i}
                    className={'w-[4px] rounded-full transition-all duration-100 ' + (audioLevel >= threshold ? 'bg-emerald-400' : 'bg-white/20')}
                    style={{ height: `${(i + 1) * 4 + 4}px` }}
                  />
                ))}
              </div>
            )}

            {/* Bottom gradient */}
            <div className="absolute bottom-0 inset-x-0 h-20" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
          </div>

          {/* Controls under preview */}
          <div className="mt-4 flex items-center gap-3 justify-center flex-wrap">
            {/* Video toggle */}
            <button
              onClick={media.toggleVideo}
              className={'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all min-h-[44px] ' +
                (media.videoEnabled
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20')}
              aria-label={media.videoEnabled ? t('lobby.camOn') : t('lobby.camOff')}
            >
              {media.videoEnabled ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m14.25 0a2.25 2.25 0 00-2.25-2.25H6.75m11.25 0l-3-3m0 0l-3 3m3-3v10.5"/><line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round"/></svg>
              )}
              {media.videoEnabled ? t('controls.camera') : t('lobby.camOff')}
            </button>

            {/* Audio toggle */}
            <button
              onClick={media.toggleAudio}
              className={'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all min-h-[44px] ' +
                (media.audioEnabled
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20')}
              aria-label={media.audioEnabled ? t('lobby.micOn') : t('lobby.micOff')}
            >
              {media.audioEnabled ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/><line x1="2" y1="2" x2="22" y2="22" strokeLinecap="round"/></svg>
              )}
              {media.audioEnabled ? t('controls.micro') : t('lobby.micOff')}
            </button>

            {/* Device selectors */}
            {media.videoDevices.length > 1 && (
              <select
                value={media.selectedVideoId}
                onChange={e => media.setSelectedVideoId(e.target.value)}
                className="px-3 py-2 rounded-xl text-[12px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-none focus:ring-2 focus:ring-[#FF6B35]/50 min-h-[44px] max-w-[160px] truncate"
                aria-label={t('lobby.selectCamera')}
              >
                {media.videoDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>
            )}
            {media.audioDevices.length > 1 && (
              <select
                value={media.selectedAudioId}
                onChange={e => media.setSelectedAudioId(e.target.value)}
                className="px-3 py-2 rounded-xl text-[12px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-none focus:ring-2 focus:ring-[#FF6B35]/50 min-h-[44px] max-w-[160px] truncate"
                aria-label={t('lobby.selectMic')}
              >
                {media.audioDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Right — metadata + participants + CTA */}
        <div className="px-5 pb-7 sm:px-8 lg:py-8 lg:border-l border-neutral-200/80 dark:border-neutral-800/80 flex flex-col justify-center">
          <div className="flex items-center gap-3 flex-wrap">
            <Pill tone="live" dot pulse>{t('badge.salleOuverte')}</Pill>
            {openedAt && <span className="text-[13px] text-neutral-500 tabular-nums">{t('lobby.depuisTime', { time: openedAt })}</span>}
          </div>

          <h2 className="mt-5 text-[24px] sm:text-[28px] lg:text-[32px] leading-[1.1] tracking-[-0.03em] font-bold text-neutral-900 dark:text-white">
            {salle.libelle}
          </h2>

          {openedBy && (
            <div className="mt-4 flex items-center gap-3 text-[14px] sm:text-[15px] text-neutral-500 dark:text-neutral-400">
              <Avatar initials={`${openedBy.prenom[0]}${openedBy.nom[0]}`} color="#FF6B35" size={28} name={`${openedBy.prenom} ${openedBy.nom}`} />
              <span>
                {t('stats.ouvertePar')}{' '}
                <span className="text-neutral-800 dark:text-neutral-200 font-semibold">{openedBy.prenom} {openedBy.nom}</span>
                {openedAt && ` · ${openedAt}`}
              </span>
            </div>
          )}

          {/* Participants online */}
          {participants.length > 0 && (
            <div className="mt-6">
              <div className="text-[12px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold mb-3">
                {t('lobby.dejaEnLigne', { count: participants.length })}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {participants.slice(0, 8).map(p => (
                  <div key={p.id} className="flex flex-col items-center gap-1" title={`${p.user.prenom} ${p.user.nom}`}>
                    <Avatar initials={`${p.user.prenom[0]}${p.user.nom[0]}`} color="#2E5266" size={36} ring />
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 max-w-[60px] truncate">{p.user.prenom}</span>
                  </div>
                ))}
                {participants.length > 8 && (
                  <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[12px] font-semibold text-neutral-600 dark:text-neutral-300">
                    +{participants.length - 8}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Network quality */}
          <div className="mt-6 flex items-center gap-2.5">
            <div className="flex items-end gap-[2px]">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={'w-[4px] rounded-sm transition-colors ' + (
                    (network.level === 'excellent' && i <= 3) ||
                    (network.level === 'good' && i <= 2) ||
                    (network.level === 'limited' && i <= 1)
                      ? NETWORK_BG[network.level]
                      : 'bg-neutral-300 dark:bg-neutral-600'
                  )}
                  style={{ height: `${i * 4 + 4}px` }}
                />
              ))}
            </div>
            <span className={'text-[13px] font-medium ' + NETWORK_COLORS[network.level]}>
              {t(`lobby.network.${network.level}`)}
            </span>
            {network.latencyMs !== null && (
              <span className="text-[12px] text-neutral-400 tabular-nums">{network.latencyMs} ms</span>
            )}
          </div>

          {/* CTA */}
          <div className="mt-8">
            <button
              onClick={handleJoin}
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#FF6B35] text-white text-[16px] font-semibold hover:bg-[#ef5e2b] hover:shadow-xl hover:shadow-[#FF6B35]/25 active:scale-[0.98] transition-all duration-150 min-h-[56px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              {t('actions.rejoindreNow')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
