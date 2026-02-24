import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchUserFromToken } from '@/store/slices/authSlice'
import { userApi } from '@/api/userApi'
import { handleApiError } from '@/utils/errorHandler'
import { validatePassword } from '@/utils/passwordValidation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export const ProfilePasswordSection = () => {
  const { t } = useTranslation(['user', 'common'])
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.user.currentUser)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async () => {
    if (!currentUser) return
    if (newPassword !== confirmPassword) {
      setError(t('profile.passwordMismatch'))
      return
    }
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(t(`common:${passwordError}`))
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await userApi.changeMyPassword({
        currentPassword,
        newPassword,
      })
      await dispatch(fetchUserFromToken()).unwrap().catch(() => {})
      setSuccess(t('profile.passwordChangedSuccess'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setError(handleApiError(err) || t('profile.errorChangePassword'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={t('profile.changePasswordTitle')} subtitle={t('profile.changePasswordSubtitle')}>
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
        <div className="space-y-1">
          <Input
            label={t('profile.currentPassword')}
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="text-small text-primary hover:underline"
          >
            {showCurrent ? t('profile.hidePassword') : t('profile.showPassword')}
          </button>
        </div>

        <div className="space-y-1">
          <Input
            label={t('profile.newPassword')}
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="text-small text-primary hover:underline"
          >
            {showNew ? t('profile.hidePassword') : t('profile.showPassword')}
          </button>
        </div>

        <div className="space-y-1">
          <Input
            label={t('profile.confirmNewPassword')}
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="text-small text-primary hover:underline"
          >
            {showConfirm ? t('profile.hidePassword') : t('profile.showPassword')}
          </button>
        </div>

        <Button type="button" variant="primary" isLoading={loading} onClick={handleSubmit}>
          {t('profile.submitChangePassword')}
        </Button>
      </div>
    </Card>
  )
}
