import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { JaaSToken } from '@/types/salleReunion'

const JITSI_DOMAIN = '8x8.vc'

interface JitsiMeetApi {
  dispose: () => void
  addListener: (event: string, handler: (...args: unknown[]) => void) => void
  executeCommand: (command: string, ...args: unknown[]) => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiMeetApi
  }
}

function loadJitsiScript(appId: string): Promise<void> {
  const scriptUrl = `https://${JITSI_DOMAIN}/${appId}/external_api.js`
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve()
    const existing = document.querySelector(`script[src="${scriptUrl}"]`) as HTMLScriptElement | null
    if (existing) {
      if (window.JitsiMeetExternalAPI) return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

interface MediaPrefs {
  videoMuted: boolean
  audioMuted: boolean
}

interface JitsiRoomProps {
  jaasToken: JaaSToken
  onLeave: () => void
  immersive?: boolean
  mediaPrefs?: MediaPrefs
}

export function JitsiRoom({ jaasToken, onLeave, immersive = false, mediaPrefs }: JitsiRoomProps) {
  const { t } = useTranslation('salleReunion')
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<JitsiMeetApi | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let disposed = false

    loadJitsiScript(jaasToken.appId)
      .then(() => {
        if (disposed || !containerRef.current || !window.JitsiMeetExternalAPI) return

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: `${jaasToken.appId}/${jaasToken.roomName}`,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          jwt: jaasToken.token,
          userInfo: { displayName: jaasToken.displayName },
          configOverwrite: {
            subject: jaasToken.subject,
            prejoinPageEnabled: false,
            startWithAudioMuted: mediaPrefs?.audioMuted ?? true,
            startWithVideoMuted: mediaPrefs?.videoMuted ?? false,
            disableModeratorIndicator: false,
            enableInsecureRoomNameWarning: false,
            hideConferenceSubject: false,
            hideConferenceTimer: false,
            disableDeepLinking: true,
            resolution: 480,
            constraints: {
              video: { height: { ideal: 480, max: 720, min: 180 } },
            },
          },
          interfaceConfigOverwrite: {
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            MOBILE_APP_PROMO: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            DEFAULT_REMOTE_DISPLAY_NAME: 'Participant MIKA',
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'desktop', 'chat',
              'raisehand', 'participants-pane', 'tileview',
              'select-background', 'fullscreen', 'settings',
              'hangup',
            ],
          },
        })
        apiRef.current = api
        setLoading(false)

        api.addListener('readyToClose', () => {
          if (!disposed) onLeave()
        })
      })
      .catch(() => {
        if (!disposed) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      disposed = true
      apiRef.current?.dispose()
      apiRef.current = null
    }
  }, [jaasToken.appId, jaasToken.roomName, jaasToken.token, jaasToken.displayName, jaasToken.subject, onLeave])

  if (error) {
    return (
      <div
        className={'flex items-center justify-center bg-neutral-950 text-white ' + (immersive ? 'w-full h-full' : 'rounded-2xl')}
        style={immersive ? undefined : { height: 'calc(100vh - 360px)', minHeight: 400, maxHeight: 700 }}
      >
        <div className="text-center px-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <p className="text-[14px] text-white/70 max-w-sm">{t('messages.erreurJitsi')}</p>
          <button onClick={onLeave} className="mt-5 px-5 py-2.5 rounded-lg bg-rose-500 text-white text-[13px] font-medium hover:bg-rose-600 transition-colors min-h-[44px]">
            {t('actions.quitter')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={immersive ? 'w-full h-full' : 'rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800/60 shadow-2xl shadow-black/20'}>
      {loading && (
        <div
          className="flex flex-col items-center justify-center gap-4"
          style={immersive ? { width: '100%', height: '100%' } : { height: 'calc(100vh - 360px)', minHeight: 400, maxHeight: 700 }}
        >
          <div className="w-10 h-10 border-[3px] border-neutral-700 border-t-[#FF6B35] rounded-full animate-spin" />
          <p className="text-[13px] text-white/40">{t('closed.openingDescription')}</p>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full transition-opacity duration-300"
        style={immersive
          ? { height: loading ? 0 : '100%', opacity: loading ? 0 : 1 }
          : { height: loading ? 0 : 'calc(100vh - 360px)', minHeight: loading ? 0 : 400, maxHeight: loading ? 0 : 700, opacity: loading ? 0 : 1 }
        }
      />
    </div>
  )
}
