import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  useDerniereMiseAJour,
  useBaremeArticles,
  useBaremeArticlesCompare,
  useBaremeFilterFacets,
} from '../hooks/useBaremeQueries'
import { useBaremeListParams } from '../hooks/useBaremeListParams'
import { buildCatalogSortParam, type BaremeCatalogSortField } from '../baremeCatalogSort'
import { BaremeFilters } from '../components/BaremeFilters'
import { TypeLigneBareme } from '../types'
import type { BaremeArticleCompare, BaremeArticleList } from '../types'
import { useFormatNumber } from '@/hooks/useFormatNumber'
import { normalizeUnit } from '../types'
import { useAppSelector } from '@/store/hooks'

// ─────────────────────────────────────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────────────────────────────────────

function baremeDisplayLibelle(row: { libelle?: string | null; reference?: string | null }): string {
  const a = (row.libelle ?? '').trim()
  if (a.length > 0) return a
  const b = (row.reference ?? '').trim()
  if (b.length > 0) return b
  return '—'
}

function baremeDisplayUnite(row: { unite?: string | null; unitePrestation?: string | null }): string {
  const a = (row.unite ?? '').trim()
  if (a.length > 0) return a
  const b = (row.unitePrestation ?? '').trim()
  if (b.length > 0) return b
  return '—'
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/60">
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-600/60 rounded-full w-44 animate-pulse" />
          <div className="h-2.5 bg-gray-100 dark:bg-gray-700/60 rounded-full w-24 animate-pulse" />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="h-6 bg-gray-100 dark:bg-gray-700/60 rounded-full w-10 animate-pulse" />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-600/60 rounded-full w-20 animate-pulse" />
        </td>
      ))}
      <td className="px-5 py-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-600/60 rounded-xl w-20 animate-pulse mx-auto" />
      </td>
    </tr>
  )
}

/** Skeleton pour la liste plate (7 colonnes données + actions), alignée feuille Excel */
function SkeletonRowFlat() {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700/60">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-600/60 rounded-full w-full max-w-[8rem] animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

function CatalogSortHeader({
  field,
  activeField,
  dir,
  onSort,
  label,
  sortTitle,
  align = 'left',
}: {
  field: BaremeCatalogSortField
  activeField: BaremeCatalogSortField
  dir: 'asc' | 'desc'
  onSort: (f: BaremeCatalogSortField) => void
  label: string
  sortTitle: string
  align?: 'left' | 'right'
}) {
  const active = activeField === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      title={sortTitle}
      aria-label={sortTitle}
      className={`inline-flex items-center gap-1 max-w-full min-w-0 group ${
        align === 'right' ? 'w-full justify-end text-right' : 'text-left'
      }`}
    >
      <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400 truncate">
        {label}
      </span>
      <span className="flex-shrink-0 text-primary dark:text-secondary-light" aria-hidden>
        {active ? (
          dir === 'asc' ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          )
        ) : (
          <svg
            className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )}
      </span>
    </button>
  )
}

function PriceBadge({
  value,
  isMin,
  isMax,
  isEstime,
  formatted,
}: {
  value: number | null
  isMin: boolean
  isMax: boolean
  isEstime: boolean
  formatted: string
}) {
  if (formatted === '—' || value == null) {
    return <span className="text-gray-300 dark:text-gray-600 text-sm font-medium">—</span>
  }

  if (isEstime) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10 border border-warning/25 text-warning dark:text-yellow-400 text-xs font-bold">
        <span className="w-1.5 h-1.5 rounded-full bg-warning dark:bg-yellow-400 flex-shrink-0" />
        {formatted}
        <span className="text-[10px] font-normal opacity-70">est.</span>
      </span>
    )
  }

  if (isMin) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/25 border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400 text-xs font-bold">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        {formatted}
      </span>
    )
  }

  if (isMax) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400 text-xs font-bold">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        {formatted}
      </span>
    )
  }

  return <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatted}</span>
}

function SupplierHeader({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-secondary/15 dark:bg-secondary/25 text-secondary dark:text-secondary-light text-[10px] font-bold flex items-center justify-center flex-shrink-0 border border-secondary/20">
        {initials || '?'}
      </div>
      <span className="truncate max-w-[100px]" title={name}>
        {name}
      </span>
    </div>
  )
}

function EmptyState({
  hasFilters,
  onReset,
  labelNoData,
  labelNoResults,
  hintNoData,
  hintNoResults,
  labelReset,
}: {
  hasFilters: boolean
  onReset: () => void
  labelNoData: string
  labelNoResults: string
  hintNoData: string
  hintNoResults: string
  labelReset: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center mb-5">
        {hasFilters ? (
          <svg className="w-9 h-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        ) : (
          <svg className="w-9 h-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
          </svg>
        )}
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">{hasFilters ? labelNoResults : labelNoData}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{hasFilters ? hintNoResults : hintNoData}</p>
      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors duration-200 shadow-sm shadow-primary/20"
        >
          {labelReset}
        </button>
      )}
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  size,
  onPageChange,
  onSizeChange,
  labelRange,
  labelPrev,
  labelNext,
}: {
  currentPage: number
  totalPages: number
  size: number
  onPageChange: (p: number) => void
  onSizeChange: (s: number) => void
  labelRange: string
  labelPrev: string
  labelNext: string
}) {
  const pages = useMemo(() => {
    const result: (number | '...')[] = []
    if (totalPages <= 0) return result
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) result.push(i)
    } else {
      result.push(0)
      if (currentPage > 2) result.push('...')
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        result.push(i)
      }
      if (currentPage < totalPages - 3) result.push('...')
      result.push(totalPages - 1)
    }
    return result
  }, [currentPage, totalPages])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm">
      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{labelRange}</p>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-600" />
        <select
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
        >
          {[10, 20, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {labelPrev}
        </button>

        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 text-xs">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150 ${
                  p === currentPage
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {(p as number) + 1}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          {labelNext}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function StatPill({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
      <span className="text-white/70 text-sm">{icon}</span>
      <div>
        <p className="text-[10px] text-white/60 font-medium leading-none">{label}</p>
        <p className="text-sm font-bold text-white leading-tight">{value}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const IconEye = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconClock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconGrid = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
)

const IconSuppliers = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export function BaremePage() {
  const { t } = useTranslation('bareme')
  const navigate = useNavigate()
  const currentUser = useAppSelector((state) => state.auth.user)
  const isAdmin = currentUser?.roles?.some((r) => r.code === 'ADMIN' || r.code === 'SUPER_ADMIN') ?? false
  const { formatMontant } = useFormatNumber()

  const {
    params,
    setPage,
    setSize,
    setRecherche,
    setArticle,
    setFournisseur,
    setUnite,
    setFamille,
    setCategorie,
    setCatalogSort,
    resetFilters,
  } = useBaremeListParams()

  /** Filtres API + facettes (sans tri catalogue). */
  const filterParams = useMemo(
    () => ({
      type: TypeLigneBareme.MATERIAU,
      article: params.article.trim() || undefined,
      fournisseurNom: params.fournisseur.trim() || undefined,
      unite: params.unite.trim() || undefined,
      famille: params.famille.trim() || undefined,
      categorie: params.categorie.trim() || undefined,
      recherche: params.recherche.trim() || undefined,
    }),
    [
      params.article,
      params.fournisseur,
      params.unite,
      params.famille,
      params.categorie,
      params.recherche,
    ]
  )

  /** Liste plate : tri synchronisé avec les en-têtes (Spring `sort=`). */
  const catalogListParams = useMemo(
    () => ({
      ...filterParams,
      sort: buildCatalogSortParam(params.sortField, params.sortDir),
    }),
    [filterParams, params.sortField, params.sortDir]
  )

  /** Recherche textuelle → vue comparatif (un groupe / article avec prix par fournisseur). Sinon → liste plate type Excel. */
  const compareMode = params.recherche.trim().length > 0

  const { data: facetsData, isLoading: loadingFacets } = useBaremeFilterFacets(filterParams)
  const { data: version, isLoading: loadingVersion } = useDerniereMiseAJour()
  const catalogQuery = useBaremeArticles(catalogListParams, params.page, params.size, { enabled: !compareMode })
  const compareQuery = useBaremeArticlesCompare(filterParams, params.page, params.size, { enabled: compareMode })

  const pageData = compareMode ? compareQuery.data : catalogQuery.data
  const isLoading = compareMode ? compareQuery.isLoading : catalogQuery.isLoading
  const isError = compareMode ? compareQuery.isError : catalogQuery.isError

  const content = pageData?.content ?? []

  const prevCompareModeRef = useRef<boolean | null>(null)
  useEffect(() => {
    if (prevCompareModeRef.current !== null && prevCompareModeRef.current !== compareMode) {
      setPage(0)
    }
    prevCompareModeRef.current = compareMode
  }, [compareMode, setPage])
  const totalElements = pageData?.totalElements ?? 0
  const totalPages = pageData?.totalPages ?? 0
  const currentPage = pageData?.number ?? params.page

  const hasActiveFilters =
    params.recherche.trim() !== '' ||
    params.article.trim() !== '' ||
    params.fournisseur.trim() !== '' ||
    params.unite.trim() !== '' ||
    params.famille.trim() !== '' ||
    params.categorie.trim() !== ''

  const filterOptions = useMemo(() => {
    if (!facetsData) {
      return {
        articles: [] as string[],
        fournisseurs: [] as string[],
        unites: [] as string[],
        familles: [] as string[],
        categories: [] as string[],
      }
    }
    const articleSet = new Set<string>()
    for (const a of facetsData.articles) {
      const n = (a ?? '').trim()
      if (n) articleSet.add(n)
    }
    const fournisseurSet = new Set<string>()
    for (const f of facetsData.fournisseurs) {
      const n = (f ?? '').trim()
      if (n) fournisseurSet.add(n)
    }
    const uniteSet = new Set<string>()
    for (const u of facetsData.unites) {
      const n = normalizeUnit(u)
      if (n) uniteSet.add(n)
    }
    return {
      categories: [...facetsData.categories].sort((a, b) => a.localeCompare(b, 'fr')),
      familles: [...facetsData.familles].sort((a, b) => a.localeCompare(b, 'fr')),
      unites: Array.from(uniteSet).sort((a, b) => a.localeCompare(b, 'fr')),
      fournisseurs: Array.from(fournisseurSet).sort((a, b) => a.localeCompare(b, 'fr')),
      articles: Array.from(articleSet).sort((a, b) => a.localeCompare(b, 'fr')),
    }
  }, [facetsData])

  useEffect(() => {
    if (loadingFacets || !facetsData) return
    if (params.article && !filterOptions.articles.includes(params.article)) setArticle('')
    if (params.fournisseur && !filterOptions.fournisseurs.includes(params.fournisseur)) setFournisseur('')
    if (params.unite && !filterOptions.unites.includes(params.unite)) setUnite('')
    if (params.famille && !filterOptions.familles.includes(params.famille)) setFamille('')
    if (params.categorie && !filterOptions.categories.includes(params.categorie)) setCategorie('')
  }, [
    loadingFacets,
    facetsData,
    filterOptions.articles,
    filterOptions.fournisseurs,
    filterOptions.unites,
    filterOptions.familles,
    filterOptions.categories,
    params.article,
    params.fournisseur,
    params.unite,
    params.famille,
    params.categorie,
    setArticle,
    setFournisseur,
    setUnite,
    setFamille,
    setCategorie,
  ])

  const normFournisseur = (s: string | null | undefined) => (s?.trim() || '—').toLowerCase()

  const getCompareValue = (row: (typeof content)[0]): number | null => {
    if (row.type === TypeLigneBareme.MATERIAU) {
      const r = row as BaremeArticleCompare
      const firstPrix = r.prixParFournisseur?.find((pf) => pf.prixTtc != null)
      return firstPrix?.prixTtc != null ? Number(firstPrix.prixTtc) : null
    }
    const v = row.debourse ?? row.prixVente
    return v != null ? Number(v) : null
  }

  const groupsByArticle = useMemo((): Array<{
    libelle: string
    unit: string
    rows: (typeof content)[0][]
    isCompare: boolean
  }> => {
    if (!compareMode || content.length === 0) return []
    const compareContent = content as BaremeArticleCompare[]
    return compareContent.map((row) => ({
      libelle: baremeDisplayLibelle(row),
      unit: baremeDisplayUnite(row),
      rows: [row as (typeof content)[0]],
      isCompare: true,
    }))
  }, [compareMode, content])

  const supplierColumnNames = useMemo((): string[] => {
    if (!compareMode || groupsByArticle.length === 0) return []
    const seen = new Set<string>()
    const order: string[] = []
    for (const group of groupsByArticle) {
      const first = group.rows[0]
      if (first && 'prixParFournisseur' in first && Array.isArray(first.prixParFournisseur)) {
        for (const pf of first.prixParFournisseur) {
          const name = pf.fournisseurNom?.trim() || '—'
          const key = normFournisseur(name)
          if (!seen.has(key)) {
            seen.add(key)
            order.push(name)
          }
        }
      }
    }
    return order.length > 0 ? order : ['—']
  }, [compareMode, groupsByArticle])

  const openDetail = (id: number) => {
    navigate(`/bareme/articles/${id}`, { state: { fromListParams: params } })
  }

  const lastUpdateText = loadingVersion
    ? t('loadingVersion')
    : version?.derniereMiseAJour
      ? t('lastUpdate', {
          date: new Date(version.derniereMiseAJour).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        })
      : t('noImportYet')

  const paginationRangeLabel = t('list.paginationRange', {
    from: totalElements === 0 ? 0 : currentPage * params.size + 1,
    to: Math.min((currentPage + 1) * params.size, totalElements),
    total: totalElements,
  })

  return (
    <PageContainer size="full" className="h-full flex flex-col min-h-0 bg-gray-50/80 dark:bg-gray-900/80">
      <div className="shrink-0 mb-6">
        <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 px-6 py-7 md:py-9">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0 backdrop-blur-sm">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                    />
                  </svg>
                </div>

                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">{t('title')}</h1>
                  <p className="text-white/75 text-sm font-medium mt-1">{t('subtitle')}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${version?.derniereMiseAJour ? 'bg-green-400' : 'bg-amber-300'} animate-pulse`}
                    />
                    <p className={`text-xs font-medium ${version?.derniereMiseAJour ? 'text-white/70' : 'text-amber-200'}`}>
                      {lastUpdateText}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex flex-wrap gap-2 justify-end">
                  {totalElements > 0 && (
                    <StatPill label={t('list.totalArticles')} value={totalElements.toLocaleString('fr-FR')} icon={<IconGrid />} />
                  )}
                  {content.length > 0 &&
                    (compareMode
                      ? supplierColumnNames.length > 0 ? (
                          <StatPill label={t('list.suppliers')} value={supplierColumnNames.length} icon={<IconSuppliers />} />
                        ) : null
                      : filterOptions.fournisseurs.length > 0 ? (
                          <StatPill
                            label={t('list.suppliersInBase')}
                            value={filterOptions.fournisseurs.length}
                            icon={<IconSuppliers />}
                          />
                        ) : null)}
                  {totalPages > 1 && (
                    <StatPill
                      label={t('list.statPagination')}
                      value={`${currentPage + 1}/${totalPages}`}
                      icon={<IconClock />}
                    />
                  )}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => navigate('/bareme/articles/nouveau')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/10"
                  >
                    <IconPlus />
                    {t('create.addArticle')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-5">
        <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                  />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t('list.filters')}</p>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">{t('list.active')}</span>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-primary dark:text-primary-light hover:text-primary-dark transition-colors duration-150 shrink-0"
              >
                {t('list.reset')} ×
              </button>
            )}
          </div>
          <div className="p-5">
            <BaremeFilters
              recherche={params.recherche}
              article={params.article}
              fournisseur={params.fournisseur}
              unite={params.unite}
              famille={params.famille}
              categorie={params.categorie}
              articleOptions={filterOptions.articles}
              fournisseurOptions={filterOptions.fournisseurs}
              uniteOptions={filterOptions.unites}
              familleOptions={filterOptions.familles}
              categorieOptions={filterOptions.categories}
              onRechercheChange={setRecherche}
              onArticleChange={setArticle}
              onFournisseurChange={setFournisseur}
              onUniteChange={setUnite}
              onFamilleChange={setFamille}
              onCategorieChange={setCategorie}
              onReset={resetFilters}
            />
          </div>
        </div>

        {isError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 px-5 py-4 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">{t('list.errorTitle')}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{t('list.errorLoad')}</p>
            </div>
          </div>
        )}

        {!isError && (
          <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-7 h-7 rounded-lg bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary-light flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125H9.375m3.75-3.75h-3.75"
                    />
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {compareMode ? t('list.tableTitle') : t('list.tableTitleCatalog')}
                </p>
                {!isLoading && content.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold">
                    {totalElements}
                  </span>
                )}
              </div>

              {compareMode && !isLoading && content.length > 0 && (
                <div className="hidden sm:flex items-center gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-green-50 dark:bg-green-900/25 border border-green-200 dark:border-green-700/50 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">{t('list.legendMin')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-red-50 dark:bg-red-900/25 border border-red-200 dark:border-red-700/50 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">{t('list.legendMax')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-warning/10 border border-warning/25 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">{t('list.legendEstimated')}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              {compareMode ? (
              <table className="w-full" role="table">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                    <th
                      scope="col"
                      className="px-5 py-3.5 text-left whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60 sticky left-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm"
                    >
                      <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                        {t('list.colArticle')}
                      </span>
                    </th>

                    <th
                      scope="col"
                      className="px-4 py-3.5 text-left whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60"
                    >
                      <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                        {t('list.colUnite')}
                      </span>
                    </th>

                    {(isLoading ? Array.from({ length: 3 }) : supplierColumnNames).map((name, i) => (
                      <th
                        key={typeof name === 'string' ? name : `sk-${i}`}
                        scope="col"
                        className="px-4 py-3.5 text-left border-b border-l border-gray-100 dark:border-gray-700/60 min-w-[130px]"
                      >
                        {isLoading ? (
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full w-20 animate-pulse" />
                        ) : (
                          <SupplierHeader name={name as string} />
                        )}
                      </th>
                    ))}

                    <th
                      scope="col"
                      className="px-5 py-3.5 text-center whitespace-nowrap border-b border-l border-gray-100 dark:border-gray-700/60 w-28"
                    >
                      <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                        {t('list.actions')}
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {isLoading &&
                    Array.from({ length: 8 }).map((_, i) => (
                      <SkeletonRow key={i} cols={3} />
                    ))}

                  {!isLoading &&
                    groupsByArticle.map((group, rowIndex) => {
                      const first = group.rows[0]
                      const isCompareRow =
                        group.isCompare &&
                        first &&
                        'prixParFournisseur' in first &&
                        Array.isArray(first.prixParFournisseur)

                      const prixParFournisseur = isCompareRow ? (first as BaremeArticleCompare).prixParFournisseur : []

                      const prixParFournisseurByKey = new Map(prixParFournisseur.map((p) => [normFournisseur(p.fournisseurNom), p]))

                      const values = isCompareRow
                        ? prixParFournisseur.map((pf) => (pf.prixTtc != null ? Number(pf.prixTtc) : null)).filter((v): v is number => v != null)
                        : group.rows.map(getCompareValue).filter((v): v is number => v != null)

                      const minVal = values.length > 0 ? Math.min(...values) : null
                      const maxVal = values.length > 0 ? Math.max(...values) : null

                      const rowBySupplier = new Map<string, (typeof group.rows)[0]>()
                      if (!isCompareRow) {
                        for (const row of group.rows) {
                          const name = (row as { fournisseurNom?: string }).fournisseurNom?.trim() || '—'
                          rowBySupplier.set(name, row)
                        }
                      }

                      const firstRowId = first?.id
                      const isPrestation = first && (first as { type?: string }).type !== TypeLigneBareme.MATERIAU

                      return (
                        <tr
                          key={firstRowId != null ? `bareme-${firstRowId}` : `bareme-row-${rowIndex}`}
                          className="group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors duration-150"
                        >
                          <td className="px-5 py-4 align-middle sticky left-0 z-10 bg-white dark:bg-gray-800/95 group-hover:bg-primary/[0.02] dark:group-hover:bg-gray-800/95 backdrop-blur-sm transition-colors duration-150">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                                  isPrestation ? 'bg-secondary dark:bg-secondary-light' : 'bg-primary dark:bg-primary-light'
                                }`}
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">{group.libelle}</p>
                                <span
                                  className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                                    isPrestation
                                      ? 'bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary-light'
                                      : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light'
                                  }`}
                                >
                                  {isPrestation ? t('list.typePrestation') : t('list.typeMateriau')}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 align-middle">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 text-xs font-bold font-mono">
                              {group.unit}
                            </span>
                          </td>

                          {supplierColumnNames.map((supplierName, colIndex) => {
                            if (isCompareRow) {
                              if (isPrestation) {
                                const prestationDebourse = (first as { debourse?: number }).debourse
                                const prestationPrixVente = (first as { prixVente?: number }).prixVente
                                const isEstime = (first as { prixEstime?: boolean }).prixEstime === true

                                if (colIndex === 0) {
                                  const dStr = prestationDebourse != null ? formatMontant(Number(prestationDebourse)) : '—'
                                  const pvStr = prestationPrixVente != null ? formatMontant(Number(prestationPrixVente)) : '—'
                                  const hasData = prestationDebourse != null || prestationPrixVente != null

                                  return (
                                    <td
                                      key={supplierName}
                                      colSpan={supplierColumnNames.length}
                                      className="px-4 py-4 align-middle border-l border-gray-100 dark:border-gray-700/40"
                                    >
                                      <button
                                        type="button"
                                        className="text-left focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg"
                                        onClick={() => firstRowId != null && openDetail(firstRowId)}
                                      >
                                        {hasData ? (
                                          <div className="flex items-center gap-2">
                                            <div className={`flex flex-col ${isEstime ? 'opacity-80' : ''}`}>
                                              <span className="text-xs text-gray-400 dark:text-gray-500 leading-none mb-0.5">
                                                {t('detail.debourse')} / {t('detail.prixVente')}
                                              </span>
                                              <span
                                                className={`text-sm font-bold ${isEstime ? 'text-warning dark:text-yellow-400' : 'text-gray-800 dark:text-gray-200'}`}
                                              >
                                                {dStr} / {pvStr}
                                              </span>
                                            </div>
                                            {isEstime && (
                                              <span className="px-1.5 py-0.5 rounded bg-warning/10 border border-warning/25 text-warning text-[9px] font-bold">
                                                est.
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                                        )}
                                      </button>
                                    </td>
                                  )
                                }
                                return null
                              }

                              const pf = prixParFournisseurByKey.get(normFournisseur(supplierName))
                              const val = pf?.prixTtc != null ? Number(pf.prixTtc) : null
                              const isMin = val != null && minVal != null && val === minVal
                              const isMax = val != null && maxVal != null && val === maxVal && minVal !== maxVal
                              const isEstime = pf?.prixEstime === true
                              const priceStr = pf != null && val != null ? formatMontant(val) : '—'

                              return (
                                <td key={supplierName} className="px-4 py-4 align-middle border-l border-gray-100 dark:border-gray-700/40">
                                  <button
                                    type="button"
                                    className="text-left focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg w-full"
                                    onClick={() => firstRowId != null && openDetail(firstRowId)}
                                  >
                                    <PriceBadge
                                      value={val}
                                      isMin={isMin}
                                      isMax={isMax}
                                      isEstime={isEstime}
                                      formatted={priceStr}
                                    />
                                  </button>
                                </td>
                              )
                            }

                            const row = rowBySupplier.get(supplierName)
                            if (!row) {
                              return (
                                <td key={supplierName} className="px-4 py-4 align-middle border-l border-gray-100 dark:border-gray-700/40">
                                  <span className="text-gray-300 dark:text-gray-600 text-sm">—</span>
                                </td>
                              )
                            }
                            const val = getCompareValue(row)
                            const isMin = val != null && minVal != null && val === minVal
                            const isMax = val != null && maxVal != null && val === maxVal && minVal !== maxVal
                            const isEstime = (row as { prixEstime?: boolean }).prixEstime === true
                            const formattedVal = (() => {
                              if (row.type === TypeLigneBareme.MATERIAU) {
                                return val != null ? formatMontant(val) : '—'
                              }
                              const d = row.debourse != null ? Number(row.debourse) : null
                              const pv = row.prixVente != null ? Number(row.prixVente) : null
                              if (d == null && pv == null) return '—'
                              return `${d != null ? formatMontant(d) : '—'} / ${pv != null ? formatMontant(pv) : '—'}`
                            })()

                            return (
                              <td key={supplierName} className="px-4 py-4 align-middle border-l border-gray-100 dark:border-gray-700/40">
                                <button
                                  type="button"
                                  className="text-left focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg w-full"
                                  onClick={() => openDetail(row.id)}
                                >
                                  <PriceBadge value={val} isMin={isMin} isMax={isMax} isEstime={isEstime} formatted={formattedVal} />
                                </button>
                              </td>
                            )
                          })}

                          <td className="px-5 py-4 text-center align-middle border-l border-gray-100 dark:border-gray-700/40">
                            {firstRowId != null && (
                              <button
                                type="button"
                                onClick={() => openDetail(firstRowId)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/15 hover:bg-primary/15 dark:hover:bg-primary/25 text-primary dark:text-primary-light text-xs font-bold border border-primary/15 hover:border-primary/30 transition-all duration-150 group/btn"
                              >
                                <IconEye />
                                <span className="hidden sm:inline">{t('list.viewDetail')}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
              ) : (
              <table className="w-full min-w-[1100px]" role="table">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60 sticky left-0 z-10 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-sm min-w-[7rem]"
                    >
                      <CatalogSortHeader
                        field="reference"
                        activeField={params.sortField}
                        dir={params.sortDir}
                        onSort={setCatalogSort}
                        label={t('list.colReference')}
                        sortTitle={t('list.sortByColumn', { column: t('list.colReference') })}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60 min-w-[8rem]"
                    >
                      <CatalogSortHeader
                        field="fournisseur"
                        activeField={params.sortField}
                        dir={params.sortDir}
                        onSort={setCatalogSort}
                        label={t('list.colFournisseur')}
                        sortTitle={t('list.sortByColumn', { column: t('list.colFournisseur') })}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60 min-w-[6rem]"
                    >
                      <CatalogSortHeader
                        field="categorie"
                        activeField={params.sortField}
                        dir={params.sortDir}
                        onSort={setCatalogSort}
                        label={t('list.categorie')}
                        sortTitle={t('list.sortByColumn', { column: t('list.categorie') })}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60 min-w-[6rem]"
                    >
                      <CatalogSortHeader
                        field="famille"
                        activeField={params.sortField}
                        dir={params.sortDir}
                        onSort={setCatalogSort}
                        label={t('list.corpsEtat')}
                        sortTitle={t('list.sortByColumn', { column: t('list.corpsEtat') })}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left border-b border-gray-100 dark:border-gray-700/60 min-w-[12rem]"
                    >
                      <CatalogSortHeader
                        field="libelle"
                        activeField={params.sortField}
                        dir={params.sortDir}
                        onSort={setCatalogSort}
                        label={t('list.colDesignation')}
                        sortTitle={t('list.sortByColumn', { column: t('list.colDesignation') })}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60 min-w-[4rem]"
                    >
                      <CatalogSortHeader
                        field="unite"
                        activeField={params.sortField}
                        dir={params.sortDir}
                        onSort={setCatalogSort}
                        label={t('list.colUnite')}
                        sortTitle={t('list.sortByColumn', { column: t('list.colUnite') })}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60 min-w-[7rem]"
                    >
                      <CatalogSortHeader
                        field="prixTtc"
                        activeField={params.sortField}
                        dir={params.sortDir}
                        onSort={setCatalogSort}
                        label={t('list.colPrixUnitaire')}
                        sortTitle={t('list.sortByColumn', { column: t('list.colPrixUnitaire') })}
                        align="right"
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-center whitespace-nowrap border-b border-gray-100 dark:border-gray-700/60 w-24"
                    >
                      <span className="text-[10px] font-black tracking-widest uppercase text-gray-500 dark:text-gray-400">
                        {t('list.actions')}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/40">
                  {isLoading &&
                    Array.from({ length: 10 }).map((_, i) => <SkeletonRowFlat key={i} />)}
                  {!isLoading &&
                    (content as BaremeArticleList[]).map((row) => {
                      const pu = row.prixTtc != null ? Number(row.prixTtc) : null
                      const priceStr = pu != null ? formatMontant(pu) : '—'
                      return (
                        <tr
                          key={row.id}
                          className="group hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors duration-150"
                        >
                          <td className="px-3 py-3 align-middle sticky left-0 z-10 bg-white dark:bg-gray-800/95 group-hover:bg-primary/[0.02] dark:group-hover:bg-gray-800/95 font-mono text-xs text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700/40">
                            {row.reference ?? '—'}
                          </td>
                          <td className="px-3 py-3 align-middle text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700/40 max-w-[14rem] truncate" title={row.fournisseurNom ?? undefined}>
                            {row.fournisseurNom ?? '—'}
                          </td>
                          <td className="px-3 py-3 align-middle text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700/40 max-w-[10rem] truncate">
                            {row.categorie ?? '—'}
                          </td>
                          <td className="px-3 py-3 align-middle text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700/40 max-w-[10rem] truncate">
                            {row.famille ?? '—'}
                          </td>
                          <td className="px-3 py-3 align-middle text-sm font-medium text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700/40">
                            {row.libelle ?? '—'}
                          </td>
                          <td className="px-3 py-3 align-middle border-b border-gray-100 dark:border-gray-700/40">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 text-xs font-bold font-mono">
                              {normalizeUnit(row.unite ?? '') || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-3 align-middle text-right border-b border-gray-100 dark:border-gray-700/40">
                            {pu != null ? (
                              <PriceBadge
                                value={pu}
                                isMin={false}
                                isMax={false}
                                isEstime={row.prixEstime === true}
                                formatted={priceStr}
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center align-middle border-b border-gray-100 dark:border-gray-700/40">
                            <button
                              type="button"
                              onClick={() => openDetail(row.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/15 hover:bg-primary/15 dark:hover:bg-primary/25 text-primary dark:text-primary-light text-xs font-bold border border-primary/15"
                            >
                              <IconEye />
                              <span className="hidden sm:inline">{t('list.viewDetail')}</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
              )}
            </div>

            {!isLoading && content.length === 0 && (
              <EmptyState
                hasFilters={hasActiveFilters}
                onReset={resetFilters}
                labelNoData={t('list.emptyNoData')}
                labelNoResults={t('list.emptyNoResults')}
                hintNoData={t('list.emptyNoDataHint')}
                hintNoResults={t('list.emptyNoResultsHint')}
                labelReset={t('list.resetFilters')}
              />
            )}

            {isLoading && (
              <div className="flex items-center gap-2.5 px-5 py-3 border-t border-gray-100 dark:border-gray-700/60">
                <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">{t('list.loading')}</span>
              </div>
            )}
          </div>
        )}

        {!isLoading && !isError && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            size={params.size}
            onPageChange={setPage}
            onSizeChange={setSize}
            labelRange={paginationRangeLabel}
            labelPrev={t('list.paginationPrev')}
            labelNext={t('list.paginationNext')}
          />
        )}

        <div className="h-4" />
      </div>
    </PageContainer>
  )
}
