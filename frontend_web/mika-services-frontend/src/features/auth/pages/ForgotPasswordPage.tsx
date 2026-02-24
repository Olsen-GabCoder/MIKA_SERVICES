import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { handleApiError } from '@/utils/errorHandler'

export const ForgotPasswordPage = () => {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      await authApi.forgotPassword(email)
      setSuccess(true)
    } catch (err: unknown) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" role="main">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="px-8 pt-10 pb-2 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {t('forgotPassword.title')}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {t('forgotPassword.subtitle')}
              </p>
            </div>
            <div className="px-8 pb-10 pt-4">
              {success ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-green-800 dark:text-green-200 text-sm">
                    {t('forgotPassword.successMessage')}
                  </div>
                  <Link
                    to="/login"
                    className="block text-center text-sm text-primary hover:underline"
                  >
                    {t('forgotPassword.backToLogin')}
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
                    label={t('forgotPassword.email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.placeholderEmail')}
                    required
                    autoComplete="email"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isLoading={loading}
                    disabled={loading}
                  >
                    {t('forgotPassword.submit')}
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
