import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { affectationUtilisateurApi } from '@/api/chantierApi'
import { roleProjetApi, type RoleProjet } from '@/api/organisationApi'
import { userApi } from '@/api/userApi'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { handleApiError } from '@/utils/errorHandler'
import { groupRolesByFamille, buildPosteRank } from '@/utils/rolesProjet'
import type { AffectationUtilisateurResponse } from '@/types/chantier'
import type { UserSummary } from '@/types'

const STATUT_COLORS: Record<string, string> = {
  PLANIFIEE: '#17A2B8',
  EN_COURS: '#6BBF59',
  TERMINEE: '#94A3B8',
  ANNULEE: '#E63946',
  SUSPENDUE: '#F4A261',
}

const initials = (u: { prenom: string; nom: string }) =>
  `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase()

const today = () => new Date().toISOString().slice(0, 10)

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'
const CARD_HEADER = 'px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-3 border-l-[5px] border-l-primary'
const CARD_TITLE = 'text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wide'

interface Props {
  projetId: number
  projetNom: string
  canManage: boolean
}

/** Section « Équipe du projet » : consultation pour tous, gestion pour le responsable du projet et les admins. */
export const ProjetEquipeSection = ({ projetId, projetNom, canManage }: Props) => {
  const { t } = useTranslation(['projet', 'user'])
  const [affectations, setAffectations] = useState<AffectationUtilisateurResponse[] | null>(null)
  const [error, setError] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Référentiels chargés à l'ouverture du modal seulement
  const [users, setUsers] = useState<UserSummary[] | null>(null)
  const [rolesProjet, setRolesProjet] = useState<RoleProjet[] | null>(null)

  // Modal d'affectation (création ou modification)
  const [modal, setModal] = useState<{ edit?: AffectationUtilisateurResponse } | null>(null)
  const [formUserId, setFormUserId] = useState('')
  const [formPoste, setFormPoste] = useState('')
  const [formDateDebut, setFormDateDebut] = useState(today())
  const [formDateFin, setFormDateFin] = useState('')
  const [formObservations, setFormObservations] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [annulerTarget, setAnnulerTarget] = useState<AffectationUtilisateurResponse | null>(null)

  const load = () => {
    affectationUtilisateurApi
      .getByProjet(projetId)
      .then((list) => {
        setAffectations(list)
        setError(false)
      })
      .catch(() => setError(true))
  }

  useEffect(load, [projetId])

  const rolesByFamille = useMemo(() => groupRolesByFamille(rolesProjet ?? []), [rolesProjet])
  const posteRank = useMemo(() => buildPosteRank(rolesByFamille), [rolesByFamille])

  const equipe = useMemo(
    () =>
      (affectations ?? [])
        .filter((a) => a.statut === 'PLANIFIEE' || a.statut === 'EN_COURS')
        .sort(
          (a, b) =>
            (posteRank.get(a.poste.trim().toLowerCase()) ?? 999) -
            (posteRank.get(b.poste.trim().toLowerCase()) ?? 999)
        ),
    [affectations, posteRank]
  )

  const historique = useMemo(
    () =>
      (affectations ?? [])
        .filter((a) => a.statut === 'TERMINEE' || a.statut === 'ANNULEE')
        .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut)),
    [affectations]
  )

  /** Charge les référentiels (utilisateurs + rôles) au premier besoin. */
  const ensureRefs = () => {
    if (users === null) {
      userApi.getAffectables().then(setUsers).catch(() => setUsers([]))
    }
    if (rolesProjet === null) {
      roleProjetApi.getActive().then(setRolesProjet).catch(() => setRolesProjet([]))
    }
  }

  const openModal = (edit?: AffectationUtilisateurResponse) => {
    ensureRefs()
    setModal({ edit })
    setFormUserId(edit ? String(edit.user.id) : '')
    setFormPoste(edit?.poste ?? '')
    setFormDateDebut(edit?.dateDebut ?? today())
    setFormDateFin(edit?.dateFin ?? '')
    setFormObservations(edit?.observations ?? '')
    setFormError(null)
  }

  const handleSubmit = async () => {
    if (!formUserId || !formPoste || !formDateDebut) {
      setFormError(t('projet:equipe.form.required'))
      return
    }
    setIsSubmitting(true)
    setFormError(null)
    try {
      if (modal?.edit) {
        await affectationUtilisateurApi.update(modal.edit.id, {
          poste: formPoste,
          dateDebut: formDateDebut,
          dateFin: formDateFin || undefined,
          observations: formObservations || undefined,
        })
      } else {
        await affectationUtilisateurApi.affecter({
          userId: Number(formUserId),
          projetId,
          poste: formPoste,
          dateDebut: formDateDebut,
          dateFin: formDateFin || undefined,
          observations: formObservations || undefined,
        })
      }
      setModal(null)
      load()
    } catch (e) {
      setFormError(handleApiError(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTerminer = async (id: number) => {
    setActionError(null)
    try {
      await affectationUtilisateurApi.terminer(id)
      load()
    } catch (e) {
      setActionError(handleApiError(e))
    }
  }

  const handleAnnuler = async () => {
    if (!annulerTarget) return
    setAnnulerTarget(null)
    setActionError(null)
    try {
      await affectationUtilisateurApi.annuler(annulerTarget.id)
      load()
    } catch (e) {
      setActionError(handleApiError(e))
    }
  }

  return (
    <div className={CARD}>
      <div className={CARD_HEADER}>
        <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3m-9 3a3 3 0 10-3-3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={CARD_TITLE}>{t('projet:equipe.title')}</h2>
            {affectations !== null && (
              <span className="text-[11px] font-extrabold text-primary bg-primary/10 dark:bg-primary/20 rounded-full px-2 py-0.5">
                {equipe.length}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('projet:equipe.subtitle')}</p>
        </div>
        {canManage && (
          <Button variant="primary" onClick={() => openModal()}>
            + {t('projet:equipe.assign')}
          </Button>
        )}
      </div>

      <div className="p-6 flex flex-col gap-4">
        {actionError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
            {actionError}
          </div>
        )}

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{t('projet:equipe.loadError')}</p>
        ) : affectations === null ? (
          <Loading />
        ) : equipe.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
            <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />
            </svg>
            <p className="text-sm text-gray-400">{t('projet:equipe.empty')}</p>
            {canManage && (
              <button
                type="button"
                onClick={() => openModal()}
                className="mt-3 text-xs font-extrabold text-primary border border-primary/40 rounded-full px-3 py-1.5 hover:bg-primary/10 transition-colors"
              >
                + {t('projet:equipe.assign')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equipe.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-700/30 p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 min-w-10 rounded-full flex items-center justify-center text-sm font-extrabold text-white bg-gradient-to-br from-[#2E5266] to-[#48B5A0] shadow-sm">
                    {initials(a.user)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {a.user.prenom} {a.user.nom}
                      </span>
                      <span
                        className="ml-auto shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 border"
                        style={{ color: STATUT_COLORS[a.statut], borderColor: STATUT_COLORS[a.statut] }}
                      >
                        {t(`user:org.teamsTab.statut.${a.statut}`)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-primary mt-0.5 truncate">{a.poste}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {a.dateDebut}
                      {a.dateFin ? ` → ${a.dateFin}` : ''}
                    </div>
                  </div>
                </div>
                {canManage && (
                  <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-gray-200/70 dark:border-gray-600/50">
                    <button
                      type="button"
                      onClick={() => openModal(a)}
                      className="text-xs font-bold text-[#17A2B8] hover:underline"
                    >
                      {t('projet:equipe.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTerminer(a.id)}
                      className="text-xs font-bold text-gray-400 hover:text-[#E63946]"
                    >
                      {t('projet:equipe.finish')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnulerTarget(a)}
                      className="text-xs font-bold text-gray-400 hover:text-[#E63946]"
                    >
                      {t('projet:equipe.cancelAssign')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Historique replié par défaut */}
        {historique.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="text-sm font-bold text-[#FF6B35] hover:underline"
            >
              {showHistory
                ? t('projet:equipe.hideHistory')
                : t('projet:equipe.history', { count: historique.length })}
            </button>
            {showHistory && (
              <div className="mt-2 flex flex-col gap-1.5">
                {historique.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 text-sm px-3 py-1.5">
                    <span
                      className="shrink-0 w-2 h-2 rounded-full"
                      style={{ background: STATUT_COLORS[a.statut] }}
                    />
                    <span className="font-semibold text-gray-600 dark:text-gray-300 truncate">
                      {a.user.prenom} {a.user.nom}
                    </span>
                    <span className="text-gray-400 truncate">
                      {a.poste} · {a.dateDebut}
                      {a.dateFin ? ` → ${a.dateFin}` : ''}
                    </span>
                    <span
                      className="ml-auto shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 border"
                      style={{ color: STATUT_COLORS[a.statut], borderColor: STATUT_COLORS[a.statut] }}
                    >
                      {t(`user:org.teamsTab.statut.${a.statut}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal d'affectation (création ou modification) */}
      <Modal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.edit ? t('projet:equipe.editTitle') : t('projet:equipe.assignTitle', { projet: projetNom })}
      >
        <div className="flex flex-col gap-3">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
              {formError}
            </div>
          )}

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('projet:equipe.form.user')} *
            <select
              value={formUserId}
              disabled={modal?.edit !== undefined}
              onChange={(e) => {
                setFormUserId(e.target.value)
                setFormPoste('')
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-60"
            >
              <option value="">—</option>
              {modal?.edit && !(users ?? []).some((u) => u.id === modal.edit?.user.id) && (
                <option value={modal.edit.user.id}>
                  {modal.edit.user.prenom} {modal.edit.user.nom}
                </option>
              )}
              {(users ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.prenom} {u.nom} ({u.matricule})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('projet:equipe.form.role')} *
            <select
              value={formPoste}
              onChange={(e) => setFormPoste(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">—</option>
              {modal?.edit && !(rolesProjet ?? []).some((r) => r.nom === modal.edit?.poste) && (
                <option value={modal.edit.poste}>{modal.edit.poste}</option>
              )}
              {[...rolesByFamille.entries()].map(([famille, roles]) => (
                <optgroup key={famille} label={t(`user:org.affect.famille.${famille}`)}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.nom}>
                      {r.nom}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t('projet:equipe.form.dateDebut')} *
              <input
                type="date"
                value={formDateDebut}
                onChange={(e) => setFormDateDebut(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t('projet:equipe.form.dateFin')}
              <input
                type="date"
                value={formDateFin}
                onChange={(e) => setFormDateFin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>
          </div>

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('projet:equipe.form.observations')}
            <textarea
              value={formObservations}
              onChange={(e) => setFormObservations(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </label>

          <div className="flex justify-end gap-2 mt-1">
            <Button variant="secondary" onClick={() => setModal(null)}>
              {t('projet:equipe.form.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '…' : modal?.edit ? t('projet:equipe.form.save') : t('projet:equipe.form.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation d'annulation d'une affectation */}
      <ConfirmDialog
        open={annulerTarget !== null}
        title={t('projet:equipe.cancelConfirmTitle')}
        message={t('projet:equipe.cancelConfirmMessage', {
          user: annulerTarget ? `${annulerTarget.user.prenom} ${annulerTarget.user.nom}` : '',
          poste: annulerTarget?.poste ?? '',
        })}
        variant="danger"
        confirmLabel={t('projet:equipe.cancelAssign')}
        onConfirm={handleAnnuler}
        onCancel={() => setAnnulerTarget(null)}
      />
    </div>
  )
}
