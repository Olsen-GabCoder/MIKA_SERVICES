import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { useAppSelector } from '@/store/hooks'

interface Verify2FAFormData {
  code: string
}

interface Verify2FAFormProps {
  onSubmit: (code: string) => void
}

export const Verify2FAForm = ({ onSubmit }: Verify2FAFormProps) => {
  const { t } = useTranslation('auth')
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Verify2FAFormData>()

  const onFormSubmit = (data: Verify2FAFormData) => {
    onSubmit(data.code.trim())
  }

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="w-full"
      aria-label={t('twoFa.verifyFormAria')}
      noValidate
    >
      {error && (
        <div className="login-error-msg" role="alert">
          <strong>{t('twoFa.errorTitle')}</strong> — {error}
        </div>
      )}

      <p className="login-text-muted mb-4">
        {t('twoFa.verifySubtitle')}
      </p>

      <div className="login-input-group">
        <label htmlFor="login-2fa-code" className="login-input-label">{t('twoFa.codeLabel')}</label>
        <div className="login-input-wrap">
          <span className="login-input-icon" aria-hidden="true">🔐</span>
          <input
            id="login-2fa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t('twoFa.codePlaceholder')}
            maxLength={8}
            className={errors.code ? 'login-input-invalid' : ''}
            {...register('code', {
              required: t('twoFa.codeRequired'),
              minLength: {
                value: 6,
                message: t('twoFa.codeMinLength'),
              },
            })}
          />
        </div>
        {errors.code?.message && (
          <p className="login-input-error">{errors.code.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="login-btn-cta"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('twoFa.verifySubmit')}
          </span>
        ) : (
          t('twoFa.verifySubmit')
        )}
      </button>
    </form>
  )
}
