import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { authApi } from '@/api/authApi'
import { setCurrentUser } from '@/store/slices/userSlice'
import { setUser } from '@/store/slices/authSlice'
import { handleApiError } from '@/utils/errorHandler'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export const Profile2FASection = () => {
  const { t } = useTranslation('auth')
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.user.currentUser)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Activer 2FA : étape setup (QR + code)
  const [setupData, setSetupData] = useState<{ secret: string; qrImageBase64: string } | null>(null)
  const [setupCode, setSetupCode] = useState('')

  // Désactiver 2FA : mot de passe
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableForm, setShowDisableForm] = useState(false)

  const totpEnabled = currentUser?.totpEnabled === true

  const handleStartSetup = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setSetupData(null)
    try {
      const data = await authApi.setup2FA()
      if (!data?.qrImageBase64) {
        setError(t('twoFa.errorTitle') + ' (réponse invalide)')
        return
      }
      setSetupData({ secret: data.secret ?? '', qrImageBase64: data.qrImageBase64 })
    } catch (err: unknown) {
      setError(handleApiError(err) || t('twoFa.errorTitle'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault()
    const digitsOnly = setupCode.replace(/\D/g, '')
    if (digitsOnly.length < 5) {
      setError(t('twoFa.codeMinLength'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const code6 = digitsOnly.slice(0, 6).padStart(6, '0')
      const updatedUser = await authApi.verifySetup2FA(code6)
      setSuccess(t('twoFa.setupSuccess'))
      setSetupData(null)
      setSetupCode('')
      dispatch(setUser(updatedUser))
      dispatch(setCurrentUser(updatedUser))
    } catch (err: unknown) {
      setError(handleApiError(err) || t('twoFa.errorTitle'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSetup = () => {
    setSetupData(null)
    setSetupCode('')
    setError(null)
  }

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disablePassword) return
    setLoading(true)
    setError(null)
    try {
      await authApi.disable2FA(disablePassword)
      setSuccess(t('twoFa.disableSuccess'))
      setShowDisableForm(false)
      setDisablePassword('')
      const updatedUser = await dispatch(fetchCurrentUser()).unwrap()
      dispatch(setUser(updatedUser))
    } catch (err: unknown) {
      setError(handleApiError(err) || t('twoFa.errorTitle'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title={t('twoFa.setupTitle')}
      subtitle={totpEnabled ? t('twoFa.enabled') : t('twoFa.notEnabled')}
    >
      <div className="space-y-4 max-w-md">
        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 rounded-lg text-small">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-small">
            {error}
          </div>
        )}

        {setupData ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('twoFa.setupSubtitle')}</p>
            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${setupData.qrImageBase64}`}
                alt="QR code 2FA"
                className="w-48 h-48"
              />
            </div>
            <form onSubmit={handleVerifySetup} className="space-y-3">
              <Input
                label={t('twoFa.setupCodeLabel')}
                type="text"
                inputMode="numeric"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder={t('twoFa.codePlaceholder')}
                minLength={6}
                required
              />
              <div className="flex gap-2">
                <Button type="submit" variant="primary" isLoading={loading}>
                  {t('twoFa.setupSubmit')}
                </Button>
                <Button type="button" variant="secondary" onClick={handleCancelSetup} disabled={loading}>
                  {t('twoFa.cancel')}
                </Button>
              </div>
            </form>
          </div>
        ) : showDisableForm ? (
          <form onSubmit={handleDisable} className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('twoFa.disableSubtitle')}</p>
            <Input
              label={t('twoFa.disablePasswordLabel')}
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" isLoading={loading}>
                {t('twoFa.disableSubmit')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowDisableForm(false); setDisablePassword(''); setError(null); }}
                disabled={loading}
              >
                {t('twoFa.cancel')}
              </Button>
            </div>
          </form>
        ) : totpEnabled ? (
          <Button type="button" variant="secondary" onClick={() => setShowDisableForm(true)}>
            {t('twoFa.disableTitle')}
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={handleStartSetup} isLoading={loading}>
            {t('twoFa.setupSubmit')}
          </Button>
        )}
      </div>
    </Card>
  )
}
