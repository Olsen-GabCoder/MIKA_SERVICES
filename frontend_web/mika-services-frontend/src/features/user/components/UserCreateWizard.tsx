import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAppDispatch } from '@/store/hooks'
import { createUser } from '@/store/slices/userSlice'
import { roleApi, type Role } from '@/api/roleApi'
import { departementApi, specialiteApi } from '@/api/organisationApi'
import { userApi, type UserCreateRequest } from '@/api/userApi'
import { handleApiError } from '@/utils/errorHandler'
import type { Departement, Specialite } from '@/types'

const TYPE_CONTRAT_VALUES = ['CDI', 'CDD', 'PRESTATAIRE', 'SOUS_TRAITANT', 'STAGE', 'INTERIM'] as const
const NIVEAU_EXPERIENCE_VALUES = ['DEBUTANT', 'CONFIRME', 'EXPERT', 'SENIOR'] as const
const SEXE_VALUES = ['HOMME', 'FEMME'] as const

const NIVEAU_COLORS: Record<string, string> = {
  DIRECTION: '#2E5266',
  RESPONSABLE: '#8B5CF6',
  SUPERVISEUR: '#17A2B8',
  TECHNICIEN: '#48B5A0',
  EMPLOYE: '#94A3B8',
}

type WizardFormData = Omit<UserCreateRequest, 'password' | 'roleIds' | 'departementIds' | 'specialiteIds'>

const STEP_FIELDS: (keyof WizardFormData)[][] = [
  ['nom', 'prenom', 'email', 'sexe', 'dateNaissance', 'telephone', 'numeroCNI', 'numeroPasseport', 'adresse', 'ville', 'quartier', 'province'],
  ['typeContrat', 'niveauExperience', 'dateEmbauche', 'superieurHierarchiqueId', 'salaireMensuel'],
  [],
  [],
]

interface UserCreateWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const UserCreateWizard = ({ isOpen, onClose, onSuccess }: UserCreateWizardProps) => {
  const { t } = useTranslation(['user', 'common'])
  const dispatch = useAppDispatch()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successWarning, setSuccessWarning] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [users, setUsers] = useState<{ id: number; prenom: string; nom: string }[]>([])
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([])
  const [selectedSpecIds, setSelectedSpecIds] = useState<number[]>([])
  const [salaryVisible, setSalaryVisible] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    roleApi.getActive().then(setRoles).catch(() => setRoles([]))
    departementApi.getActive().then(setDepartements).catch(() => setDepartements([]))
    specialiteApi.getActive().then(setSpecialites).catch(() => setSpecialites([]))
    userApi.getAll({ page: 0, size: 500, actif: true }).then((res) =>
      setUsers(res.content.map((u) => ({ id: u.id, prenom: u.prenom, nom: u.nom })))
    ).catch(() => setUsers([]))
  }, [isOpen])

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    watch,
    formState: { errors },
  } = useForm<WizardFormData>({ defaultValues: { nom: '', prenom: '', email: '' } })

  const values = watch()

  const handleClose = () => {
    setStep(1)
    setErrorMessage(null)
    setSuccessWarning(null)
    setSelectedRoleIds([])
    setSelectedDeptIds([])
    setSelectedSpecIds([])
    setSalaryVisible(false)
    reset()
    onClose()
  }

  const goNext = async () => {
    const fields = STEP_FIELDS[step - 1]
    if (fields.length > 0) {
      const ok = await trigger(fields)
      if (!ok) return
    }
    setStep((s) => Math.min(4, s + 1))
  }

  const onSubmit = async (data: WizardFormData) => {
    setIsLoading(true)
    setErrorMessage(null)
    const payload: UserCreateRequest = {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      sexe: data.sexe || undefined,
      telephone: data.telephone || undefined,
      dateNaissance: data.dateNaissance || undefined,
      adresse: data.adresse || undefined,
      ville: data.ville || undefined,
      quartier: data.quartier || undefined,
      province: data.province || undefined,
      numeroCNI: data.numeroCNI || undefined,
      numeroPasseport: data.numeroPasseport || undefined,
      dateEmbauche: data.dateEmbauche || undefined,
      salaireMensuel:
        data.salaireMensuel != null && !isNaN(Number(data.salaireMensuel)) ? Number(data.salaireMensuel) : undefined,
      typeContrat: data.typeContrat || undefined,
      niveauExperience: data.niveauExperience || undefined,
      superieurHierarchiqueId: data.superieurHierarchiqueId ? Number(data.superieurHierarchiqueId) : undefined,
      roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
      departementIds: selectedDeptIds.length > 0 ? selectedDeptIds : undefined,
      specialiteIds: selectedSpecIds.length > 0 ? selectedSpecIds : undefined,
    }
    try {
      const created = await dispatch(createUser(payload)).unwrap()
      if (created.welcomeEmailSent === false) {
        setSuccessWarning(t('user:form.welcomeEmailNotSent'))
      } else {
        handleClose()
        onSuccess()
      }
    } catch (err: unknown) {
      setErrorMessage(handleApiError(err))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleId = (setter: React.Dispatch<React.SetStateAction<number[]>>) => (id: number) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const superieur = users.find((u) => u.id === Number(values.superieurHierarchiqueId))
  const roleSummary = useMemo(
    () => roles.filter((r) => selectedRoleIds.includes(r.id)).map((r) => r.nom).join(' + '),
    [roles, selectedRoleIds]
  )
  const deptSummary = useMemo(
    () => departements.filter((d) => selectedDeptIds.includes(d.id)).map((d) => d.nom).join(', '),
    [departements, selectedDeptIds]
  )

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-gray-100'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  const steps = [
    { n: 1, label: t('user:org.wizard.step1'), sub: t('user:org.wizard.step1Sub') },
    { n: 2, label: t('user:org.wizard.step2'), sub: t('user:org.wizard.step2Sub') },
    { n: 3, label: t('user:org.wizard.step3'), sub: t('user:org.wizard.step3Sub') },
    { n: 4, label: t('user:org.wizard.step4'), sub: t('user:org.wizard.step4Sub') },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('user:org.wizard.title')}
      size="2xl"
      maxContentHeight="78vh"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
          {t('user:org.wizard.matriculeAuto')}
        </p>

        {/* Étapes */}
        <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 px-4 py-3 overflow-x-auto">
          {steps.map((s, i) => {
            const active = step === s.n
            const done = step > s.n
            return (
              <div key={s.n} className="flex items-center gap-2 flex-1 min-w-fit">
                <button
                  type="button"
                  onClick={() => { if (s.n < step) setStep(s.n) }}
                  className="flex items-center gap-2.5 text-left"
                >
                  <span
                    className={`w-8 h-8 min-w-8 rounded-full flex items-center justify-center text-sm font-extrabold ${
                      done
                        ? 'bg-green-600 text-white'
                        : active
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-300 dark:border-gray-500'
                    }`}
                  >
                    {done ? '✓' : s.n}
                  </span>
                  <span>
                    <span className={`block text-sm ${active ? 'font-extrabold text-gray-900 dark:text-gray-100' : 'font-semibold text-gray-500 dark:text-gray-400'}`}>
                      {s.label}
                    </span>
                    <span className="block text-[11px] text-gray-400">{s.sub}</span>
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <span className={`hidden sm:block flex-1 h-0.5 mx-2 ${done ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'}`} />
                )}
              </div>
            )
          })}
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}
        {successWarning && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-lg text-sm flex items-center justify-between gap-3">
            <span>{successWarning}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => { setSuccessWarning(null); handleClose(); onSuccess() }}>
              {t('common:close')}
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Étape 1 — Identité */}
          <div className={step === 1 ? 'flex flex-col gap-4' : 'hidden'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('user:form.nom')} error={errors.nom?.message} {...register('nom', { required: t('user:form.validation.nomRequired') })} />
              <Input label={t('user:form.prenom')} error={errors.prenom?.message} {...register('prenom', { required: t('user:form.validation.prenomRequired') })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>{t('user:form.sexe')}</label>
                <select {...register('sexe', { required: t('user:form.validation.sexeRequired') })} className={inputClass}>
                  <option value="">—</option>
                  {SEXE_VALUES.map((v) => (
                    <option key={v} value={v}>{t(`user:sexe.${v}`)}</option>
                  ))}
                </select>
                {errors.sexe && <p className="text-xs text-red-500 mt-1">{errors.sexe.message}</p>}
              </div>
              <Input label={t('user:form.dateNaissance')} type="date" {...register('dateNaissance')} />
              <Input label={t('user:form.telephone')} type="tel" {...register('telephone')} />
            </div>
            <Input
              label={t('user:form.email')}
              type="email"
              error={errors.email?.message}
              {...register('email', {
                required: t('user:form.validation.emailRequired'),
                pattern: { value: /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/, message: t('user:form.validation.emailInvalid') },
              })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('user:form.numeroCNI')} {...register('numeroCNI')} />
              <Input label={t('user:form.numeroPasseport')} {...register('numeroPasseport')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('user:form.adresse')} {...register('adresse')} />
              <Input label={t('user:form.ville')} {...register('ville')} />
              <Input label={t('user:form.quartier')} {...register('quartier')} />
              <Input label={t('user:form.province')} {...register('province')} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('user:form.passwordAutoGenerated')}</p>
          </div>

          {/* Étape 2 — RH */}
          <div className={step === 2 ? 'flex flex-col gap-4' : 'hidden'}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>{t('user:form.typeContrat')}</label>
                <select {...register('typeContrat')} className={inputClass}>
                  <option value="">—</option>
                  {TYPE_CONTRAT_VALUES.map((v) => (
                    <option key={v} value={v}>{t(`user:contractType.${v}`)}</option>
                  ))}
                </select>
              </div>
              <Input label={t('user:form.dateEmbauche')} type="date" {...register('dateEmbauche')} />
              <div>
                <label className={labelClass}>{t('user:form.niveauExperience')}</label>
                <select {...register('niveauExperience')} className={inputClass}>
                  <option value="">—</option>
                  {NIVEAU_EXPERIENCE_VALUES.map((v) => (
                    <option key={v} value={v}>{t(`user:experienceLevel.${v}`)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('user:form.superieurHierarchique')}</label>
              <select {...register('superieurHierarchiqueId')} className={inputClass}>
                <option value="">{t('user:form.none')}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                {t('user:form.salaireMensuel')}{' '}
                <span className="normal-case font-normal text-gray-400">{t('user:org.wizard.salarySensitive')}</span>
              </label>
              <div className="flex gap-2">
                {salaryVisible ? (
                  <input
                    type="number"
                    step="0.01"
                    className={`${inputClass} max-w-[240px]`}
                    {...register('salaireMensuel', { valueAsNumber: true })}
                  />
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={values.salaireMensuel != null && !isNaN(Number(values.salaireMensuel)) ? '••• •••' : '—'}
                    className={`${inputClass} max-w-[240px] bg-gray-100 dark:bg-gray-600 tracking-widest font-bold`}
                  />
                )}
                <Button type="button" variant="outline" onClick={() => setSalaryVisible((v) => !v)}>
                  {salaryVisible ? t('user:org.wizard.salaryHide') : t('user:org.wizard.salaryReveal')}
                </Button>
              </div>
            </div>
          </div>

          {/* Étape 3 — Rôles */}
          <div className={step === 3 ? 'flex flex-col gap-3' : 'hidden'}>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('user:org.wizard.rolesHint')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roles.length === 0 && <p className="text-sm text-gray-400 py-2">{t('user:form.noRoles')}</p>}
              {roles.map((role) => {
                const on = selectedRoleIds.includes(role.id)
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleId(setSelectedRoleIds)(role.id)}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
                      on
                        ? 'border-[#FF6B35] bg-[#FFF0E9] dark:bg-[#33241C]'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 min-w-5 rounded flex items-center justify-center text-xs font-extrabold text-white ${
                        on ? 'bg-[#FF6B35]' : 'border-2 border-gray-300 dark:border-gray-500'
                      }`}
                    >
                      {on ? '✓' : ''}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{role.nom}</span>
                      {role.description && (
                        <span className="block text-xs text-gray-400 mt-0.5 truncate">{role.description}</span>
                      )}
                    </span>
                    <span
                      className="shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 border"
                      style={{
                        color: NIVEAU_COLORS[role.niveau] ?? '#94A3B8',
                        borderColor: NIVEAU_COLORS[role.niveau] ?? '#94A3B8',
                      }}
                    >
                      {role.niveau}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Étape 4 — Affectations + résumé */}
          <div className={step === 4 ? 'flex flex-col gap-4' : 'hidden'}>
            <div>
              <label className={labelClass}>{t('user:org.wizard.departements')}</label>
              <div className="flex flex-wrap gap-2">
                {departements.length === 0 && <p className="text-sm text-gray-400">{t('user:org.dash.noData')}</p>}
                {departements.map((d) => {
                  const on = selectedDeptIds.includes(d.id)
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleId(setSelectedDeptIds)(d.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                        on
                          ? 'border-[#FF6B35] bg-[#FFF0E9] dark:bg-[#33241C] text-[#D94E1F] dark:text-[#FF8C61]'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {d.nom}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('user:org.wizard.specialites')}</label>
              <div className="flex flex-wrap gap-2">
                {specialites.length === 0 && <p className="text-sm text-gray-400">{t('user:org.dash.noData')}</p>}
                {specialites.map((s) => {
                  const on = selectedSpecIds.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleId(setSelectedSpecIds)(s.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                        on
                          ? 'border-[#2E5266] bg-[#EAF0F4] dark:bg-[#1B2C3C] text-[#2E5266] dark:text-[#9FBFD4]'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {s.nom}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Résumé */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-4">
              <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
                {t('user:org.wizard.summary')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                <div>{t('user:org.wizard.summaryName')} — <b className="text-gray-900 dark:text-gray-100">{values.prenom} {values.nom}</b></div>
                <div>{t('user:form.email').replace(' *', '')} — <b className="text-gray-900 dark:text-gray-100">{values.email || '—'}</b></div>
                <div>
                  {t('user:org.wizard.summaryContract')} —{' '}
                  <b className="text-gray-900 dark:text-gray-100">
                    {values.typeContrat ? t(`user:contractType.${values.typeContrat}`) : '—'}
                    {values.dateEmbauche ? ` · ${values.dateEmbauche}` : ''}
                  </b>
                </div>
                <div>{t('user:form.superieurHierarchique')} — <b className="text-gray-900 dark:text-gray-100">{superieur ? `${superieur.prenom} ${superieur.nom}` : '—'}</b></div>
                <div>{t('user:org.wizard.summaryRoles')} — <b className="text-gray-900 dark:text-gray-100">{roleSummary || t('user:org.wizard.summaryNone')}</b></div>
                <div>{t('user:org.wizard.departements')} — <b className="text-gray-900 dark:text-gray-100">{deptSummary || '—'}</b></div>
                <div className="sm:col-span-2">
                  {t('user:org.wizard.summaryStatus')} — <b className="text-green-600">{t('user:org.dash.status.actif')}</b> · {t('user:org.wizard.summaryInvite')}
                </div>
              </div>
            </div>
          </div>

          {/* Pied */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <span className="text-xs text-gray-400 mr-auto">{t('user:org.wizard.stepOf', { step, total: 4 })}</span>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                ← {t('user:org.wizard.prev')}
              </Button>
            )}
            {step < 4 ? (
              <Button type="button" variant="primary" onClick={goNext}>
                {t('user:org.wizard.next')} →
              </Button>
            ) : (
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {t('user:form.createUser')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  )
}
