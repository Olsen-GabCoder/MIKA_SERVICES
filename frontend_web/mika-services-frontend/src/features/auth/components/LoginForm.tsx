import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAppSelector } from '@/store/hooks'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

interface LoginFormProps {
  onSubmit: (email: string, password: string, rememberMe: boolean) => void
}

export const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const { t } = useTranslation('auth')
  const { isLoading, error } = useAppSelector((state) => state.auth)
  const [showPassword, setShowPassword] = useState(false)

  const getLoginErrorMessage = (err: string | null): string | null => {
    if (!err) return null
    if (err === 'RATE_LIMIT') return t('login.errorRateLimit')
    if (err === 'ACCOUNT_LOCKED') return t('login.errorAccountLocked')
    if (/401|unauthorized|identifiant|incorrect|invalid credentials/i.test(err)) return t('login.errorBadCredentials')
    if (/network|timeout|erreur réseau/i.test(err)) return t('login.errorNetwork')
    return t('login.errorGeneric')
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onFormSubmit = (data: LoginFormData) => {
    onSubmit(data.email, data.password, data.rememberMe)
  }

  const displayError = getLoginErrorMessage(error)

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="w-full"
      aria-label={t('login.formAria')}
      noValidate
    >
      {displayError && (
        <div className="login-error-msg" role="alert">
          <strong>{t('login.errorTitle')}</strong> — {displayError}
        </div>
      )}

      <div className="login-input-group">
        <label htmlFor="login-email" className="login-input-label">{t('login.email')}</label>
        <div className="login-input-wrap">
          <span className="login-input-icon" aria-hidden="true">✉</span>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={t('login.placeholderEmail')}
            className={errors.email ? 'login-input-invalid' : ''}
            {...register('email', {
              required: t('login.validationEmailRequired'),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('login.validationEmailInvalid'),
              },
            })}
          />
        </div>
        {errors.email?.message && (
          <p className="login-input-error">{errors.email.message}</p>
        )}
      </div>

      <div className="login-input-group">
        <label htmlFor="login-password" className="login-input-label">{t('login.password')}</label>
        <div className="login-input-wrap">
          <span className="login-input-icon" aria-hidden="true">&#9672;</span>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t('login.placeholderPassword')}
            className={errors.password ? 'login-input-invalid pr-24' : 'pr-24'}
            {...register('password', {
              required: t('login.validationPasswordRequired'),
              minLength: {
                value: 6,
                message: t('login.validationPasswordMinLength'),
              },
            })}
          />
          <button
            type="button"
            className="login-toggle-pw"
            onClick={() => setShowPassword(!showPassword)}
            aria-pressed={showPassword}
          >
            {showPassword ? t('login.hidePassword') : t('login.showPassword')}
          </button>
        </div>
        {errors.password?.message && (
          <p className="login-input-error">{errors.password.message}</p>
        )}
        <div className="login-forgot">
          <Link to="/forgot-password">{t('login.forgotPassword')}</Link>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          id="login-remember"
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          {...register('rememberMe')}
        />
        <label htmlFor="login-remember" className="text-sm text-gray-600 cursor-pointer select-none">
          {t('login.rememberMe')}
        </label>
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
            {t('login.submit')}
          </span>
        ) : (
          t('login.submit')
        )}
      </button>
    </form>
  )
}
