import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { authApi } from '@/api/authApi'
import { setCurrentUser } from '@/store/slices/userSlice'
import { setUser } from '@/store/slices/authSlice'
import { handleApiError } from '@/utils/errorHandler'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OtpInput } from '@/components/ui/OtpInput'
import {
  PROFILE_CARD_CLASS,
  PROFILE_CARD_HEADER_CLASS,
  PROFILE_CARD_BODY_CLASS,
  ProfileCardAccent,
} from './ProfileSectionCard'

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)

const ShieldOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
  </svg>
)

const QrIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <line x1="14" y1="14" x2="14" y2="14.01"/>
    <line x1="17" y1="14" x2="17" y2="14.01"/>
    <line x1="20" y1="14" x2="20" y2="14.01"/>
    <line x1="14" y1="17" x2="14" y2="17.01"/>
    <line x1="17" y1="17" x2="17" y2="17.01"/>
    <line x1="20" y1="17" x2="20" y2="17.01"/>
    <line x1="14" y1="20" x2="14" y2="20.01"/>
    <line x1="17" y1="20" x2="17" y2="20.01"/>
    <line x1="20" y1="20" x2="20" y2="20.01"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-3.5 h-3.5" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const StepDot = ({ active, done, n }: { active: boolean; done: boolean; n: number }) => (
  <div
    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
      done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
    }`}
  >
    {done ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ) : (
      n
    )}
  </div>
)

export const Profile2FASection = () => {
  const { t } = useTranslation('auth')
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.user.currentUser)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [setupData, setSetupData] = useState<{ secret: string; qrImageBase64: string } | null>(null)
  const [setupCode, setSetupCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableForm, setShowDisableForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  const handleVerifySetup = async () => {
    const digitsOnly = setupCode.replace(/\D/g, '')
    if (digitsOnly.length < 6) { setError(t('twoFa.codeMinLength')); return }
    setLoading(true)
    setError(null)
    try {
      const code6 = digitsOnly.slice(0, 6)
      await authApi.verifySetup2FA(code6)
      const freshUser = await authApi.getMe()
      setSuccess(t('twoFa.setupSuccess'))
      setSetupData(null)
      setSetupCode('')
      dispatch(setUser(freshUser))
      dispatch(setCurrentUser(freshUser))
    } catch (err: unknown) {
      setError(handleApiError(err) || t('twoFa.errorTitle'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSetup = () => { setSetupData(null); setSetupCode(''); setError(null) }

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
      const freshUser = await authApi.getMe()
      dispatch(setUser(freshUser))
      dispatch(setCurrentUser(freshUser))
    } catch (err: unknown) {
      setError(handleApiError(err) || t('twoFa.errorTitle'))
    } finally {
      setLoading(false)
    }
  }

  const panel: 'idle' | 'setup' | 'disable' = setupData ? 'setup' : showDisableForm ? 'disable' : 'idle'

  return (
    <section className={`${PROFILE_CARD_CLASS} animate-fade-in-up`}>
      <ProfileCardAccent />
      <div className={PROFILE_CARD_HEADER_CLASS}>
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            totpEnabled
              ? 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-primary/10 text-primary'
          }`}
        >
          {totpEnabled ? <ShieldCheckIcon /> : <ShieldOffIcon />}
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('twoFa.setupTitle')}</h2>
          <p className="text-sm mt-0.5 flex items-center gap-1.5 font-semibold">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                totpEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-500'
              }`}
            />
            {totpEnabled ? t('twoFa.enabled') : t('twoFa.notEnabled')}
          </p>
        </div>
      </div>
      <div className={`${PROFILE_CARD_BODY_CLASS} max-w-full sm:max-w-[480px]`}>
        {success && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm font-medium" role="status">
            <CheckIcon /><span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm font-medium" role="alert">
            <AlertIcon /><span>{error}</span>
          </div>
        )}

        {panel === 'setup' && setupData && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <StepDot n={1} active={false} done />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('twoFa.step1') ?? 'Scanner'}
                </span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-600" />
              <div className="flex flex-col items-center gap-1">
                <StepDot n={2} active done={false} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                  {t('twoFa.step2') ?? 'Vérifier'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <QrIcon />
              </div>
              <span>{t('twoFa.setupSubtitle')}</span>
            </div>

            <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
              <img
                src={`data:image/png;base64,${setupData.qrImageBase64}`}
                alt="QR code 2FA"
                className="w-[140px] h-[140px] sm:w-[168px] sm:h-[168px] rounded-lg block"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2.5">
                {t('twoFa.setupCodeLabel')}
              </label>
              <OtpInput
                value={setupCode}
                onChange={(v) => { setSetupCode(v); setError(null) }}
                disabled={loading}
                autoFocus
                error={!!error}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="primary"
                isLoading={loading}
                disabled={loading || setupCode.replace(/\D/g, '').length < 6}
                onClick={handleVerifySetup}
              >
                {t('twoFa.setupSubmit')}
              </Button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-600 bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handleCancelSetup}
                disabled={loading}
              >
                <XIcon />{t('twoFa.cancel')}
              </button>
            </div>
          </div>
        )}

        {panel === 'disable' && (
          <form onSubmit={handleDisable} className="flex flex-col gap-4">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm font-medium">
              <div className="w-7 h-7 rounded-lg bg-amber-200/50 dark:bg-amber-800/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <span>{t('twoFa.disableSubtitle')}</span>
            </div>

            <div className="relative">
              <Input
                label={t('twoFa.disablePasswordLabel')}
                type={showPassword ? 'text' : 'password'}
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-11"
              />
              <button
                type="button"
                className="absolute right-2.5 top-[2.75rem] -translate-y-1/2 p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button type="submit" variant="primary" isLoading={loading}>
                {t('twoFa.disableSubmit')}
              </Button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-600 bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => { setShowDisableForm(false); setDisablePassword(''); setError(null) }}
                disabled={loading}
              >
                <XIcon />{t('twoFa.cancel')}
              </button>
            </div>
          </form>
        )}

        {panel === 'idle' && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {totpEnabled
                ? t('twoFa.enabledDesc') ?? "L'authentification à deux facteurs est active. Votre compte est mieux protégé."
                : t('twoFa.notEnabledDesc') ?? "Activez la 2FA pour renforcer la sécurité de votre compte avec une application TOTP."}
            </p>
            <div className="flex gap-2 flex-wrap mt-4">
              {totpEnabled ? (
                <Button type="button" variant="secondary" onClick={() => setShowDisableForm(true)}>
                  {t('twoFa.disableTitle')}
                </Button>
              ) : (
                <Button type="button" variant="primary" onClick={handleStartSetup} isLoading={loading}>
                  {t('twoFa.setupSubmit')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
