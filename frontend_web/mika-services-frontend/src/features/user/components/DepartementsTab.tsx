import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { departementApi, specialiteApi } from '@/api/organisationApi'
import { userApi } from '@/api/userApi'
import { Loading } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { handleApiError } from '@/utils/errorHandler'
import type { Departement, Specialite, User } from '@/types'

const PALETTE = ['#FF6B35', '#2E5266', '#48B5A0', '#8B5CF6', '#17A2B8', '#F4A261', '#6BBF59', '#E63946']

const initials = (u: { prenom: string; nom: string }) =>
  `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase()

export const DepartementsTab = () => {
  const { t } = useTranslation(['user', 'common'])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [specialites, setSpecialites] = useState<Specialite[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [designateDept, setDesignateDept] = useState<Departement | null>(null)
  const [designateUserId, setDesignateUserId] = useState<number | ''>('')
  const [designateError, setDesignateError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const load = () => {
    Promise.all([
      departementApi.getActive(),
      specialiteApi.getActive(),
      userApi.getAll({ page: 0, size: 500 }).then((r) => r.content),
    ])
      .then(([depts, specs, u]) => {
        setDepartements(depts)
        setSpecialites(specs)
        setUsers(u)
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const deptColor = useMemo(() => {
    const map = new Map<number, string>()
    departements.forEach((d, i) => map.set(d.id, PALETTE[i % PALETTE.length]))
    return map
  }, [departements])

  const membersOf = (deptId: number) => users.filter((u) => u.departements.some((d) => d.id === deptId))
  const specCount = (specId: number) => users.filter((u) => u.specialites.some((s) => s.id === specId)).length

  const specGroups = useMemo(() => {
    const byCat = new Map<string, Specialite[]>()
    for (const s of specialites) {
      const list = byCat.get(s.categorie) ?? []
      list.push(s)
      byCat.set(s.categorie, list)
    }
    return Array.from(byCat.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cat, list]) => ({ cat, list: list.slice().sort((a, b) => a.nom.localeCompare(b.nom)) }))
  }, [specialites])

  const watchItems = useMemo(() => {
    const items: string[] = []
    for (const d of departements) {
      if (!d.responsable) items.push(t('user:org.deptTab.watchNoResp', { name: d.nom }))
    }
    for (const d of departements) {
      if (membersOf(d.id).length === 0) items.push(t('user:org.deptTab.watchEmpty', { name: d.nom }))
    }
    for (const s of specialites) {
      if (specCount(s.id) === 0) items.push(t('user:org.deptTab.watchNoSpec', { name: s.nom }))
    }
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departements, specialites, users, t])

  const openDesignate = (dept: Departement) => {
    setDesignateDept(dept)
    setDesignateUserId('')
    setDesignateError(null)
  }

  const submitDesignate = async () => {
    if (!designateDept || designateUserId === '') return
    setIsSaving(true)
    setDesignateError(null)
    try {
      await departementApi.setResponsable(designateDept.id, Number(designateUserId))
      setDesignateDept(null)
      load()
    } catch (err: unknown) {
      setDesignateError(handleApiError(err))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
        {t('user:org.dash.error')}
      </div>
    )
  }

  const totalUsers = users.length || 1

  return (
    <div className="flex flex-col gap-5">
      {/* Cartes départements */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departements.map((d) => {
          const members = membersOf(d.id)
          const actifs = members.filter((m) => m.actif).length
          const color = deptColor.get(d.id) ?? '#2E5266'
          return (
            <div
              key={d.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 border-t-4"
              style={{ borderTopColor: color }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-gray-900 dark:text-gray-100 truncate">{d.nom}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{d.type}</div>
                </div>
                <span
                  className="shrink-0 text-xs font-extrabold rounded-full px-2.5 py-1"
                  style={{ color, background: `${color}1A` }}
                >
                  {t('user:org.deptTab.members', { count: members.length })}
                </span>
              </div>

              {/* Responsable */}
              <div className="mt-3">
                {d.responsable ? (
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
                      style={{ background: color }}
                    >
                      {initials(d.responsable)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {d.responsable.prenom} {d.responsable.nom}
                      </span>
                      <span className="block text-xs text-gray-400">{t('user:org.deptTab.responsable')}</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-[#F4A261] bg-[#FDF3E7] dark:bg-[#3A2C18] px-3 py-2">
                    <span className="text-sm font-bold text-[#B4690E] dark:text-[#F4A261]">
                      {t('user:org.deptTab.noResponsable')}
                    </span>
                    <button
                      type="button"
                      onClick={() => openDesignate(d)}
                      className="shrink-0 text-xs font-bold text-[#B4690E] dark:text-[#F4A261] border border-[#F4A261] rounded-md px-2.5 py-1 hover:bg-[#F4A261]/10"
                    >
                      {t('user:org.deptTab.designate')}
                    </button>
                  </div>
                )}
              </div>

              {/* Barre de mix actifs / inactifs */}
              <div className="mt-3.5">
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex">
                  {members.length > 0 && (
                    <>
                      <div className="h-full bg-[#6BBF59]" style={{ width: `${(actifs / members.length) * 100}%` }} />
                      <div className="h-full bg-gray-300 dark:bg-gray-500" style={{ width: `${((members.length - actifs) / members.length) * 100}%` }} />
                    </>
                  )}
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                  <span>{t('user:org.deptTab.actifs', { count: actifs })}</span>
                  <span>{t('user:org.deptTab.share', { pct: Math.round((members.length / totalUsers) * 100) })}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Spécialités */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">{t('user:org.deptTab.specTitle')}</h2>
          <p className="text-sm text-gray-400 mt-0.5 mb-4">{t('user:org.deptTab.specSubtitle')}</p>
          {specialites.length === 0 && <p className="text-sm text-gray-400">{t('user:org.dash.noData')}</p>}
          <div className="flex flex-col gap-4">
            {specGroups.map((g) => (
              <div key={g.cat}>
                <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">{g.cat}</div>
                <div className="flex flex-wrap gap-2">
                  {g.list.map((s) => {
                    const count = specCount(s.id)
                    return (
                      <span
                        key={s.id}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
                          count > 0
                            ? 'border-[#2E5266] text-[#2E5266] dark:text-[#9FBFD4] bg-[#EAF0F4] dark:bg-[#1B2C3C] dark:border-[#9FBFD4]/40'
                            : 'border-gray-200 dark:border-gray-600 text-gray-400'
                        }`}
                      >
                        {s.nom}
                        <span
                          className={`text-[11px] font-extrabold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                            count > 0
                              ? 'bg-[#2E5266] text-white dark:bg-[#9FBFD4] dark:text-gray-900'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          }`}
                        >
                          {count}
                        </span>
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* À surveiller — hauteur calée sur la carte Spécialités (absolue dans sa colonne, liste scrollable) */}
        <div className="relative min-h-[200px]">
          <div className="lg:absolute lg:inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">{t('user:org.deptTab.watchTitle')}</h2>
            <p className="text-sm text-gray-400 mt-0.5 mb-3">{t('user:org.deptTab.watchSubtitle')}</p>
            {watchItems.length === 0 ? (
              <p className="text-sm font-semibold text-green-600">{t('user:org.deptTab.watchOk')}</p>
            ) : (
              <ul className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto pr-1">
                {watchItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 border-l-2 border-[#F4A261] pl-3 py-0.5 shrink-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modale Désigner un responsable */}
      <Modal
        isOpen={designateDept !== null}
        onClose={() => setDesignateDept(null)}
        title={t('user:org.deptTab.designateTitle', { name: designateDept?.nom ?? '' })}
        size="md"
      >
        <div className="flex flex-col gap-4">
          {designateError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 rounded-lg text-sm">
              {designateError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('user:org.deptTab.designateLabel')}
            </label>
            <select
              value={designateUserId}
              onChange={(e) => setDesignateUserId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">—</option>
              {users
                .filter((u) => u.actif)
                .slice()
                .sort((a, b) => {
                  const inDeptA = designateDept ? a.departements.some((d) => d.id === designateDept.id) : false
                  const inDeptB = designateDept ? b.departements.some((d) => d.id === designateDept.id) : false
                  return Number(inDeptB) - Number(inDeptA) || a.nom.localeCompare(b.nom)
                })
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom}
                    {designateDept && u.departements.some((d) => d.id === designateDept.id)
                      ? ` — ${designateDept.nom}`
                      : ''}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDesignateDept(null)}>
              {t('common:cancel')}
            </Button>
            <Button type="button" variant="primary" isLoading={isSaving} disabled={designateUserId === ''} onClick={submitDesignate}>
              {t('user:org.deptTab.designate')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
