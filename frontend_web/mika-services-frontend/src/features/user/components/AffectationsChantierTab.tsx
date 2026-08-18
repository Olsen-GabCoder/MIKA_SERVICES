import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { affectationUtilisateurApi } from '@/api/chantierApi'
import { roleProjetApi, type RoleProjet } from '@/api/organisationApi'
import { groupRolesByFamille, buildPosteRank } from '@/utils/rolesProjet'
import { userApi } from '@/api/userApi'
import { projetApi } from '@/api/projetApi'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { handleApiError } from '@/utils/errorHandler'
import type { AffectationUtilisateurResponse } from '@/types/chantier'
import type { ProjetSummary } from '@/types/projet'
import type { User } from '@/types'

const PALETTE = ['#FF6B35', '#2E5266', '#48B5A0', '#8B5CF6', '#17A2B8', '#F4A261', '#6BBF59', '#E63946']

const STATUT_COLORS: Record<string, string> = {
  PLANIFIEE: '#17A2B8',
  EN_COURS: '#6BBF59',
  TERMINEE: '#94A3B8',
  ANNULEE: '#E63946',
  SUSPENDUE: '#F4A261',
}

const CLOSED_PROJET_STATUTS = ['RECEPTION_PROVISOIRE', 'RECEPTION_DEFINITIVE']

const initials = (u: { prenom: string; nom: string }) =>
  `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase()

const today = () => new Date().toISOString().slice(0, 10)

/** Tronque les libellés trop longs : le menu natif d'un <select> s'élargit sinon bien au-delà du champ. */
const truncate = (s: string, max = 55) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s)

interface ModalState {
  userId?: number
  projetId?: number
  /** Affectation en cours de modification (utilisateur et projet verrouillés). */
  edit?: AffectationUtilisateurResponse
}

export const AffectationsChantierTab = () => {
  const { t } = useTranslation(['user'])
  const [affectations, setAffectations] = useState<AffectationUtilisateurResponse[]>([])
  const [projets, setProjets] = useState<ProjetSummary[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [rolesProjet, setRolesProjet] = useState<RoleProjet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Modal d'affectation
  const [modal, setModal] = useState<ModalState | null>(null)
  const [formUserId, setFormUserId] = useState('')
  const [formProjetId, setFormProjetId] = useState('')
  const [formPoste, setFormPoste] = useState('')
  const [formDateDebut, setFormDateDebut] = useState(today())
  const [formDateFin, setFormDateFin] = useState('')
  const [formObservations, setFormObservations] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vue détaillée d'un projet (équipe + historique)
  const [detailProjet, setDetailProjet] = useState<ProjetSummary | null>(null)
  const [detailAffs, setDetailAffs] = useState<AffectationUtilisateurResponse[] | null>(null)
  const [annulerTarget, setAnnulerTarget] = useState<AffectationUtilisateurResponse | null>(null)

  const load = () => {
    setIsLoading(true)
    Promise.all([
      affectationUtilisateurApi.getEnCours(),
      projetApi.findAll(0, 200).then((p) => p.content).catch(() => [] as ProjetSummary[]),
      userApi.getAll({ page: 0, size: 500, actif: true }).then((p) => p.content),
      roleProjetApi.getActive().catch(() => [] as RoleProjet[]),
    ])
      .then(([affs, prjs, usrs, roles]) => {
        setAffectations(affs)
        setProjets(
          prjs
            .filter((p) => !CLOSED_PROJET_STATUTS.includes(p.statut))
            .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))
        )
        setUsers(usrs.slice().sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr', { sensitivity: 'base' })))
        setRolesProjet(roles)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const affByProjet = useMemo(() => {
    const map = new Map<number, AffectationUtilisateurResponse[]>()
    for (const a of affectations) {
      const list = map.get(a.projetId) ?? []
      list.push(a)
      map.set(a.projetId, list)
    }
    return map
  }, [affectations])

  /** Chantiers affichés : ceux qui ont des affectations ouvertes, puis les autres chantiers actifs. */
  const projetCards = useMemo(() => {
    const withAff = projets.filter((p) => affByProjet.has(p.id))
    const knownIds = new Set(projets.map((p) => p.id))
    // Chantiers présents dans les affectations mais absents de la page projets (statut clos, pagination)
    const extra: ProjetSummary[] = []
    for (const [projetId, list] of affByProjet) {
      if (!knownIds.has(projetId)) {
        extra.push({ id: projetId, nom: list[0].projetNom } as ProjetSummary)
      }
    }
    return [...withAff, ...extra]
  }, [projets, affByProjet])

  /** Banc : utilisateurs actifs sans affectation ouverte. */
  const bench = useMemo(() => {
    const assigned = new Set(affectations.map((a) => a.user.id))
    return users.filter((u) => !assigned.has(u.id))
  }, [users, affectations])

  // Familles dans l'ordre hiérarchique (direction → support), rôles triés alphabétiquement (locale fr)
  const rolesByFamille = useMemo(() => groupRolesByFamille(rolesProjet), [rolesProjet])

  const openModal = (state: ModalState) => {
    setModal(state)
    setFormUserId(state.edit ? String(state.edit.user.id) : state.userId ? String(state.userId) : '')
    setFormProjetId(state.edit ? String(state.edit.projetId) : state.projetId ? String(state.projetId) : '')
    setFormPoste(state.edit?.poste ?? '')
    setFormDateDebut(state.edit?.dateDebut ?? today())
    setFormDateFin(state.edit?.dateFin ?? '')
    setFormObservations(state.edit?.observations ?? '')
    setFormError(null)
  }

  const handleSubmit = async () => {
    if (!formUserId || !formProjetId || !formPoste || !formDateDebut) {
      setFormError(t('user:org.affect.formRequired'))
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
          projetId: Number(formProjetId),
          poste: formPoste,
          dateDebut: formDateDebut,
          dateFin: formDateFin || undefined,
          observations: formObservations || undefined,
        })
      }
      setModal(null)
      load()
      refreshDetail()
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
      refreshDetail()
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
      refreshDetail()
    } catch (e) {
      setActionError(handleApiError(e))
    }
  }

  const openDetail = (projet: ProjetSummary) => {
    setDetailProjet(projet)
    setDetailAffs(null)
    affectationUtilisateurApi
      .getByProjet(projet.id)
      .then(setDetailAffs)
      .catch(() => setDetailAffs([]))
  }

  /** Recharge le contenu du modal détail s'il est ouvert (après une action). */
  const refreshDetail = () => {
    setDetailProjet((p) => {
      if (p) affectationUtilisateurApi.getByProjet(p.id).then(setDetailAffs).catch(() => undefined)
      return p
    })
  }

  /** Rang hiérarchique d'un poste (famille direction → support), inconnus en dernier. */
  const posteRank = useMemo(() => buildPosteRank(rolesByFamille), [rolesByFamille])

  const detailEquipe = useMemo(
    () =>
      (detailAffs ?? [])
        .filter((a) => a.statut === 'PLANIFIEE' || a.statut === 'EN_COURS')
        .sort(
          (a, b) =>
            (posteRank.get(a.poste.trim().toLowerCase()) ?? 999) -
            (posteRank.get(b.poste.trim().toLowerCase()) ?? 999)
        ),
    [detailAffs, posteRank]
  )

  const detailHistorique = useMemo(
    () =>
      (detailAffs ?? [])
        .filter((a) => a.statut === 'TERMINEE' || a.statut === 'ANNULEE')
        .sort((a, b) => b.dateDebut.localeCompare(a.dateDebut)),
    [detailAffs]
  )

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
        {t('user:org.dash.error')}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {actionError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
          {actionError}
        </div>
      )}

      {/* En-tête + action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-gray-900 dark:text-gray-100">
            {t('user:org.affect.title')}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('user:org.affect.subtitle')}
          </div>
        </div>
        <Button variant="primary" onClick={() => openModal({})}>
          + {t('user:org.affect.assign')}
        </Button>
      </div>

      {/* Cartes chantiers */}
      {projetCards.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            {t('user:org.affect.noAssignments')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projetCards.map((projet, idx) => {
            const color = PALETTE[idx % PALETTE.length]
            const list = affByProjet.get(projet.id) ?? []
            return (
              <div
                key={projet.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 border-t-4"
                style={{ borderTopColor: color }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => openDetail(projet)}
                      className="block w-full text-left text-base font-extrabold text-gray-900 dark:text-gray-100 truncate hover:text-[#FF6B35]"
                      title={t('user:org.affect.detail.open')}
                    >
                      {projet.nom}
                    </button>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {[projet.codeProjet, projet.ville, projet.clientNom].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModal({ projetId: projet.id })}
                    className="shrink-0 text-xs font-extrabold text-[#FF6B35] border border-[#FF6B35]/40 rounded-full px-2.5 py-1 hover:bg-[#FF6B35]/10"
                  >
                    + {t('user:org.affect.assignHere')}
                  </button>
                </div>

                {list.length === 0 ? (
                  <div className="mt-3 text-sm text-gray-400 italic">{t('user:org.affect.nobody')}</div>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    {list.map((a) => (
                      <div key={a.id} className="flex items-center gap-2.5">
                        <span
                          className="w-7 h-7 min-w-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white"
                          style={{ background: color }}
                        >
                          {initials(a.user)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {a.user.prenom} {a.user.nom}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {a.poste} · {a.dateDebut}
                            {a.dateFin ? ` → ${a.dateFin}` : ''}
                          </div>
                        </div>
                        <span
                          className="shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 border"
                          style={{ color: STATUT_COLORS[a.statut], borderColor: STATUT_COLORS[a.statut] }}
                        >
                          {t(`user:org.teamsTab.statut.${a.statut}`)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTerminer(a.id)}
                          className="shrink-0 text-xs font-bold text-gray-400 hover:text-[#E63946]"
                          title={t('user:org.affect.finish')}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Banc des non-affectés */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">
          {t('user:org.affect.bench', { count: bench.length })}
        </div>
        {bench.length === 0 ? (
          <p className="text-sm text-gray-400">{t('user:org.affect.benchEmpty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {bench.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => openModal({ userId: u.id })}
                className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-600 pl-1 pr-3 py-1 hover:border-[#FF6B35] hover:text-[#FF6B35] text-sm font-semibold text-gray-700 dark:text-gray-200"
                title={t('user:org.affect.assign')}
              >
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-extrabold text-gray-600 dark:text-gray-200">
                  {initials(u)}
                </span>
                {u.prenom} {u.nom}
                {u.specialites[0] && (
                  <span className="text-xs font-normal text-gray-400">· {u.specialites[0].nom}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-right">
        <Link to="/equipes" className="text-sm font-bold text-[#FF6B35] hover:underline">
          {t('user:org.teamsTab.manage')} →
        </Link>
      </div>

      {/* Modal d'affectation (création ou modification) */}
      <Modal
        isOpen={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.edit ? t('user:org.affect.editTitle') : t('user:org.affect.modalTitle')}
      >
        <div className="flex flex-col gap-3">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
              {formError}
            </div>
          )}

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('user:org.affect.user')} *
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
              {modal?.edit && !users.some((u) => u.id === modal.edit?.user.id) && (
                <option value={modal.edit.user.id}>
                  {modal.edit.user.prenom} {modal.edit.user.nom}
                </option>
              )}
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.prenom} {u.nom} ({u.matricule})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('user:org.affect.projet')} *
            <select
              value={formProjetId}
              disabled={modal?.edit !== undefined}
              onChange={(e) => setFormProjetId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-60"
            >
              <option value="">—</option>
              {modal?.edit && !projets.some((p) => p.id === modal.edit?.projetId) && (
                <option value={modal.edit.projetId}>{truncate(modal.edit.projetNom)}</option>
              )}
              {projets.map((p) => (
                <option key={p.id} value={p.id} title={p.nom}>
                  {truncate(p.nom)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('user:org.affect.poste')} *
            <select
              value={formPoste}
              onChange={(e) => setFormPoste(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">—</option>
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
              {t('user:org.affect.dateDebut')} *
              <input
                type="date"
                value={formDateDebut}
                onChange={(e) => setFormDateDebut(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {t('user:org.affect.dateFin')}
              <input
                type="date"
                value={formDateFin}
                onChange={(e) => setFormDateFin(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              />
            </label>
          </div>

          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('user:org.affect.observations')}
            <textarea
              value={formObservations}
              onChange={(e) => setFormObservations(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </label>

          <div className="flex justify-end gap-2 mt-1">
            <Button variant="secondary" onClick={() => setModal(null)}>
              {t('user:org.affect.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '…' : modal?.edit ? t('user:org.affect.detail.save') : t('user:org.affect.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal détail projet : équipe + historique */}
      <Modal
        isOpen={detailProjet !== null}
        onClose={() => setDetailProjet(null)}
        title={detailProjet?.nom ?? ''}
        size="2xl"
      >
        {detailAffs === null ? (
          <Loading />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="text-xs text-gray-400 -mt-2">
              {[detailProjet?.codeProjet, detailProjet?.ville, detailProjet?.clientNom].filter(Boolean).join(' · ')}
              {detailProjet?.statut ? ` · ${t(`user:org.teamsTab.statut.${detailProjet.statut}`, detailProjet.statut)}` : ''}
            </div>

            {/* Équipe en place */}
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                {t('user:org.affect.detail.team', { count: detailEquipe.length })}
              </div>
              {detailEquipe.length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('user:org.affect.nobody')}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {detailEquipe.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center gap-2.5 rounded-lg border border-gray-100 dark:border-gray-700 px-3 py-2"
                    >
                      <span className="w-7 h-7 min-w-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white bg-[#2E5266]">
                        {initials(a.user)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {a.user.prenom} {a.user.nom}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {a.poste} · {a.dateDebut}
                          {a.dateFin ? ` → ${a.dateFin}` : ''}
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-[11px] font-bold rounded-full px-2 py-0.5 border"
                        style={{ color: STATUT_COLORS[a.statut], borderColor: STATUT_COLORS[a.statut] }}
                      >
                        {t(`user:org.teamsTab.statut.${a.statut}`)}
                      </span>
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openModal({ edit: a })}
                          className="text-xs font-bold text-[#17A2B8] hover:underline"
                        >
                          {t('user:org.affect.detail.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTerminer(a.id)}
                          className="text-xs font-bold text-gray-400 hover:text-[#E63946]"
                        >
                          {t('user:org.affect.finish')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnnulerTarget(a)}
                          className="text-xs font-bold text-gray-400 hover:text-[#E63946]"
                        >
                          {t('user:org.affect.detail.annuler')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historique */}
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                {t('user:org.affect.detail.history', { count: detailHistorique.length })}
              </div>
              {detailHistorique.length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('user:org.affect.detail.historyEmpty')}</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {detailHistorique.map((a) => (
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

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => detailProjet && openModal({ projetId: detailProjet.id })}
                className="text-xs font-extrabold text-[#FF6B35] border border-[#FF6B35]/40 rounded-full px-2.5 py-1 hover:bg-[#FF6B35]/10"
              >
                + {t('user:org.affect.assignHere')}
              </button>
              <Button variant="secondary" onClick={() => setDetailProjet(null)}>
                {t('user:org.affect.detail.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation d'annulation d'une affectation */}
      <ConfirmDialog
        open={annulerTarget !== null}
        title={t('user:org.affect.detail.annulerTitle')}
        message={t('user:org.affect.detail.annulerMessage', {
          user: annulerTarget ? `${annulerTarget.user.prenom} ${annulerTarget.user.nom}` : '',
          poste: annulerTarget?.poste ?? '',
        })}
        variant="danger"
        confirmLabel={t('user:org.affect.detail.annuler')}
        onConfirm={handleAnnuler}
        onCancel={() => setAnnulerTarget(null)}
      />
    </div>
  )
}
