import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { validatePassword } from '@/utils/passwordValidation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { handleApiError } from '@/utils/errorHandler'

export const ResetPasswordPage = () => {
  const { t } = useTranslation(['auth', 'common'])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError(t('resetPassword.missingToken'))
    }
  }, [token, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'))
      return
    }
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(t(`common:${passwordError}`))
      return
    }
    setLoading(true)
    setError(null)
    try {
      await authApi.resetPassword(token, newPassword)
      setSuccess(true)
    } catch (err: unknown) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" role="main">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-600 overflow-hidden p-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
                {t('resetPassword.successTitle')}
              </h1>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                {t('resetPassword.successMessage')}
              </p>
              <div className="mt-6 text-center">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate('/login')}
                >
                  {t('resetPassword.goToLogin')}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" role="main">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="px-8 pt-10 pb-2 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {t('resetPassword.title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('resetPassword.subtitle')}
              </p>
            </div>
            <div className="px-8 pb-10 pt-4">
              {!token ? (
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm">
                    {error}
                  </div>
                  <Link
                    to="/forgot-password"
                    className="block text-center text-sm text-primary hover:underline"
                  >
                    {t('resetPassword.requestNewLink')}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  <Input
                    label={t('resetPassword.newPassword')}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <Input
                    label={t('resetPassword.confirmPassword')}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={loading}
                    disabled={loading}
                  >
                    {t('resetPassword.submit')}
                  </Button>
                </form>
              )}
            </div>
          </div>
          <p className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              {t('forgotPassword.backToLogin')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
