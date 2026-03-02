import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import type { User } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAppDispatch } from '@/store/hooks'
import { updateUser } from '@/store/slices/userSlice'
import { ProfileHeader } from './ProfileHeader'
import { ProfileSectionCard, ProfileSectionCardHeader } from './ProfileSectionCard'

interface ProfileFormProps {
  user: User
  children?: ReactNode
}

interface ProfileFormData {
  nom: string
  prenom: string
  email: string
  telephone?: string
  dateEmbauche?: string
  adresse?: string
  ville?: string
  quartier?: string
  province?: string
  ficheMission?: string
}

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
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    className="w-4 h-4" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
)


const Banner = ({ type, message }: { type: 'success' | 'error'; message: string }) => (
  <div
    className={`flex items-start gap-2 p-3 rounded-lg text-sm font-medium ${
      type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
    }`}
    role={type === 'error' ? 'alert' : 'status'}
  >
    {type === 'success' ? <CheckIcon /> : <AlertIcon />}
    <span>{message}</span>
  </div>
)

const FieldGroup = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2.5">
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
)

export const ProfileForm = ({ user, children }: ProfileFormProps) => {
  const { t } = useTranslation('user')
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone || '',
      dateEmbauche: user.dateEmbauche ? String(user.dateEmbauche).slice(0, 10) : '',
      adresse: user.adresse || '',
      ville: user.ville || '',
      quartier: user.quartier || '',
      province: user.province || '',
      ficheMission: user.ficheMission || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)
    try {
      const result = await dispatch(updateUser({
        id: user.id,
        data: {
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          telephone: data.telephone || undefined,
          dateEmbauche: data.dateEmbauche || undefined,
          adresse: data.adresse || undefined,
          ville: data.ville || undefined,
          quartier: data.quartier || undefined,
          province: data.province || undefined,
          ficheMission: data.ficheMission || undefined,
        },
      }))
      if (result.payload) {
        setSuccessMessage(t('profile.updateSuccess'))
      }
    } catch (error: any) {
      setErrorMessage(error?.message || t('profile.errorUpdate'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch"
    >
      {/* Colonne gauche : même hauteur que la droite — en-tête, infos personnelles, fiche mission (remplit l'espace restant) */}
      <div className="flex flex-col gap-6 min-h-0">
        <ProfileHeader user={user} />
        <ProfileSectionCard
          header={
            <ProfileSectionCardHeader icon={<UserIcon />} title={t('profile.personalInfo')} />
          }
        >
          {successMessage && <Banner type="success" message={successMessage} />}
          {errorMessage && <Banner type="error" message={errorMessage} />}

          <FieldGroup label={t('profile.groupIdentity') ?? 'Identité'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t('form.nom')}
                error={errors.nom?.message}
                {...register('nom', { required: t('form.validation.nomRequired') })}
              />
              <Input
                label={t('form.prenom')}
                error={errors.prenom?.message}
                {...register('prenom', { required: t('form.validation.prenomRequired') })}
              />
            </div>
          </FieldGroup>

          <FieldGroup label={t('profile.groupContact') ?? 'Contact'}>
            <Input
              label={t('form.email')}
              type="email"
              error={errors.email?.message}
              {...register('email', {
                required: t('form.validation.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('form.validation.emailInvalid'),
                },
              })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t('form.telephone')}
                type="tel"
                error={errors.telephone?.message}
                {...register('telephone')}
              />
              <Input
                label={t('profile.dateEmbaucheLabel')}
                type="date"
                error={errors.dateEmbauche?.message}
                {...register('dateEmbauche')}
              />
            </div>
          </FieldGroup>

          <FieldGroup label={t('profile.groupAddress') ?? 'Adresse'}>
            <Input
              label={t('form.adresse')}
              error={errors.adresse?.message}
              {...register('adresse')}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label={t('form.ville')}
                error={errors.ville?.message}
                {...register('ville')}
              />
              <Input
                label={t('form.quartier')}
                error={errors.quartier?.message}
                {...register('quartier')}
              />
              <Input
                label={t('form.province')}
                error={errors.province?.message}
                {...register('province')}
              />
            </div>
          </FieldGroup>

          <div className="flex justify-end pt-4 mt-2 border-t border-gray-200 dark:border-gray-600">
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {t('profile.saveModifications')}
            </Button>
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard
          fill
          header={
            <ProfileSectionCardHeader
              icon={<FileIcon />}
              title={t('profile.ficheMission')}
              subtitle={t('profile.ficheMissionSubtitle')}
            />
          }
        >
          <textarea
            className="w-full min-h-[140px] flex-1 px-3.5 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-y text-sm"
            placeholder={t('profile.ficheMissionPlaceholder')}
            {...register('ficheMission')}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1 shrink-0">
            {t('profile.saveNote')}
          </p>
        </ProfileSectionCard>
      </div>

      {/* Colonne droite : même hauteur que la gauche — CV, mot de passe, 2FA, sessions */}
      <div className="flex flex-col gap-6 min-h-0">
        {children}
      </div>
    </form>
  )
}

