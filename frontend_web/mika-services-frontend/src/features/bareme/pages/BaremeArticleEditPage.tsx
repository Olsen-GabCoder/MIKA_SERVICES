import { useEffect, useMemo, useState, useCallback, useRef, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  useBaremeArticle,
  useUpdateBaremeArticle,
  useBaremeFilterFacets,
  useBaremeFournisseurs,
} from '../hooks/useBaremeQueries'
import { TypeLigneBareme, type BaremePrestationLigneCreateRequest } from '../types'
import { handleApiError } from '@/utils/errorHandler'
import { MateriauOffresFormSection, type MateriauOfferFormRow } from '../components/MateriauOffresFormSection'
import {
  formatMateriauPriceRangeSummaryFr,
  formatMateriauSuppliersListSummary,
  materiauFormRowsToApiOffres,
  materiauOffersHaveDuplicateSuppliers,
  toNullableNumber,
} from '../materiauOfferFormUtils'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const emptyLigne = (): BaremePrestationLigneCreateRequest => ({
  libelle: '',
  quantite: null,
  prixUnitaire: null,
  unite: '',
  somme: null,
  prixEstime: false,
})

/** Saisie `type="date"` : extraire YYYY-MM-DD depuis une date ISO API. */
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const s = iso.trim()
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return s
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives (mirror CreatePage)
// ─────────────────────────────────────────────────────────────────────────────

function FieldGroup({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="group flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 group-focus-within:text-primary dark:group-focus-within:text-primary-light transition-colors duration-200">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 italic">{hint}</p>}
    </div>
  )
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props
  return (
    <input
      {...rest}
      className={`
        w-full px-4 py-2.5 rounded-xl border text-sm font-medium
        bg-white dark:bg-gray-800/80
        border-gray-200 dark:border-gray-700
        text-gray-900 dark:text-gray-100
        placeholder:text-gray-400 dark:placeholder:text-gray-500
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
        hover:border-gray-300 dark:hover:border-gray-600
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        read-only:bg-gray-50 dark:read-only:bg-gray-700/40 read-only:cursor-not-allowed read-only:border-dashed
        ${className}
      `}
    />
  )
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', style, disabled, ...rest } = props
  return (
    <select
      {...rest}
      disabled={disabled}
      className={`
        w-full px-4 py-2.5 rounded-xl border text-sm font-medium appearance-none cursor-pointer
        bg-white dark:bg-gray-800/80
        border-gray-200 dark:border-gray-700
        text-gray-900 dark:text-gray-100
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
        hover:border-gray-300 dark:hover:border-gray-600
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-700/40
        ${className ?? ''}
      `}
      style={{
        backgroundImage: disabled
          ? 'none'
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        paddingRight: disabled ? undefined : '2.5rem',
        ...(style ?? {}),
      }}
    />
  )
}

function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
  accent = false,
  badge,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  accent?: boolean
  badge?: ReactNode
}) {
  return (
    <div
      className={`flex items-center gap-4 px-6 py-5 border-b ${
        accent
          ? 'border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 rounded-t-2xl'
          : 'border-gray-100 dark:border-gray-700/60'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          accent
            ? 'bg-primary text-white shadow-lg shadow-primary/30'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-gray-900 dark:text-white text-sm">{title}</p>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function ReadonlyField({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">{label}</p>
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40">
        {icon && <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{icon}</span>}
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{value || '—'}</span>
      </div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  badgeLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  badgeLabel?: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group w-fit">
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
          checked ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
        {label}
      </span>
      {checked && badgeLabel && (
        <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 text-xs font-bold">
          {badgeLabel}
        </span>
      )}
    </label>
  )
}

function PrestationRow({
  ligne,
  index,
  onChange,
  onRemove,
  labels,
}: {
  ligne: BaremePrestationLigneCreateRequest
  index: number
  onChange: (index: number, field: keyof BaremePrestationLigneCreateRequest, value: string) => void
  onRemove: (index: number) => void
  labels: { libelle: string; qty: string; pu: string; unite: string; remove: string }
}) {
  return (
    <div className="group flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/50 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-200">
      <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1.5">
        {index + 1}
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5">
          <StyledInput
            placeholder={labels.libelle}
            value={ligne.libelle}
            onChange={(e) => onChange(index, 'libelle', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <StyledInput
            type="number"
            placeholder={labels.qty}
            value={ligne.quantite ?? ''}
            onChange={(e) => onChange(index, 'quantite', e.target.value)}
            min={0}
            step="0.01"
          />
        </div>
        <div className="md:col-span-3">
          <StyledInput
            type="number"
            placeholder={labels.pu}
            value={ligne.prixUnitaire ?? ''}
            onChange={(e) => onChange(index, 'prixUnitaire', e.target.value)}
            min={0}
            step="0.01"
          />
        </div>
        <div className="md:col-span-2">
          <StyledInput
            placeholder={labels.unite}
            value={ligne.unite ?? ''}
            onChange={(e) => onChange(index, 'unite', e.target.value)}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="mt-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
        title={labels.remove}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function SummaryStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
      <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light flex items-center justify-center flex-shrink-0 text-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

const IconEdit = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
    />
  </svg>
)

const IconInfo = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
)

const IconSupplier = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  </svg>
)

const IconList = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
)

const IconTag = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
  </svg>
)

const IconCurrency = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
)

const IconSave = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const IconArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
)

const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const IconLock = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
)

const IconBox = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
  </svg>
)

const IconWrench = () => (
  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
    />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80 space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary/40 to-primary-dark/40 overflow-hidden animate-pulse">
        <div className="px-6 py-9">
          <div className="h-8 w-64 rounded-xl bg-white/20 mb-3" />
          <div className="h-4 w-40 rounded-lg bg-white/15" />
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4 animate-pulse">
            <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-600" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4 animate-pulse">
            <div className="h-5 w-56 rounded bg-gray-200 dark:bg-gray-600" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
          </div>
        </div>
        <div className="xl:w-72 space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function BaremeArticleEditPage() {
  const { t } = useTranslation('bareme')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const articleId = id != null ? Number(id) : null

  const { data: article, isLoading } = useBaremeArticle(articleId)
  const updateMutation = useUpdateBaremeArticle()

  const [type, setType] = useState<TypeLigneBareme>(TypeLigneBareme.MATERIAU)
  const [corpsEtatId, setCorpsEtatId] = useState<number | ''>('')
  const [reference, setReference] = useState('')
  const [libelle, setLibelle] = useState('')
  const [unite, setUnite] = useState('')
  const [famille, setFamille] = useState('')
  const [categorie, setCategorie] = useState('')
  const materiauOfferKeySeqRef = useRef(0)
  const [materiauOffres, setMateriauOffres] = useState<MateriauOfferFormRow[]>([])
  const [debourse, setDebourse] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [coefficientPv, setCoefficientPv] = useState('')
  const [unitePrestation, setUnitePrestation] = useState('')
  const [prixEstime, setPrixEstime] = useState(false)
  const [totauxEstimes, setTotauxEstimes] = useState(false)
  const [lignes, setLignes] = useState<BaremePrestationLigneCreateRequest[]>([emptyLigne()])
  const [error, setError] = useState<string | null>(null)

  const isMateriau = type === TypeLigneBareme.MATERIAU

  const { data: facetsData } = useBaremeFilterFacets({ type: TypeLigneBareme.MATERIAU }, { enabled: isMateriau })
  const { data: fournisseurs = [] } = useBaremeFournisseurs({ enabled: isMateriau })

  const categories = useMemo(() => {
    const base = facetsData?.categories ?? []
    if (categorie && !base.includes(categorie)) return [...base, categorie].sort((a, b) => a.localeCompare(b, 'fr'))
    return base
  }, [facetsData?.categories, categorie])

  const familles = useMemo(() => {
    const base = facetsData?.familles ?? []
    if (famille && !base.includes(famille)) return [...base, famille].sort((a, b) => a.localeCompare(b, 'fr'))
    return base
  }, [facetsData?.familles, famille])

  const unites = useMemo(() => {
    const base = facetsData?.unites ?? []
    if (unite && !base.includes(unite)) return [...base, unite].sort((a, b) => a.localeCompare(b, 'fr'))
    return base
  }, [facetsData?.unites, unite])

  useEffect(() => {
    if (!article) return
    setType(article.type)
    setCorpsEtatId(article.corpsEtat?.id ?? '')
    setReference(article.reference ?? '')
    setLibelle(article.libelle ?? '')
    setUnite(article.unite ?? '')
    setFamille(article.famille ?? '')
    setCategorie(article.categorie ?? '')
    if (article.type === TypeLigneBareme.MATERIAU) {
      setPrixEstime(false)
      materiauOfferKeySeqRef.current = 0
      const pfs = article.prixParFournisseur ?? []
      if (pfs.length > 0) {
        setMateriauOffres(
          pfs.map((pf, idx) => ({
            key: `r-${article.id}-${idx}-${++materiauOfferKeySeqRef.current}`,
            fournisseurId: pf.fournisseurId ?? '',
            fournisseurNom: pf.fournisseurId != null ? '' : (pf.fournisseurNom ?? ''),
            fournisseurContact: pf.fournisseurContact ?? '',
            prixTtc: pf.prixTtc != null ? String(pf.prixTtc) : '',
            datePrix: toDateInputValue(pf.datePrix),
            prixEstime: pf.prixEstime ?? false,
          }))
        )
      } else {
        setMateriauOffres([
          {
            key: `m-${++materiauOfferKeySeqRef.current}`,
            fournisseurId: '',
            fournisseurNom: '',
            fournisseurContact: '',
            prixTtc: '',
            datePrix: '',
            prixEstime: false,
          },
        ])
      }
    } else {
      setPrixEstime(false)
      setDebourse(article.debourse != null ? String(article.debourse) : '')
      setPrixVente(article.prixVente != null ? String(article.prixVente) : '')
      setCoefficientPv(article.coefficientPv != null ? String(article.coefficientPv) : '')
      setUnitePrestation(article.unitePrestation ?? '')
      setTotauxEstimes(article.totauxEstimes === true)
      setLignes(
        (article.lignesPrestation ?? []).map((l) => ({
          libelle: l.libelle ?? '',
          quantite: l.quantite ?? null,
          prixUnitaire: l.prixUnitaire ?? null,
          unite: l.unite ?? '',
          somme: l.somme ?? null,
          prixEstime: l.prixEstime ?? false,
        }))
      )
    }
  }, [article])

  useEffect(() => {
    if (!article || article.type !== TypeLigneBareme.MATERIAU || fournisseurs.length === 0) return
    setMateriauOffres((prev) =>
      prev.map((row) => {
        if (row.fournisseurId !== '') return row
        const nom = row.fournisseurNom.trim()
        if (!nom) return row
        const match = fournisseurs.find((f) => f.nom === nom)
        if (match) return { ...row, fournisseurId: match.id, fournisseurNom: '' }
        return row
      })
    )
  }, [article, fournisseurs])

  const materiauDuplicateSupplier = useMemo(
    () => materiauOffersHaveDuplicateSuppliers(materiauOffres),
    [materiauOffres]
  )

  const isValid = useMemo(() => {
    if (!corpsEtatId || !libelle.trim()) return false
    if (isMateriau) {
      if (materiauDuplicateSupplier) return false
      if (materiauOffres.length === 0) return false
      const rowsOk = materiauOffres.every((row) => {
        const hasFourn = row.fournisseurId !== '' || row.fournisseurNom.trim().length > 0
        const prixNum = toNullableNumber(row.prixTtc)
        return hasFourn && prixNum != null && prixNum > 0
      })
      return (
        categorie.trim().length > 0 &&
        famille.trim().length > 0 &&
        unite.trim().length > 0 &&
        rowsOk
      )
    }
    return debourse.trim().length > 0 && prixVente.trim().length > 0
  }, [
    corpsEtatId,
    libelle,
    isMateriau,
    categorie,
    famille,
    unite,
    materiauOffres,
    materiauDuplicateSupplier,
    debourse,
    prixVente,
  ])

  const handleLigneChange = useCallback(
    (index: number, field: keyof BaremePrestationLigneCreateRequest, value: string) => {
      setLignes((prev) =>
        prev.map((l, i) => {
          if (i !== index) return l
          if (field === 'quantite' || field === 'prixUnitaire' || field === 'somme') {
            return { ...l, [field]: toNullableNumber(value) }
          }
          return { ...l, [field]: value }
        })
      )
    },
    []
  )

  const handleLigneRemove = useCallback((index: number) => {
    setLignes((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateMateriauOffer = useCallback(
    (index: number, patch: Partial<Omit<MateriauOfferFormRow, 'key'>>) => {
      setMateriauOffres((prev) =>
        prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
      )
    },
    []
  )

  const addMateriauOffer = useCallback(() => {
    setMateriauOffres((prev) => [
      ...prev,
      {
        key: `m-${++materiauOfferKeySeqRef.current}`,
        fournisseurId: '',
        fournisseurNom: '',
        fournisseurContact: '',
        prixTtc: '',
        datePrix: '',
        prixEstime: false,
      },
    ])
  }, [])

  const removeMateriauOffer = useCallback((index: number) => {
    setMateriauOffres((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValid || !corpsEtatId || !articleId) return
    try {
      const offresMateriau = isMateriau ? materiauFormRowsToApiOffres(materiauOffres) : null

      const payload = {
        corpsEtatId,
        type,
        reference: isMateriau ? null : reference.trim() || null,
        libelle: libelle.trim(),
        unite: unite.trim() || null,
        famille: famille.trim() || null,
        categorie: categorie.trim() || null,
        depot: null,
        fournisseurId: isMateriau ? null : null,
        fournisseurNom: isMateriau ? null : null,
        fournisseurContact: isMateriau ? null : null,
        prixTtc: isMateriau ? null : null,
        datePrix: isMateriau ? null : null,
        prixEstime: isMateriau ? false : prixEstime,
        debourse: isMateriau ? null : toNullableNumber(debourse),
        prixVente: isMateriau ? null : toNullableNumber(prixVente),
        coefficientPv: isMateriau ? null : toNullableNumber(coefficientPv),
        unitePrestation: isMateriau ? null : unitePrestation.trim() || null,
        totauxEstimes,
        lignesPrestation: isMateriau
          ? []
          : lignes
              .filter((l) => l.libelle.trim().length > 0)
              .map((l) => ({
                ...l,
                libelle: l.libelle.trim(),
                unite: l.unite?.trim() || null,
                quantite: l.quantite ?? null,
                prixUnitaire: l.prixUnitaire ?? null,
                somme: l.somme ?? null,
              })),
        offresMateriau,
      }
      const updated = await updateMutation.mutateAsync({ id: articleId, payload })
      navigate(`/bareme/articles/${updated.id}`)
    } catch (err) {
      setError(handleApiError(err))
    }
  }

  const materiauSuppliersSummary = useMemo(
    () => formatMateriauSuppliersListSummary(materiauOffres, fournisseurs),
    [materiauOffres, fournisseurs]
  )

  const materiauPriceRangeSummary = useMemo(
    () => formatMateriauPriceRangeSummaryFr(materiauOffres),
    [materiauOffres]
  )

  if (!articleId || Number.isNaN(articleId)) {
    return (
      <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{t('detail.invalidId')}</p>
        </div>
      </PageContainer>
    )
  }

  if (isLoading || !article) {
    return <PageSkeleton />
  }

  const linesCountLabel = t('create.linesCount', { count: lignes.length })
  const summaryLinesBreakdown = t('create.summaryLinesCount', {
    count: lignes.filter((l) => l.libelle.trim()).length,
  })

  return (
    <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80">
      <div className="relative overflow-hidden rounded-2xl mb-6 shadow-xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary-dark to-primary-dark" />
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 px-6 py-7 md:py-9 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0">
              {isMateriau ? <IconBox /> : <IconWrench />}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold tracking-widest uppercase text-white/60">
                  {t('title')} › {t('detail.title')}
                </span>
                <span className="text-white/40">›</span>
                <span className="flex items-center gap-1 text-xs font-bold tracking-wide px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  <IconEdit />
                  {t('edit.badge')}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {article.libelle ?? t('edit.title')}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`text-xs font-bold tracking-wide px-2 py-0.5 rounded-full border ${
                    isMateriau
                      ? 'bg-orange-200/20 text-orange-100 border-orange-200/30'
                      : 'bg-blue-200/20 text-blue-100 border-blue-200/30'
                  }`}
                >
                  {isMateriau ? t('list.typeMateriau') : t('list.typePrestation')}
                </span>
                {article.reference && (
                  <span className="text-xs font-mono text-white/60 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                    {article.reference}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[10px] text-white/50 px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                  <IconLock />
                  {t('edit.typeLocked')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/bareme/articles/${articleId}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm transition-all duration-200 self-start md:self-auto"
          >
            <IconArrowLeft />
            {t('detail.backToDetail')}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 px-5 py-4 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                !
              </div>
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">{t('create.errorTitle')}</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <SectionCard>
            <SectionHeader
              icon={<IconInfo />}
              title={t('create.baseInfo')}
              subtitle={t('edit.baseInfoSubtitle')}
              accent
              badge={
                <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
                  <IconLock />
                  {t('edit.typeLocked')}
                </span>
              }
            />
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ReadonlyField
                  label={t('create.type')}
                  value={isMateriau ? t('list.typeMateriau') : t('list.typePrestation')}
                  icon={<IconLock />}
                />
                {isMateriau ? (
                  <ReadonlyField label={t('detail.reference')} value={reference} icon={<IconTag />} />
                ) : (
                  <FieldGroup label={t('detail.reference')}>
                    <StyledInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="REF-XXX" />
                  </FieldGroup>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <FieldGroup label={t('list.colArticle')} required>
                    <StyledInput
                      value={libelle}
                      onChange={(e) => setLibelle(e.target.value)}
                      required
                      placeholder={t('create.libellePlaceholder')}
                    />
                  </FieldGroup>
                </div>
                <FieldGroup label={t('detail.unite')} required={isMateriau}>
                  {isMateriau ? (
                    <StyledSelect value={unite} onChange={(e) => setUnite(e.target.value)} required>
                      <option value="">{t('create.selectPlaceholder')}</option>
                      {unites.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </StyledSelect>
                  ) : (
                    <StyledInput
                      value={unite}
                      onChange={(e) => setUnite(e.target.value)}
                      placeholder={t('create.unitePlaceholder')}
                    />
                  )}
                </FieldGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FieldGroup label={t('list.corpsEtat')} required={isMateriau}>
                  {isMateriau ? (
                    <StyledSelect value={famille} onChange={(e) => setFamille(e.target.value)} required>
                      <option value="">{t('create.selectPlaceholder')}</option>
                      {familles.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </StyledSelect>
                  ) : (
                    <StyledInput
                      value={famille}
                      onChange={(e) => setFamille(e.target.value)}
                      placeholder={t('create.famillePlaceholder')}
                    />
                  )}
                </FieldGroup>
                <FieldGroup label={t('detail.categorie')} required={isMateriau}>
                  {isMateriau ? (
                    <StyledSelect value={categorie} onChange={(e) => setCategorie(e.target.value)} required>
                      <option value="">{t('create.selectPlaceholder')}</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </StyledSelect>
                  ) : (
                    <StyledInput
                      value={categorie}
                      onChange={(e) => setCategorie(e.target.value)}
                      placeholder={t('create.categoriePlaceholder')}
                    />
                  )}
                </FieldGroup>
              </div>
            </div>
          </SectionCard>

          {isMateriau && (
            <MateriauOffresFormSection
              offers={materiauOffres}
              fournisseurs={fournisseurs}
              duplicateSupplier={materiauDuplicateSupplier}
              onAdd={addMateriauOffer}
              onRemove={removeMateriauOffer}
              onUpdateRow={updateMateriauOffer}
            />
          )}

          {!isMateriau && (
            <SectionCard>
              <SectionHeader
                icon={<IconList />}
                title={t('create.prestationSection')}
                subtitle={t('create.prestationSubtitle')}
              />
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <FieldGroup label={t('detail.debourse')} required>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <IconCurrency />
                      </div>
                      <StyledInput
                        type="number"
                        value={debourse}
                        onChange={(e) => setDebourse(e.target.value)}
                        required
                        className="!pl-10"
                        placeholder="0"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </FieldGroup>
                  <FieldGroup label={t('detail.prixVente')} required>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <IconCurrency />
                      </div>
                      <StyledInput
                        type="number"
                        value={prixVente}
                        onChange={(e) => setPrixVente(e.target.value)}
                        required
                        className="!pl-10"
                        placeholder="0"
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </FieldGroup>
                  <FieldGroup label={t('detail.coefficientPv')}>
                    <StyledInput
                      type="number"
                      value={coefficientPv}
                      onChange={(e) => setCoefficientPv(e.target.value)}
                      placeholder="1.0"
                      min={0}
                      step="0.01"
                    />
                  </FieldGroup>
                  <FieldGroup label={t('detail.colUnite')}>
                    <StyledInput
                      value={unitePrestation}
                      onChange={(e) => setUnitePrestation(e.target.value)}
                      placeholder={t('create.unitePrestationPlaceholder')}
                    />
                  </FieldGroup>
                </div>

                <Toggle
                  checked={totauxEstimes}
                  onChange={setTotauxEstimes}
                  label={t('create.totalEstimated')}
                  badgeLabel={t('create.estimated')}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{t('create.breakdownLines')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{linesCountLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLignes((prev) => [...prev, emptyLigne()])}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary dark:text-primary-light text-sm font-semibold border border-primary/20 hover:border-primary/40 transition-all duration-200"
                    >
                      <IconPlus />
                      {t('create.addLine')}
                    </button>
                  </div>

                  <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 mb-2">
                    <div className="md:col-span-1" />
                    <p className="md:col-span-5 text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                      {t('detail.colLibelle')}
                    </p>
                    <p className="md:col-span-2 text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                      {t('detail.colQuantite')}
                    </p>
                    <p className="md:col-span-3 text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                      {t('detail.colPrixUnitaire')}
                    </p>
                    <p className="md:col-span-2 text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                      {t('detail.colUnite')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {lignes.map((ligne, idx) => (
                      <PrestationRow
                        key={idx}
                        ligne={ligne}
                        index={idx}
                        onChange={handleLigneChange}
                        onRemove={handleLigneRemove}
                        labels={{
                          libelle: t('detail.colLibelle'),
                          qty: t('detail.colQuantite'),
                          pu: t('detail.colPrixUnitaire'),
                          unite: t('detail.colUnite'),
                          remove: t('create.removeLine'),
                        }}
                      />
                    ))}
                  </div>

                  {lignes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                      <IconList />
                      <p className="mt-2 text-sm">{t('create.noLines')}</p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard className="!shadow-md">
            <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {isValid ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {t('create.readyToSave')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 font-medium">
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    {t('create.fillRequired')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/bareme/articles/${articleId}`)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                >
                  {t('create.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={!isValid || updateMutation.isPending}
                  className={`
                    flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-sm
                    ${
                      isValid && !updateMutation.isPending
                        ? 'bg-secondary hover:bg-secondary-dark shadow-secondary/30 hover:shadow-md hover:shadow-secondary/20 hover:-translate-y-px active:translate-y-0'
                        : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  {updateMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {t('edit.saving')}
                    </>
                  ) : (
                    <>
                      <IconSave />
                      {t('edit.save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="xl:w-72 flex-shrink-0 space-y-5">
          <SectionCard>
            <SectionHeader
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
              }
              title={t('create.summary')}
            />
            <div className="p-4 space-y-3">
              <SummaryStat label={t('list.colArticle')} value={libelle} icon={<IconTag />} />
              <SummaryStat
                label={t('list.corpsEtat')}
                value={famille}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                    />
                  </svg>
                }
              />
              {isMateriau ? (
                <>
                  <SummaryStat
                    label={t('edit.suppliersCount', { count: materiauOffres.length })}
                    value={materiauSuppliersSummary}
                    icon={<IconSupplier />}
                  />
                  <SummaryStat
                    label={t('create.prixUnitaireFcfa')}
                    value={materiauPriceRangeSummary}
                    icon={<IconCurrency />}
                  />
                </>
              ) : (
                <>
                  <SummaryStat
                    label={t('detail.debourse')}
                    value={debourse ? `${Number(debourse).toLocaleString('fr-FR')} F` : ''}
                    icon={<IconCurrency />}
                  />
                  <SummaryStat
                    label={t('detail.prixVente')}
                    value={prixVente ? `${Number(prixVente).toLocaleString('fr-FR')} F` : ''}
                    icon={<IconCurrency />}
                  />
                  <SummaryStat label={t('create.breakdownLines')} value={summaryLinesBreakdown} icon={<IconList />} />
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconEdit />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('edit.modifyingTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('edit.modifyingHint')}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{t('detail.reference')}</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{article.reference ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">{t('create.type')}</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      isMateriau
                        ? 'bg-primary/10 text-primary dark:text-primary-light'
                        : 'bg-secondary/10 text-secondary dark:text-secondary-light'
                    }`}
                  >
                    {isMateriau ? t('list.typeMateriau') : t('list.typePrestation')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-mono font-bold text-gray-700 dark:text-gray-300">#{articleId}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconInfo />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('edit.helpTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {isMateriau ? t('edit.helpMateriau') : t('edit.helpPrestation')}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </form>
    </PageContainer>
  )
}

