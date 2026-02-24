import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userApi, type Session } from '@/api/userApi'
import { handleApiError } from '@/utils/errorHandler'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const formatDate = (iso: string | null) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export const ProfileSessionsSection = () => {
  const { t } = useTranslation('user')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<number | null>(null)

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

  useEffect(() => {
    fetchSessions()
  }, [])

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

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {t('profile.sessions.title')}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {t('profile.sessions.subtitle')}
      </p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.sessions.loading')}</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.sessions.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {s.ipAddress || '—'} · {s.userAgent ? `${s.userAgent.slice(0, 60)}${s.userAgent.length > 60 ? '…' : ''}` : '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('profile.sessions.started')}: {formatDate(s.dateDebut)} · {t('profile.sessions.lastActivity')}: {formatDate(s.lastActivity)}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRevoke(s.id)}
                disabled={revokingId === s.id}
              >
                {revokingId === s.id ? t('profile.sessions.revoking') : t('profile.sessions.revoke')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
