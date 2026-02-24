import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import type { User } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAppDispatch } from '@/store/hooks'
import { updateUser } from '@/store/slices/userSlice'
import { ProfileHeader } from './ProfileHeader'

interface ProfileFormProps {
  user: User
  /** Contenu de la colonne droite : CV, mot de passe, etc. */
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
      await dispatch(updateUser({
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
      })).unwrap()
      setSuccessMessage(t('profile.updateSuccess'))
    } catch (error: any) {
      setErrorMessage(error?.message || t('profile.errorUpdate'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch min-h-[calc(100vh-12rem)] w-full">
      {/* Colonne gauche : en-tête + infos personnelles */}
      <div className="flex flex-col gap-6 min-h-0">
        <ProfileHeader user={user} />
        <Card title={t('profile.personalInfo')} className="flex-1 min-h-0 flex flex-col">
          <div className="space-y-4 flex-1">
            {successMessage && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200 rounded-lg text-small">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-small">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <Input
              label={t('form.adresse')}
              error={errors.adresse?.message}
              {...register('adresse')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div className="flex justify-end pt-4">
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {t('profile.saveModifications')}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-6 min-h-0">
        <Card title={t('profile.ficheMission')} subtitle={t('profile.ficheMissionSubtitle')} className="flex-1 min-h-0 flex flex-col">
          <textarea
            className="w-full flex-1 min-h-[140px] px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-body dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
            placeholder={t('profile.ficheMissionPlaceholder')}
            {...register('ficheMission')}
          />
          <p className="text-small text-medium dark:text-gray-400 mt-2">{t('profile.saveNote')}</p>
        </Card>
        {children}
      </div>
    </form>
  )
}
