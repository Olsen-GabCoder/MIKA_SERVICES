import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { userApi } from '@/api/userApi'
import { Loading } from '@/components/ui/Loading'
import type { User } from '@/types'

const PALETTE = ['#FF6B35', '#2E5266', '#48B5A0', '#8B5CF6', '#17A2B8', '#F4A261', '#6BBF59', '#E63946']

interface OrgNode {
  user: User
  children: OrgNode[]
}

const initials = (u: { prenom: string; nom: string }) =>
  `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase()

const buildTree = (users: User[]): { roots: OrgNode[]; depth: number } => {
  const byId = new Map(users.map((u) => [u.id, u]))
  const childrenOf = new Map<number, User[]>()
  const roots: User[] = []
  for (const u of users) {
    const supId = u.superieurHierarchique?.id
    if (supId != null && byId.has(supId)) {
      const list = childrenOf.get(supId) ?? []
      list.push(u)
      childrenOf.set(supId, list)
    } else {
      roots.push(u)
    }
  }
  let maxDepth = 0
  const toNode = (u: User, level: number): OrgNode => {
    maxDepth = Math.max(maxDepth, level)
    const kids = (childrenOf.get(u.id) ?? []).slice().sort((a, b) => a.nom.localeCompare(b.nom))
    return { user: u, children: kids.map((c) => toNode(c, level + 1)) }
  }
  const sortedRoots = roots.slice().sort((a, b) => {
    // Racines avec subordonnés d'abord (vrais sommets de hiérarchie)
    const ca = childrenOf.get(a.id)?.length ?? 0
    const cb = childrenOf.get(b.id)?.length ?? 0
    return cb - ca || a.nom.localeCompare(b.nom)
  })
  return { roots: sortedRoots.map((r) => toNode(r, 1)), depth: maxDepth }
}

export const OrgChartTab = () => {
  const { t } = useTranslation(['user'])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    userApi
      .getAll({ page: 0, size: 500 })
      .then((res) => setUsers(res.content))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [])

  const deptColor = useMemo(() => {
    const names = Array.from(
      new Set(users.flatMap((u) => u.departements.map((d) => d.nom)))
    ).sort((a, b) => a.localeCompare(b))
    const map = new Map<string, string>()
    names.forEach((n, i) => map.set(n, PALETTE[i % PALETTE.length]))
    return map
  }, [users])

  const { roots, depth } = useMemo(() => buildTree(users), [users])

  const stats = useMemo(() => {
    const managers = new Map<number, number>()
    for (const u of users) {
      const supId = u.superieurHierarchique?.id
      if (supId != null) managers.set(supId, (managers.get(supId) ?? 0) + 1)
    }
    const spans = Array.from(managers.values())
    const avg = spans.length > 0 ? spans.reduce((a, b) => a + b, 0) / spans.length : 0
    return {
      avgSpan: avg.toLocaleString('fr-FR', { maximumFractionDigits: 1 }),
      noManager: users.filter((u) => !u.superieurHierarchique).length,
      inactive: users.filter((u) => !u.actif).length,
    }
  }, [users])

  const nodeCard = (node: OrgNode, big: boolean) => {
    const u = node.user
    const color = deptColor.get(u.departements[0]?.nom ?? '') ?? '#2E5266'
    const poste = u.roles[0]?.nom ?? u.departements[0]?.nom ?? '—'
    return (
      <div
        className={`flex items-center bg-white dark:bg-gray-800 border rounded-lg shadow-sm min-w-0 ${
          big
            ? 'gap-3 border-gray-300 dark:border-gray-500 px-4 py-3'
            : 'gap-2.5 border-gray-200 dark:border-gray-600 px-3 py-2 w-full'
        }`}
      >
        <span className="relative shrink-0">
          <span
            className={`rounded-full flex items-center justify-center font-extrabold text-white ${
              big ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
            }`}
            style={{ background: color }}
          >
            {initials(u)}
          </span>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 ${
              u.actif ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block truncate text-gray-900 dark:text-gray-100 ${big ? 'text-sm font-extrabold' : 'text-sm font-bold'}`}>
            {u.prenom} {u.nom}
          </span>
          <span className="block truncate text-xs text-gray-400">{poste}</span>
        </span>
        {node.children.length > 0 && (
          <span className="shrink-0 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5 whitespace-nowrap">
            {t('user:org.chart.subs', { count: node.children.length })}
          </span>
        )}
      </div>
    )
  }

  const renderSubtree = (node: OrgNode): React.ReactNode => (
    <div key={node.user.id} className="flex flex-col gap-1.5">
      {nodeCard(node, false)}
      {node.children.length > 0 && (
        <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-600 flex flex-col gap-1.5">
          {node.children.map(renderSubtree)}
        </div>
      )}
    </div>
  )

  if (isLoading) return <Loading />
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 text-sm">
        {t('user:org.dash.error')}
      </div>
    )
  }
  if (users.length === 0) {
    return <p className="text-sm text-gray-400 p-4">{t('user:org.dash.noData')}</p>
  }

  const statCards = [
    { label: t('user:org.chart.depth'), value: t('user:org.chart.levels', { count: depth }), sub: t('user:org.chart.depthSub') },
    { label: t('user:org.chart.avgSpan'), value: stats.avgSpan, sub: t('user:org.chart.avgSpanSub') },
    { label: t('user:org.chart.noManager'), value: String(stats.noManager), sub: t('user:org.chart.noManagerSub') },
    { label: t('user:org.chart.inactive'), value: String(stats.inactive), sub: t('user:org.chart.inactiveSub') },
  ]

  const mainRoot = roots[0]
  const otherRoots = roots.slice(1)

  return (
    <div className="flex flex-col gap-5">
      {/* Cartes stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{s.label}</div>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1.5">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Arbre */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100">{t('user:org.chart.title')}</h2>
        <p className="text-sm text-gray-400 mt-0.5 mb-5">{t('user:org.chart.subtitle')}</p>

        {mainRoot && (
          <>
            <div className="flex justify-center">{nodeCard(mainRoot, true)}</div>
            {mainRoot.children.length > 0 && (
              <>
                <div className="flex justify-center">
                  <div className="w-0.5 h-5 bg-gray-200 dark:bg-gray-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {mainRoot.children.map((branch) => (
                    <div
                      key={branch.user.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 p-3"
                    >
                      {renderSubtree(branch)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {otherRoots.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2.5">
              {t('user:org.chart.othersTitle')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {otherRoots.map((r) =>
                r.children.length > 0 ? (
                  <div
                    key={r.user.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 p-3"
                  >
                    {renderSubtree(r)}
                  </div>
                ) : (
                  <div key={r.user.id}>{nodeCard(r, false)}</div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
