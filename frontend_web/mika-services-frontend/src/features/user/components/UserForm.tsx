import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAppDispatch } from '@/store/hooks'
import { createUser } from '@/store/slices/userSlice'
import { roleApi } from '@/api/roleApi'
import { userApi } from '@/api/userApi'
import type { Role } from '@/api/roleApi'
import type { UserCreateRequest } from '@/api/userApi'

const TYPE_CONTRAT_VALUES = ['CDI', 'CDD', 'PRESTATAIRE', 'SOUS_TRAITANT', 'STAGE', 'INTERIM'] as const
const NIVEAU_EXPERIENCE_VALUES = ['DEBUTANT', 'CONFIRME', 'EXPERT', 'SENIOR'] as const

interface UserFormData extends Omit<UserCreateRequest, 'password'> {
  /** Non utilisé : le mot de passe est généré côté serveur et envoyé par email. */
}

interface UserFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export const UserForm = ({ onSuccess, onCancel }: UserFormProps) => {
  const { t } = useTranslation(['user', 'common'])
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successWarning, setSuccessWarning] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<{ id: number; prenom: string; nom: string }[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])

  useEffect(() => {
    roleApi.getActive().then(setRoles).catch(() => setRoles([]))
    userApi.getAll({ page: 0, size: 500 }).then((res) =>
      setUsers(res.content.map((u) => ({ id: u.id, prenom: u.prenom, nom: u.nom })))
    ).catch(() => setUsers([]))
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UserFormData>({
    defaultValues: {
      matricule: '',
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      quartier: '',
      province: '',
      numeroCNI: '',
      numeroPasseport: '',
      dateEmbauche: '',
      salaireMensuel: undefined,
      typeContrat: undefined,
      niveauExperience: undefined,
      superieurHierarchiqueId: undefined,
    },
  })

  const superieurId = watch('superieurHierarchiqueId')

  const onSubmit = async (data: UserFormData) => {
    setIsLoading(true)
    setErrorMessage(null)
    const payload: UserCreateRequest = {
      matricule: data.matricule,
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone || undefined,
      dateNaissance: data.dateNaissance || undefined,
      adresse: data.adresse || undefined,
      ville: data.ville || undefined,
      quartier: data.quartier || undefined,
      province: data.province || undefined,
      numeroCNI: data.numeroCNI || undefined,
      numeroPasseport: data.numeroPasseport || undefined,
      dateEmbauche: data.dateEmbauche || undefined,
      salaireMensuel: data.salaireMensuel,
      typeContrat: data.typeContrat,
      niveauExperience: data.niveauExperience,
      roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
      superieurHierarchiqueId: superieurId ? Number(superieurId) : undefined,
    }
    try {
      const created = await dispatch(createUser(payload)).unwrap()
      if (created.welcomeEmailSent === false) {
        setSuccessWarning(t('form.welcomeEmailNotSent'))
      } else {
        onSuccess()
      }
    } catch (err: unknown) {
      setErrorMessage((err as { message?: string })?.message || t('form.errorCreate'))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}
      {successWarning && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-lg text-sm flex items-center justify-between gap-3">
          <span>{successWarning}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => { setSuccessWarning(null); onSuccess() }}>
            {t('common:close')}
          </Button>
        </div>
      )}

      {/* Grille 2 colonnes sur grand écran : moins de hauteur, plus agréable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-5">
          {/* Identité */}
          <div className="bg-gray-50/60 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">{t('form.identity')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('form.matricule')} error={errors.matricule?.message} {...register('matricule', { required: t('form.validation.matriculeRequired') })} />
              <Input label={t('form.email')} type="email" error={errors.email?.message} {...register('email', { required: t('form.validation.emailRequired'), pattern: { value: /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/, message: t('form.validation.emailInvalid') } })} />
              <Input label={t('form.nom')} error={errors.nom?.message} {...register('nom', { required: t('form.validation.nomRequired') })} />
              <Input label={t('form.prenom')} error={errors.prenom?.message} {...register('prenom', { required: t('form.validation.prenomRequired') })} />
              <div className="col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('form.passwordAutoGenerated')}
                </p>
              </div>
              <div className="col-span-2">
                <Input label={t('form.telephone')} type="tel" error={errors.telephone?.message} {...register('telephone')} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50/60 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">{t('form.coordinates')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input label={t('form.adresse')} error={errors.adresse?.message} {...register('adresse')} />
              </div>
              <Input label={t('form.ville')} error={errors.ville?.message} {...register('ville')} />
              <Input label={t('form.quartier')} error={errors.quartier?.message} {...register('quartier')} />
              <div className="col-span-2">
                <Input label={t('form.province')} error={errors.province?.message} {...register('province')} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50/60 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">{t('form.identityDocs')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('form.numeroCNI')} error={errors.numeroCNI?.message} {...register('numeroCNI')} />
              <Input label={t('form.numeroPasseport')} error={errors.numeroPasseport?.message} {...register('numeroPasseport')} />
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-5">
          {/* Professionnel */}
          <div className="bg-gray-50/60 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">{t('form.professional')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('form.dateEmbauche')} type="date" error={errors.dateEmbauche?.message} {...register('dateEmbauche')} />
              <Input label={t('form.dateNaissance')} type="date" error={errors.dateNaissance?.message} {...register('dateNaissance')} />
              <Input label={t('form.salaireMensuel')} type="number" step="0.01" error={errors.salaireMensuel?.message} {...register('salaireMensuel', { valueAsNumber: true })} />
              <div>
                <label className={labelClass}>{t('form.typeContrat')}</label>
                <select {...register('typeContrat')} className={inputClass}>
                  <option value="">—</option>
                  {TYPE_CONTRAT_VALUES.map((v) => (
                    <option key={v} value={v}>{t(`contractType.${v}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{t('form.niveauExperience')}</label>
                <select {...register('niveauExperience')} className={inputClass}>
                  <option value="">—</option>
                  {NIVEAU_EXPERIENCE_VALUES.map((v) => (
                    <option key={v} value={v}>{t(`experienceLevel.${v}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/60 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">{t('form.hierarchy')}</h3>
            <label className={labelClass}>{t('form.superieurHierarchique')}</label>
            <select {...register('superieurHierarchiqueId')} className={inputClass}>
              <option value="">{t('form.none')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50/60 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-100 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">{t('form.roles')}</h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700">
              {roles.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">{t('form.noRoles')}</p>
              ) : (
                roles.map((role) => (
                  <label key={role.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 py-1.5 px-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedRoleIds.includes(role.id)}
                      onChange={() => toggleRole(role.id)}
                      className="rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{role.nom}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600 shrink-0">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('form.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {t('form.createUser')}
        </Button>
      </div>
    </form>
  )
}
