import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  useCorpsEtat,
  useCreateBaremeArticle,
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
import { defaultBaremeCatalogueCorpsEtatId } from '../baremeCorpsEtatDefault'

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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepIndicator({
  number,
  label,
  active,
  done,
}: {
  number: number
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        active ? 'bg-primary/10 dark:bg-primary/20 border border-primary/30' : done ? 'opacity-70' : 'opacity-35'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all duration-300 ${
          done
            ? 'bg-success text-white'
            : active
              ? 'bg-primary text-white shadow-lg shadow-primary/40'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
      >
        {done ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={`text-sm font-medium ${
          active ? 'text-primary dark:text-primary-light' : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function FieldGroup({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
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
        ${className}
      `}
    />
  )
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', style, ...rest } = props
  return (
    <select
      {...rest}
      className={`
        w-full px-4 py-2.5 rounded-xl border text-sm font-medium appearance-none cursor-pointer
        bg-white dark:bg-gray-800/80
        border-gray-200 dark:border-gray-700
        text-gray-900 dark:text-gray-100
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
        hover:border-gray-300 dark:hover:border-gray-600
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        paddingRight: '2.5rem',
        ...style,
      }}
    />
  )
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
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
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  accent?: boolean
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
      <div>
        <p className="font-bold text-gray-900 dark:text-white text-sm">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function TypeBadge({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-5 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex-1 justify-center min-h-[52px]
        ${
          active
            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30 scale-[1.01]'
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-primary/40 hover:text-primary dark:hover:text-primary-light'
        }
      `}
    >
      <span className={`${active ? 'text-white' : 'text-gray-400'} transition-colors`}>{icon}</span>
      {label}
    </button>
  )
}

function PrestationRow({
  ligne,
  index,
  onChange,
  onRemove,
  labelLibelle,
  labelQty,
  labelPU,
  labelUnite,
  labelRemove,
}: {
  ligne: BaremePrestationLigneCreateRequest
  index: number
  onChange: (index: number, field: keyof BaremePrestationLigneCreateRequest, value: string) => void
  onRemove: (index: number) => void
  labelLibelle: string
  labelQty: string
  labelPU: string
  labelUnite: string
  labelRemove: string
}) {
  return (
    <div className="group flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/50 hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-200">
      <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1.5">
        {index + 1}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5">
          <StyledInput
            placeholder={labelLibelle}
            value={ligne.libelle}
            onChange={(e) => onChange(index, 'libelle', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <StyledInput
            type="number"
            placeholder={labelQty}
            value={ligne.quantite ?? ''}
            onChange={(e) => onChange(index, 'quantite', e.target.value)}
            min={0}
            step="0.01"
          />
        </div>
        <div className="md:col-span-3">
          <StyledInput
            type="number"
            placeholder={labelPU}
            value={ligne.prixUnitaire ?? ''}
            onChange={(e) => onChange(index, 'prixUnitaire', e.target.value)}
            min={0}
            step="0.01"
          />
        </div>
        <div className="md:col-span-2">
          <StyledInput
            placeholder={labelUnite}
            value={ligne.unite ?? ''}
            onChange={(e) => onChange(index, 'unite', e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="mt-1.5 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex-shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
        title={labelRemove}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function SummaryStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
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

const IconBox = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
  </svg>
)

const IconWrench = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
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

const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
)

const IconArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
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
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
    />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function BaremeArticleCreatePage() {
  const { t } = useTranslation('bareme')
  const navigate = useNavigate()

  const { data: corpsEtats = [] } = useCorpsEtat()
  const createMutation = useCreateBaremeArticle()

  const [type, setType] = useState<TypeLigneBareme>(TypeLigneBareme.MATERIAU)
  const [corpsEtatId, setCorpsEtatId] = useState<number | ''>('')
  const [reference, setReference] = useState('')
  const [libelle, setLibelle] = useState('')
  const [unite, setUnite] = useState('')
  const [famille, setFamille] = useState('')
  const [categorie, setCategorie] = useState('')
  const materiauOfferKeySeqRef = useRef(0)
  const [materiauOffres, setMateriauOffres] = useState<MateriauOfferFormRow[]>(() => {
    materiauOfferKeySeqRef.current += 1
    return [
      {
        key: `m-${materiauOfferKeySeqRef.current}`,
        fournisseurId: '',
        fournisseurNom: '',
        fournisseurContact: '',
        prixTtc: '',
        datePrix: '',
        prixEstime: false,
      },
    ]
  })
  const [debourse, setDebourse] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [coefficientPv, setCoefficientPv] = useState('')
  const [unitePrestation, setUnitePrestation] = useState('')
  const [totauxEstimes, setTotauxEstimes] = useState(false)
  const [lignes, setLignes] = useState<BaremePrestationLigneCreateRequest[]>([emptyLigne()])
  const [error, setError] = useState<string | null>(null)

  const isMateriau = type === TypeLigneBareme.MATERIAU

  const { data: facetsData } = useBaremeFilterFacets({ type: TypeLigneBareme.MATERIAU }, { enabled: isMateriau })
  const { data: fournisseurs = [] } = useBaremeFournisseurs({ enabled: isMateriau })

  const categories = facetsData?.categories ?? []
  const familles = facetsData?.familles ?? []
  const unites = facetsData?.unites ?? []

  useEffect(() => {
    if (corpsEtats.length === 0) return
    setCorpsEtatId((prev) => {
      if (prev !== '') return prev
      const id = defaultBaremeCatalogueCorpsEtatId(corpsEtats)
      return id ?? ''
    })
  }, [corpsEtats])

  useEffect(() => {
    if (!isMateriau || fournisseurs.length === 0) return
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
  }, [isMateriau, fournisseurs])

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
      return categorie.trim().length > 0 && famille.trim().length > 0 && unite.trim().length > 0 && rowsOk
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

  const step1Done = !!corpsEtatId && !!libelle.trim()
  const step2Done = isMateriau ? !!categorie && !!famille && !!unite : !!debourse && !!prixVente
  const step3Done = isMateriau
    ? !materiauDuplicateSupplier &&
      materiauOffres.length > 0 &&
      materiauOffres.every((row) => {
        const hasFourn = row.fournisseurId !== '' || row.fournisseurNom.trim().length > 0
        const prixNum = toNullableNumber(row.prixTtc)
        return hasFourn && prixNum != null && prixNum > 0
      })
    : true

  const progressPercent = useMemo(() => {
    const totalSteps = isMateriau ? 3 : 2
    let n = 0
    if (step1Done) n += 1
    if (step2Done) n += 1
    if (isMateriau && step3Done) n += 1
    return (n / totalSteps) * 100
  }, [isMateriau, step1Done, step2Done, step3Done])

  const materiauSuppliersSummary = useMemo(
    () => formatMateriauSuppliersListSummary(materiauOffres, fournisseurs),
    [materiauOffres, fournisseurs]
  )

  const materiauPriceRangeSummary = useMemo(
    () => formatMateriauPriceRangeSummaryFr(materiauOffres),
    [materiauOffres]
  )

  const handleLigneChange = useCallback((index: number, field: keyof BaremePrestationLigneCreateRequest, value: string) => {
    setLignes((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l
        if (field === 'quantite' || field === 'prixUnitaire' || field === 'somme') {
          return { ...l, [field]: toNullableNumber(value) }
        }
        return { ...l, [field]: value }
      })
    )
  }, [])

  const handleLigneRemove = useCallback((index: number) => {
    setLignes((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }, [])

  const handleAddLigne = useCallback(() => {
    setLignes((prev) => [...prev, emptyLigne()])
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValid || !corpsEtatId) return
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
        fournisseurId: null,
        fournisseurNom: null,
        fournisseurContact: null,
        prixTtc: null,
        datePrix: null,
        prixEstime: false,
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
      const created = await createMutation.mutateAsync(payload)
      navigate(`/bareme/articles/${created.id}`)
    } catch (err) {
      setError(handleApiError(err))
    }
  }

  return (
    <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80">
      <div className="relative overflow-hidden rounded-2xl mb-6 shadow-xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
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
              {isMateriau ? (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
                  />
                </svg>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold tracking-widest uppercase text-white/60">{t('title')}</span>
                <span className="text-white/40">›</span>
                <span
                  className={`text-xs font-bold tracking-wide px-2 py-0.5 rounded-full ${
                    isMateriau
                      ? 'bg-orange-200/20 text-orange-100 border border-orange-200/30'
                      : 'bg-blue-200/20 text-blue-100 border border-blue-200/30'
                  }`}
                >
                  {isMateriau ? t('list.typeMateriau') : t('list.typePrestation')}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">{t('create.title')}</h1>
              <p className="text-white/70 text-sm mt-1 font-medium">{t('create.subtitle')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/bareme')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm transition-all duration-200 self-start md:self-auto"
          >
            <IconArrowLeft />
            {t('detail.backToList')}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-white/60 transition-all duration-500 ease-out rounded-r-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
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
              subtitle={t('create.baseInfoSubtitle')}
              accent
            />
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 mb-3">
                  {t('create.type')} <span className="text-primary">*</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <TypeBadge
                    active={isMateriau}
                    label={t('list.typeMateriau')}
                    icon={<IconBox />}
                    onClick={() => setType(TypeLigneBareme.MATERIAU)}
                  />
                  <TypeBadge
                    active={!isMateriau}
                    label={t('list.typePrestation')}
                    icon={<IconWrench />}
                    onClick={() => setType(TypeLigneBareme.PRESTATION_ENTETE)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 max-w-2xl">
                {isMateriau ? (
                  <FieldGroup label={t('detail.reference')} hint={t('create.referenceAssignedOnSave')}>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 text-sm text-gray-500 dark:text-gray-400">
                      <IconTag />
                      <span className="italic">{t('create.referenceAutomatic')}</span>
                    </div>
                  </FieldGroup>
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
                    <StyledInput value={unite} onChange={(e) => setUnite(e.target.value)} placeholder={t('create.unitePlaceholder')} />
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
                    <StyledInput value={famille} onChange={(e) => setFamille(e.target.value)} placeholder={t('create.famillePlaceholder')} />
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
                    <StyledInput value={categorie} onChange={(e) => setCategorie(e.target.value)} placeholder={t('create.categoriePlaceholder')} />
                  )}
                </FieldGroup>
              </div>
            </div>
          </SectionCard>

          {isMateriau ? (
            <MateriauOffresFormSection
              offers={materiauOffres}
              fournisseurs={fournisseurs}
              duplicateSupplier={materiauDuplicateSupplier}
              onAdd={addMateriauOffer}
              onRemove={removeMateriauOffer}
              onUpdateRow={updateMateriauOffer}
            />
          ) : (
            <SectionCard>
              <SectionHeader icon={<IconList />} title={t('create.prestationSection')} subtitle={t('create.prestationSubtitle')} />
              <div className="p-6 space-y-6">
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

                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                      totauxEstimes ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        totauxEstimes ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                    <input
                      type="checkbox"
                      checked={totauxEstimes}
                      onChange={(e) => setTotauxEstimes(e.target.checked)}
                      className="sr-only"
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {t('create.totalEstimated')}
                  </span>
                  {totauxEstimes && (
                    <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 text-xs font-bold">
                      {t('create.estimated')}
                    </span>
                  )}
                </label>

                <div>
                  <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{t('create.breakdownLines')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('create.linesCount', { count: lignes.length })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLigne}
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
                        labelLibelle={t('detail.colLibelle')}
                        labelQty={t('detail.colQuantite')}
                        labelPU={t('detail.colPrixUnitaire')}
                        labelUnite={t('detail.colUnite')}
                        labelRemove={t('create.removeLine')}
                      />
                    ))}
                  </div>

                  {lignes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                      <IconList />
                      <p className="mt-2 text-sm text-center px-4">{t('create.noLines')}</p>
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

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate('/bareme')}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                >
                  {t('create.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={!isValid || createMutation.isPending}
                  className={`
                    flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-sm
                    ${
                      isValid && !createMutation.isPending
                        ? 'bg-primary hover:bg-primary-dark shadow-primary/30 hover:shadow-md hover:shadow-primary/20 hover:-translate-y-px active:translate-y-0'
                        : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  {createMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {t('create.creating')}
                    </>
                  ) : (
                    <>
                      <IconSave />
                      {t('create.create')}
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
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              title={t('create.progress')}
            />
            <div className="p-4 space-y-2">
              <StepIndicator
                number={1}
                label={t('create.step1')}
                active={!step1Done}
                done={step1Done}
              />
              <StepIndicator
                number={2}
                label={isMateriau ? t('create.step2Mat') : t('create.step2Prest')}
                active={step1Done && !step2Done}
                done={step2Done}
              />
              {isMateriau && (
                <StepIndicator
                  number={3}
                  label={t('create.step3')}
                  active={step1Done && step2Done && !step3Done}
                  done={step3Done}
                />
              )}
            </div>
          </SectionCard>

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
                  <SummaryStat
                    label={t('create.breakdownLines')}
                    value={t('create.summaryLinesCount', {
                      count: lignes.filter((l) => l.libelle.trim()).length,
                    })}
                    icon={<IconList />}
                  />
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconInfo />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('create.helpTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {isMateriau ? t('create.helpMateriau') : t('create.helpPrestation')}
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
