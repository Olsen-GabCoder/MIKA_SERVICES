import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchUserFromToken } from '@/store/slices/authSlice'
import { userApi } from '@/api/userApi'
import { handleApiError } from '@/utils/errorHandler'
import { validatePassword } from '@/utils/passwordValidation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ProfileSectionCard, ProfileSectionCardHeader } from './ProfileSectionCard'

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className="w-[18px] h-[18px]" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const getStrength = (pwd: string) => {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}

const STRENGTH_CLASSES = ['', 'text-red-600', 'text-orange-500', 'text-yellow-600', 'text-green-600', 'text-green-700 dark:text-green-400']

const StrengthMeter = ({ password }: { password: string }) => {
  const { t } = useTranslation('user')
  const strengthLabels = ['', t('profile.passwordStrengthVeryWeak'), t('profile.passwordStrengthWeak'), t('profile.passwordStrengthMedium'), t('profile.passwordStrengthStrong'), t('profile.passwordStrengthVeryStrong')]
  const score = getStrength(password)
  if (!password) return null
  return (
    <div className="flex items-center gap-2.5 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= score
                ? score <= 2
                  ? 'bg-red-500'
                  : score <= 3
                    ? 'bg-orange-500'
                    : score <= 4
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                : 'bg-gray-200 dark:bg-gray-600 opacity-40'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-semibold min-w-[70px] text-right ${STRENGTH_CLASSES[score]}`}>
        {strengthLabels[score]}
      </span>
    </div>
  )
}

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  show: boolean
  onToggle: () => void
  showLabel: string
  hideLabel: string
  autoComplete?: string
  showStrength?: boolean
}

const PasswordField = ({
  label,
  value,
  onChange,
  show,
  onToggle,
  showLabel,
  hideLabel,
  autoComplete,
  showStrength,
}: PasswordFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</label>
    <div className="relative">
      <Input
        label=""
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required
        minLength={8}
        autoComplete={autoComplete}
        className="pr-11"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
        aria-label={show ? hideLabel : showLabel}
      >
        <EyeIcon open={show} />
      </button>
    </div>
    {showStrength && <StrengthMeter password={value} />}
  </div>
)

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
      await userApi.changeMyPassword({ currentPassword, newPassword })
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
    <ProfileSectionCard
      header={
        <ProfileSectionCardHeader
          icon={<LockIcon />}
          title={t('profile.changePasswordTitle')}
          subtitle={t('profile.changePasswordSubtitle')}
        />
      }
    >
        <div className="flex flex-col gap-5">
          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm font-medium" role="status">
              <CheckIcon />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm font-medium" role="alert">
              <AlertIcon />
              <span>{error}</span>
            </div>
          )}

          <PasswordField
            label={t('profile.currentPassword')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            showLabel={t('profile.showPassword')}
            hideLabel={t('profile.hidePassword')}
            autoComplete="current-password"
          />

          <div className="h-px bg-gray-200 dark:bg-gray-600 my-0.5" />

          <PasswordField
            label={t('profile.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            showLabel={t('profile.showPassword')}
            hideLabel={t('profile.hidePassword')}
            autoComplete="new-password"
            showStrength
          />

          <PasswordField
            label={t('profile.confirmNewPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            showLabel={t('profile.showPassword')}
            hideLabel={t('profile.hidePassword')}
            autoComplete="new-password"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button
              type="button"
              variant="primary"
              isLoading={loading}
              onClick={handleSubmit}
            >
              {t('profile.submitChangePassword')}
            </Button>
            <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <LockIcon />
              8 caractères minimum
            </span>
          </div>
        </div>
    </ProfileSectionCard>
  )
}
