import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { roleApi, type Role, type Permission } from '@/api/roleApi'
import { userApi } from '@/api/userApi'
import { Loading } from '@/components/ui/Loading'

const NIVEAU_ORDER = ['DIRECTION', 'RESPONSABLE', 'SUPERVISEUR', 'TECHNICIEN', 'EMPLOYE']
const NIVEAU_COLORS: Record<string, string> = {
  DIRECTION: '#2E5266',
  RESPONSABLE: '#8B5CF6',
  SUPERVISEUR: '#17A2B8',
  TECHNICIEN: '#48B5A0',
  EMPLOYE: '#94A3B8',
}

type AccessLevel = 0 | 1 | 2 | 3 // — · Lecture · Gestion · Complet

const accessLevel = (perms: Permission[]): AccessLevel => {
  if (perms.length === 0) return 0
  const types = new Set(perms.map((p) => p.type))
  if (types.has('ADMIN')) return 3
  if (types.has('CREATE') || types.has('UPDATE') || types.has('DELETE') || types.has('VALIDATE')) return 2
  return 1
}

const LEVEL_STYLES: Record<AccessLevel, string> = {
  0: 'text-gray-300 dark:text-gray-600',
  1: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500',
  2: 'text-[#17A2B8] bg-[#E4F5F8] dark:bg-[#12333A] border border-[#17A2B8]',
  3: 'text-[#2F9E44] bg-[#EAF7EC] dark:bg-[#15301A] border border-[#2F9E44]',
}

export const RolesTab = () => {
  const { t } = useTranslation(['user'])
  const [roles, setRoles] = useState<Role[]>([])
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [compareId, setCompareId] = useState<number | ''>('')

  useEffect(() => {
    Promise.all([
      roleApi.getActive(),
      userApi.getStats().catch(() => null),
    ])
      .then(([rolesRes, stats]) => {
        setRoles(rolesRes)
        if (rolesRes.length > 0) setSelectedId((prev) => prev ?? rolesRes[0].id)
        if (stats) setCounts(new Map(stats.parRole.map((r) => [r.label, r.count])))
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [])

  const groups = useMemo(() => {
    const byNiveau = new Map<string, Role[]>()
    for (const r of roles) {
      const list = byNiveau.get(r.niveau) ?? []
      list.push(r)
      byNiveau.set(r.niveau, list)
    }
    const order = [...NIVEAU_ORDER, ...Array.from(byNiveau.keys()).filter((n) => !NIVEAU_ORDER.includes(n))]
    return order
      .filter((n) => byNiveau.has(n))
      .map((n) => ({ niveau: n, roles: (byNiveau.get(n) ?? []).slice().sort((a, b) => a.nom.localeCompare(b.nom)) }))
  }, [roles])

  const modules = useMemo(
    () => Array.from(new Set(roles.flatMap((r) => r.permissions.map((p) => p.module)))).sort((a, b) => a.localeCompare(b)),
    [roles]
  )

  const selected = roles.find((r) => r.id === selectedId) ?? null
  const compare = compareId !== '' && compareId !== selectedId ? roles.find((r) => r.id === compareId) ?? null : null

  const levelFor = (role: Role, module: string): AccessLevel =>
    accessLevel(role.permissions.filter((p) => p.module === module && p.actif))

  const levelLabel = (lv: AccessLevel) =>
    lv === 0 ? '—' : t(`user:org.rolesTab.level.${lv}`)

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
        {t('user:org.dash.error')}
      </div>
    )
  }
  if (roles.length === 0) {
    return <p className="text-sm text-gray-400 p-4">{t('user:org.dash.noData')}</p>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 items-start">
      {/* Colonne gauche : rôles groupés par niveau */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        {groups.map((g) => (
          <div key={g.niveau}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
              <span className="w-2 h-2 rounded-full" style={{ background: NIVEAU_COLORS[g.niveau] ?? '#94A3B8' }} />
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {g.niveau}
              </span>
            </div>
            {g.roles.map((r) => {
              const on = r.id === selectedId
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 text-left border-b border-gray-100 dark:border-gray-700 transition-colors ${
                    on
                      ? 'bg-[#2E5266] text-white'
                      : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="flex-1 min-w-0 truncate text-sm font-bold">{r.nom}</span>
                  <span
                    className={`shrink-0 text-[11px] font-extrabold rounded-full px-2 py-0.5 min-w-[24px] text-center ${
                      on ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {counts.get(r.nom) ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Détail du rôle sélectionné */}
      {selected && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">{selected.nom}</h2>
                <span
                  className="text-[11px] font-bold rounded-full px-2 py-0.5 border"
                  style={{
                    color: NIVEAU_COLORS[selected.niveau] ?? '#94A3B8',
                    borderColor: NIVEAU_COLORS[selected.niveau] ?? '#94A3B8',
                  }}
                >
                  {selected.niveau}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {selected.description || selected.code} · {t('user:org.rolesTab.userCount', { count: counts.get(selected.nom) ?? 0 })}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {t('user:org.rolesTab.compareWith')}
              <select
                value={compareId}
                onChange={(e) => setCompareId(e.target.value === '' ? '' : Number(e.target.value))}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">—</option>
                {roles
                  .filter((r) => r.id !== selected.id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
              </select>
            </label>
          </div>

          {/* Matrice */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-2.5 pr-3 text-xs font-extrabold uppercase tracking-wider text-gray-400">
                    {t('user:org.rolesTab.module')}
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-extrabold uppercase tracking-wider text-gray-400">
                    {selected.nom}
                  </th>
                  {compare && (
                    <th className="text-left py-2.5 px-3 text-xs font-extrabold uppercase tracking-wider text-gray-400">
                      {compare.nom}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => {
                  const lv = levelFor(selected, m)
                  const lvC = compare ? levelFor(compare, m) : null
                  return (
                    <tr key={m} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2.5 pr-3 font-bold text-gray-800 dark:text-gray-200">{m}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-block text-xs font-bold rounded-full px-2.5 py-1 ${LEVEL_STYLES[lv]}`}>
                          {levelLabel(lv)}
                        </span>
                      </td>
                      {lvC !== null && (
                        <td className="py-2 px-3">
                          <span className={`inline-block text-xs font-bold rounded-full px-2.5 py-1 ${LEVEL_STYLES[lvC]}`}>
                            {levelLabel(lvC)}
                          </span>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Légende */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-extrabold uppercase tracking-wider text-gray-400">{t('user:org.rolesTab.legend')}</span>
            {( [3, 2, 1] as AccessLevel[]).map((lv) => (
              <span key={lv} className="flex items-center gap-1.5">
                <span className={`inline-block text-[11px] font-bold rounded-full px-2 py-0.5 ${LEVEL_STYLES[lv]}`}>
                  {levelLabel(lv)}
                </span>
                {t(`user:org.rolesTab.legendSub.${lv}`)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
