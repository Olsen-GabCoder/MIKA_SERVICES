import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userApi, type Session } from '@/api/userApi'
import { handleApiError } from '@/utils/errorHandler'
import { useFormatDate } from '@/hooks/useFormatDate'

// ─── Icons ────────────────────────────────────────────────────────────────────

const MonitorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 16, height: 16 }} aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 16, height: 16 }} aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }} aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const WifiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 11, height: 11, opacity: .6 }} aria-hidden="true">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 11, height: 11, opacity: .6 }} aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ width: 13, height: 13, animation: 'pss-spin .8s linear infinite' }} aria-hidden="true">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)

const EmptyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: 36, height: 36, opacity: .3 }} aria-hidden="true">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)

// ─── Main component ───────────────────────────────────────────────────────────

export const ProfileSessionsSection = () => {
  const formatDate = useFormatDate()
  const { t } = useTranslation('user')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)

  // ── Logique inchangée ──────────────────────────────────────────────────────
  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await userApi.getMySessions()
      setSessions(list)
    } catch (err: unknown) {
      setError(handleApiError(err) || t('profile.sessions.errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions() }, [])

  const handleRevoke = async (sessionId: number) => {
    setRevokingId(sessionId)
    setError(null)
    try {
      await userApi.revokeSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err: unknown) {
      setError(handleApiError(err) || t('profile.sessions.errorRevoke'))
    } finally {
      setRevokingId(null)
    }
  }

  const maxSessions = 3

  return (
    <>
      <style>{`
        @keyframes pss-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pss-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pss-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pss-row-in {
          from { opacity: 0; transform: translateX(-5px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* ── Variables (couleurs alignées sur la charte : primary #FF6B35, success #6BBF59, danger #E63946) ── */
        .pss-root {
          --pss-accent:         #FF6B35;
          --pss-accent-2:       #FF8C61;
          --pss-accent-light:   #fff5f2;
          --pss-text:           #0f172a;
          --pss-text-sub:       #475569;
          --pss-text-muted:     #94a3b8;
          --pss-border:         #e2e8f0;
          --pss-card-bg:        #ffffff;
          --pss-row-bg:         #f8fafc;
          --pss-row-hover:      #fff5f2;
          --pss-current-bg:     #fff5f2;
          --pss-current-border: color-mix(in srgb, #FF6B35 28%, transparent);
          --pss-shadow:         0 1px 2px rgba(0,0,0,.04), 0 6px 24px rgba(15,23,42,.06);
          --pss-radius:         12px;
          --pss-error:          #E63946;
          --pss-error-bg:       #fef2f2;
          --pss-error-border:   #fecaca;
          --pss-green:          #6BBF59;
          --pss-green-bg:       #ecfdf5;
          --pss-green-border:   #a7f3d0;
          --pss-badge-bg:       #fff0eb;
          --pss-badge-text:     #D94E1F;
        }

        html[data-theme="dark"] .pss-root {
          --pss-accent:         #FF8C61;
          --pss-accent-2:       #FF6B35;
          --pss-accent-light:   rgba(255, 107, 53, 0.14);
          --pss-text:           #f1f5f9;
          --pss-text-sub:       #94a3b8;
          --pss-text-muted:     #64748b;
          --pss-border:         #1e293b;
          --pss-card-bg:        #1f2937;
          --pss-row-bg:         #1e293b;
          --pss-row-hover:      rgba(255, 107, 53, 0.08);
          --pss-current-bg:    rgba(255, 107, 53, 0.12);
          --pss-current-border: color-mix(in srgb, #FF8C61 25%, transparent);
          --pss-shadow:         0 1px 2px rgba(0,0,0,.3), 0 6px 24px rgba(0,0,0,.4);
          --pss-error:          #f87171;
          --pss-error-bg:       rgba(230, 57, 70, 0.15);
          --pss-error-border:   rgba(230, 57, 70, 0.35);
          --pss-green:          #6BBF59;
          --pss-green-bg:       rgba(107, 191, 89, 0.12);
          --pss-green-border:   rgba(107, 191, 89, 0.35);
          --pss-badge-bg:       rgba(255, 107, 53, 0.18);
          --pss-badge-text:     #FF8C61;
        }

        /* ── Card shell (aligné design premium profil : transition + hover) ── */
        .pss-root {
          position: relative;
          background: var(--pss-card-bg);
          border: 1px solid var(--pss-border);
          border-radius: var(--pss-radius);
          box-shadow: var(--pss-shadow);
          overflow: hidden;
          animation: pss-fade-up .35s .2s ease both;
          transition: box-shadow .2s ease, border-color .2s ease;
        }

        .pss-root:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, .08), 0 2px 4px -2px rgba(0, 0, 0, .06);
          border-color: color-mix(in srgb, var(--pss-accent) 28%, var(--pss-border));
        }

        html[data-theme="dark"] .pss-root:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, .35), 0 2px 4px -2px rgba(0, 0, 0, .25);
        }

        .pss-root::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--pss-accent), var(--pss-accent-2), var(--pss-accent));
          background-size: 200% auto;
          animation: pss-shimmer 3s linear infinite;
        }

        .pss-body {
          padding: 24px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (max-width: 520px) {
          .pss-body { padding: 20px 18px 22px; }
        }

        /* ── Header ────────────────────────────────────────────────────── */
        .pss-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--pss-border);
        }

        .pss-head-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pss-head-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: var(--pss-accent-light);
          color: var(--pss-accent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .pss-head-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--pss-text);
          letter-spacing: -.015em;
        }

        .pss-head-sub {
          font-size: 0.8125rem;
          color: var(--pss-text-muted);
          margin-top: 2px;
        }

        /* Session count pill */
        .pss-count-pill {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: .04em;
          background: var(--pss-badge-bg);
          color: var(--pss-badge-text);
          border: 1px solid color-mix(in srgb, var(--pss-accent) 25%, transparent);
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Error banner ──────────────────────────────────────────────── */
        .pss-error {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 500;
          line-height: 1.5;
          background: var(--pss-error-bg);
          border: 1px solid var(--pss-error-border);
          color: var(--pss-error);
          animation: pss-fade-up .22s ease;
        }

        /* ── Skeleton ──────────────────────────────────────────────────── */
        .pss-skeleton {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pss-skeleton-row {
          height: 72px;
          border-radius: 10px;
          background: linear-gradient(90deg,
            var(--pss-row-bg) 0%,
            color-mix(in srgb, var(--pss-row-bg) 75%, var(--pss-accent)) 50%,
            var(--pss-row-bg) 100%);
          background-size: 200% 100%;
          animation: pss-shimmer 1.4s ease infinite;
          opacity: .55;
        }

        /* ── Empty state ───────────────────────────────────────────────── */
        .pss-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px 0 8px;
          color: var(--pss-text-muted);
          text-align: center;
        }

        .pss-empty-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* ── Session list ──────────────────────────────────────────────── */
        .pss-list {
          list-style: none;
          margin: 0; padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* ── Session row ───────────────────────────────────────────────── */
        .pss-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 12px;
          border: 1px solid var(--pss-border);
          background: var(--pss-row-bg);
          transition: background .18s, border-color .18s, box-shadow .18s;
          animation: pss-row-in .25s ease both;
        }

        .pss-row--current {
          background: var(--pss-current-bg);
          border-color: var(--pss-current-border);
        }

        .pss-row:not(.pss-row--current):hover {
          background: var(--pss-row-hover);
          border-color: var(--pss-border);
          box-shadow: 0 2px 8px rgba(0,0,0,.05);
        }

        /* Device icon bubble */
        .pss-device-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          background: var(--pss-border);
          color: var(--pss-text-muted);
          transition: background .2s, color .2s;
        }

        .pss-row--current .pss-device-icon {
          background: var(--pss-accent-light);
          color: var(--pss-accent);
        }

        /* Info block */
        .pss-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .pss-device-row {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .pss-device-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--pss-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* "Current session" badge */
        .pss-current-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 1px 8px;
          border-radius: 99px;
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          background: var(--pss-green-bg);
          border: 1px solid var(--pss-green-border);
          color: var(--pss-green);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .pss-current-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--pss-green);
          animation: pss-pulse 1.8s ease infinite;
        }

        @keyframes pss-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .5; transform: scale(.7); }
        }

        /* Meta line */
        .pss-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .pss-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.6875rem;
          color: var(--pss-text-muted);
          font-weight: 500;
          white-space: nowrap;
        }

        /* ── Revoke button ─────────────────────────────────────────────── */
        .pss-revoke-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 13px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid var(--pss-border);
          background: var(--pss-card-bg);
          color: var(--pss-text-sub);
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background .15s, border-color .15s, color .15s, transform .15s;
        }

        .pss-revoke-btn:hover:not(:disabled) {
          border-color: var(--pss-error);
          color: var(--pss-error);
          background: var(--pss-error-bg);
          transform: translateY(-1px);
        }

        .pss-revoke-btn:disabled {
          opacity: .45;
          cursor: not-allowed;
        }

        @media (max-width: 520px) {
          .pss-row { flex-wrap: wrap; }
          .pss-revoke-btn { align-self: flex-end; }
        }
      `}</style>

      <div className="pss-root">
        <div className="pss-body">

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="pss-head">
            <div className="pss-head-left">
              <div className="pss-head-icon"><ShieldIcon /></div>
              <div>
                <div className="pss-head-title">{t('profile.sessions.title')}</div>
                <div className="pss-head-sub">{t('profile.sessions.subtitle')}</div>
              </div>
            </div>
            {!loading && sessions.length > 0 && (
              <span className="pss-count-pill">
                {sessions.length}/{maxSessions}
              </span>
            )}
          </div>

          {/* ── Error ───────────────────────────────────────────────── */}
          {error && (
            <div className="pss-error" role="alert">
              <AlertIcon /><span>{error}</span>
            </div>
          )}

          {/* ── Content ─────────────────────────────────────────────── */}
          {loading ? (
            <div className="pss-skeleton">
              {[1, 2].map((i) => (
                <div key={i} className="pss-skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="pss-empty">
              <EmptyIcon />
              <p className="pss-empty-text">{t('profile.sessions.empty')}</p>
            </div>
          ) : (
            <ul className="pss-list">
              {sessions.map((s, i) => (
                <li
                  key={s.id}
                  className={`pss-row${s.isCurrent ? ' pss-row--current' : ''}`}
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  {/* Device icon */}
                  <div className="pss-device-icon">
                    <MonitorIcon />
                  </div>

                  {/* Info */}
                  <div className="pss-info">
                    <div className="pss-device-row">
                      <span className="pss-device-name">{s.deviceName || '—'}</span>
                      {s.isCurrent && (
                        <span className="pss-current-badge">
                          <span className="pss-current-dot" />
                          {t('profile.sessions.current')}
                        </span>
                      )}
                    </div>
                    <div className="pss-meta">
                      {s.ipAddress && (
                        <span className="pss-meta-item">
                          <WifiIcon />{s.ipAddress}
                        </span>
                      )}
                      <span className="pss-meta-item">
                        <ClockIcon />
                        {t('profile.sessions.started')}: {formatDate(s.dateDebut, { includeTime: true })}
                      </span>
                      <span className="pss-meta-item">
                        <ClockIcon />
                        {t('profile.sessions.lastActivity')}: {formatDate(s.lastActivity, { includeTime: true })}
                      </span>
                    </div>
                  </div>

                  {/* Revoke */}
                  <button
                    type="button"
                    className="pss-revoke-btn"
                    onClick={() => handleRevoke(s.id)}
                    disabled={s.isCurrent || revokingId === s.id}
                    aria-label={`${t('profile.sessions.revoke')} — ${s.deviceName}`}
                  >
                    {revokingId === s.id && <SpinnerIcon />}
                    {revokingId === s.id
                      ? t('profile.sessions.revoking')
                      : t('profile.sessions.revoke')}
                  </button>
                </li>
              ))}
            </ul>
          )}

        </div>
      </div>
    </>
  )
}