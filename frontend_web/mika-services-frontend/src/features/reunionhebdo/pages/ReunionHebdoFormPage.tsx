import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import { userApi } from '@/api/userApi'
import type {
  ReunionHebdoCreateRequest,
  ReunionHebdoUpdateRequest,
  ParticipantReunionRequest,
  StatutReunion,
} from '@/types/reunionHebdo'
import type { User } from '@/types'

const STATUT_REUNION_VALUES: StatutReunion[] = ['BROUILLON', 'VALIDE']

const ORDRE_DU_JOUR_OPTION_KEYS = [
  'avancementEtudes',
  'avancementTravaux',
  'caHebdo',
  'previsions',
  'pointsBloquants',
  'besoinsMaterielHumain',
  'securite',
  'qualite',
  'planning',
  'comptesRendus',
  'suiviMarches',
  'alertes',
  'divers',
] as const

function parseOrdreDuJourText(text: string | null | undefined): string[] {
  if (!text || !text.trim()) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+\)\s*/, '').trim())
    .filter(Boolean)
}

function serializeOrdreDuJourItems(items: string[]): string {
  if (items.length === 0) return ''
  return items.map((item, i) => `${i + 1}) ${item}`).join('\n')
}

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

function StyledInput(props: InputHTMLAttributes<HTMLInputElement>) {
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
        [&:user-invalid]:border-red-400 [&:user-invalid]:dark:border-red-500
        [&:user-invalid]:focus:ring-red-400/40 [&:user-invalid]:focus:border-red-500
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    />
  )
}

function StyledSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
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
        [&:user-invalid]:border-red-400 [&:user-invalid]:dark:border-red-500
        [&:user-invalid]:focus:ring-red-400/40 [&:user-invalid]:focus:border-red-500
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-700/40
        ${className}
      `}
      style={{
        backgroundImage: disabled
          ? 'none'
          : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        paddingRight: disabled ? undefined : '2.5rem',
        ...style,
      }}
    />
  )
}

function StyledTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return (
    <textarea
      {...rest}
      className={`
        w-full px-4 py-2.5 rounded-xl border text-sm font-medium
        bg-white dark:bg-gray-800/80
        border-gray-200 dark:border-gray-700
        text-gray-900 dark:text-gray-100
        placeholder:text-gray-400 dark:placeholder:text-gray-500
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
        hover:border-gray-300 dark:hover:border-gray-600
        [&:user-invalid]:border-red-400 [&:user-invalid]:dark:border-red-500
        [&:user-invalid]:focus:ring-red-400/40 [&:user-invalid]:focus:border-red-500
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
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
}: {
  icon: ReactNode
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
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-white text-sm">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

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
      <span className={`text-sm font-medium ${active ? 'text-primary dark:text-primary-light' : 'text-gray-600 dark:text-gray-400'}`}>
        {label}
      </span>
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

const IconArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
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

const IconInfo = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
)

const IconCalendarHero = () => (
  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
    />
  </svg>
)

function FormLoadingSkeleton({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <PageContainer size="full" className="min-h-full min-h-[70vh] w-full flex flex-col bg-gray-50/80 dark:bg-gray-900/80 space-y-6">
      <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
        <div className="relative z-10 px-6 py-7 md:py-9">
          <div className="h-8 w-64 bg-white/20 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-full max-w-xl bg-white/15 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col xl:flex-row gap-6 flex-1">
        <div className="flex-1 space-y-4">
          <div className="h-28 bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600/60 animate-pulse" />
          <div className="h-44 bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600/60 animate-pulse" />
          <div className="h-36 bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600/60 animate-pulse" />
        </div>
        <div className="xl:w-72 space-y-4">
          <div className="h-48 bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600/60 animate-pulse" />
          <div className="h-40 bg-white dark:bg-gray-700/60 rounded-2xl border border-gray-100 dark:border-gray-600/60 animate-pulse" />
        </div>
      </div>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      <p className="sr-only">{title}</p>
    </PageContainer>
  )
}

export const ReunionHebdoFormPage = () => {
  const { t } = useTranslation('reunionHebdo')
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateReunion, setDateReunion] = useState('')
  const [lieu, setLieu] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [ordreDuJourItems, setOrdreDuJourItems] = useState<string[]>([])
  const [ordreDuJourSelect, setOrdreDuJourSelect] = useState('')
  const [ordreDuJourCustomInput, setOrdreDuJourCustomInput] = useState('')
  const [statut, setStatut] = useState<StatutReunion>('BROUILLON')
  const [divers, setDivers] = useState('')
  const [redacteurId, setRedacteurId] = useState<number | ''>('')
  const [participantIds, setParticipantIds] = useState<number[]>([])
  const [manualParticipants, setManualParticipants] = useState<
    { key: string; prenom: string; nom: string; initiales: string; telephone: string }[]
  >([])

  useEffect(() => {
    userApi.getAll({ page: 0, size: 500 }).then((res) => setUsers(res.content)).catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    if (!isEdit && ordreDuJourItems.length === 0) {
      setOrdreDuJourItems(parseOrdreDuJourText(t('form.ordreDuJourDefault')))
    }
  }, [isEdit, t])

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true)
      reunionHebdoApi
        .findById(Number(id))
        .then((r) => {
          setDateReunion(r.dateReunion.slice(0, 10))
          setLieu(r.lieu || '')
          setHeureDebut(r.heureDebut ? r.heureDebut.slice(0, 5) : '')
          setHeureFin(r.heureFin ? r.heureFin.slice(0, 5) : '')
          setOrdreDuJourItems(parseOrdreDuJourText(r.ordreDuJour) || parseOrdreDuJourText(t('form.ordreDuJourDefault')))
          setStatut(r.statut)
          setDivers(r.divers || '')
          setRedacteurId(r.redacteur?.id ?? '')
          setParticipantIds(r.participants.filter((p) => p.userId != null).map((p) => p.userId as number))
          setManualParticipants(
            r.participants
              .filter((p) => p.manuel || p.userId == null)
              .map((p, i) => ({
                key: `m-${p.id}-${i}`,
                prenom: p.prenom || '',
                nom: p.nom || '',
                initiales: p.initiales || '',
                telephone: p.telephone || '',
              }))
          )
        })
        .catch(() => setError(t('form.notFound')))
        .finally(() => setLoading(false))
    }
  }, [isEdit, id, t])

  const step1Done = useMemo(() => dateReunion.trim().length > 0, [dateReunion])
  const step2Done = useMemo(() => ordreDuJourItems.length > 0, [ordreDuJourItems])
  const step3Done = useMemo(
    () =>
      participantIds.length > 0 ||
      manualParticipants.some((m) => m.prenom.trim().length > 0 && m.nom.trim().length > 0),
    [participantIds, manualParticipants]
  )

  const progressPercent = useMemo(() => {
    let n = 0
    if (step1Done) n += 1
    if (step2Done) n += 1
    if (step3Done) n += 1
    return (n / 3) * 100
  }, [step1Done, step2Done, step3Done])

  const canSubmit = dateReunion.trim().length > 0

  const summaryDateLabel = useMemo(() => {
    if (!dateReunion.trim()) return ''
    try {
      return new Date(dateReunion + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateReunion
    }
  }, [dateReunion])

  const redacteurSummary = useMemo(() => {
    if (redacteurId === '') return ''
    const u = users.find((x) => x.id === redacteurId)
    return u ? `${u.prenom} ${u.nom}` : ''
  }, [redacteurId, users])

  const participantCountLabel = useMemo(() => {
    const manualValid = manualParticipants.filter((m) => m.prenom.trim() && m.nom.trim()).length
    const n = participantIds.length + manualValid
    return String(n)
  }, [participantIds, manualParticipants])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const fromApp: ParticipantReunionRequest[] = [...new Set(participantIds)].map((userId) => ({ userId, present: true }))
    const fromManual: ParticipantReunionRequest[] = manualParticipants
      .filter((m) => m.prenom.trim() && m.nom.trim())
      .map((m) => ({
        nomManuel: m.nom.trim(),
        prenomManuel: m.prenom.trim(),
        initiales: m.initiales.trim() || undefined,
        telephone: m.telephone.trim() || undefined,
        present: true,
      }))
    const participants: ParticipantReunionRequest[] = [...fromApp, ...fromManual]
    try {
      if (isEdit && id) {
        const data: ReunionHebdoUpdateRequest = {
          dateReunion: dateReunion || undefined,
          lieu: lieu || undefined,
          heureDebut: heureDebut ? heureDebut + ':00' : undefined,
          heureFin: heureFin ? heureFin + ':00' : undefined,
          ordreDuJour: serializeOrdreDuJourItems(ordreDuJourItems) || undefined,
          statut,
          divers: divers || undefined,
          redacteurId: redacteurId || undefined,
          participants,
        }
        await reunionHebdoApi.update(Number(id), data)
      } else {
        const data: ReunionHebdoCreateRequest = {
          dateReunion,
          lieu: lieu || undefined,
          heureDebut: heureDebut ? heureDebut + ':00' : undefined,
          heureFin: heureFin ? heureFin + ':00' : undefined,
          ordreDuJour: serializeOrdreDuJourItems(ordreDuJourItems) || undefined,
          statut,
          divers: divers || undefined,
          redacteurId: redacteurId || undefined,
          participants,
        }
        await reunionHebdoApi.create(data)
      }
      navigate('/reunions-hebdo')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('form.errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  const toggleParticipant = (userId: number) => {
    setParticipantIds((prev) => (prev.includes(userId) ? prev.filter((i) => i !== userId) : [...prev, userId]))
  }

  const addManualRow = () => {
    setManualParticipants((prev) => [...prev, { key: `new-${Date.now()}`, prenom: '', nom: '', initiales: '', telephone: '' }])
  }

  const updateManual = (key: string, field: 'prenom' | 'nom' | 'initiales' | 'telephone', value: string) => {
    setManualParticipants((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  const removeManual = (key: string) => {
    setManualParticipants((prev) => prev.filter((r) => r.key !== key))
  }

  const addOrdreDuJourFromList = () => {
    if (!ordreDuJourSelect) return
    const label = t(`form.ordreDuJourOptions.${ordreDuJourSelect}`)
    if (label && !ordreDuJourItems.includes(label)) {
      setOrdreDuJourItems((prev) => [...prev, label])
      setOrdreDuJourSelect('')
    }
  }

  const addOrdreDuJourCustom = () => {
    const value = ordreDuJourCustomInput.trim()
    if (value && !ordreDuJourItems.includes(value)) {
      setOrdreDuJourItems((prev) => [...prev, value])
      setOrdreDuJourCustomInput('')
    }
  }

  const removeOrdreDuJourItem = (index: number) => {
    setOrdreDuJourItems((prev) => prev.filter((_, i) => i !== index))
  }

  const heroTitle = isEdit ? t('form.titleEdit') : t('form.titleNew')
  const heroSubtitle = isEdit ? t('form.heroSubtitleEdit') : t('form.heroSubtitleNew')
  const breadcrumbCrumb = isEdit ? t('form.breadcrumbEdit') : t('form.breadcrumbNew')

  if (loading) {
    return <FormLoadingSkeleton title={heroTitle} subtitle={t('form.loading')} />
  }

  return (
    <PageContainer size="full" className="w-full min-h-full min-h-[calc(100dvh-4rem)] flex flex-col bg-gray-50/80 dark:bg-gray-900/80 pb-6">
      <div className="shrink-0 mb-6">
        <div className="relative overflow-hidden rounded-2xl shadow-xl shadow-primary/10">
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
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg flex-shrink-0">
                <IconCalendarHero />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold tracking-widest uppercase text-white/60">{t('form.title')}</span>
                  <span className="text-white/40">›</span>
                  <span className="text-xs font-bold tracking-wide px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/25">
                    {breadcrumbCrumb}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">{heroTitle}</h1>
                <p className="text-white/70 text-sm mt-1 font-medium max-w-2xl">{heroSubtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/reunions-hebdo')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm transition-all duration-200 self-start md:self-auto flex-shrink-0"
            >
              <IconArrowLeft />
              {t('pv.backToList')}
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-white/60 transition-all duration-500 ease-out rounded-r-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col xl:flex-row gap-6 min-h-0 w-full">
        <div className="flex-1 min-w-0 space-y-5 overflow-y-auto min-h-0 xl:pr-1">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-900/20 px-5 py-4 shadow-sm">
              <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                !
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">{t('form.errorTitle')}</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5 break-words">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 mt-2 underline underline-offset-2"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          <SectionCard>
            <SectionHeader
              accent
              title={t('form.sectionGeneral')}
              subtitle={t('form.sectionGeneralHint')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
                  />
                </svg>
              }
            />
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldGroup label={t('form.date')} required>
                  <StyledInput type="date" required value={dateReunion} onChange={(e) => setDateReunion(e.target.value)} />
                </FieldGroup>
                <FieldGroup label={t('form.lieu')}>
                  <StyledInput type="text" value={lieu} onChange={(e) => setLieu(e.target.value)} />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldGroup label={t('form.heureDebut')}>
                  <StyledInput type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} />
                </FieldGroup>
                <FieldGroup label={t('form.heureFin')}>
                  <StyledInput type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} />
                </FieldGroup>
              </div>
              <div className="grid grid-cols-1 max-w-2xl">
                <FieldGroup label={t('form.redacteur')}>
                  <StyledSelect value={redacteurId === '' ? '' : String(redacteurId)} onChange={(e) => setRedacteurId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">{t('form.choose')}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.prenom} {u.nom}
                      </option>
                    ))}
                  </StyledSelect>
                </FieldGroup>
              </div>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              title={t('form.sectionAgenda')}
              subtitle={t('form.sectionAgendaHint')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
            />
            <div className="p-6 space-y-4">
              <FieldGroup label={t('form.ordreDuJour')}>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 items-stretch sm:items-center">
                    <StyledSelect value={ordreDuJourSelect} onChange={(e) => setOrdreDuJourSelect(e.target.value)} className="flex-1 min-w-[200px]">
                      <option value="">{t('form.ordreDuJourAddFromList')}</option>
                      {ORDRE_DU_JOUR_OPTION_KEYS.map((key) => {
                        const label = t(`form.ordreDuJourOptions.${key}`)
                        if (ordreDuJourItems.includes(label)) return null
                        return (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        )
                      })}
                    </StyledSelect>
                    <Button type="button" variant="outline" size="sm" onClick={addOrdreDuJourFromList} disabled={!ordreDuJourSelect} className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {t('form.ordreDuJourAddFromList')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-stretch sm:items-center">
                    <StyledInput
                      type="text"
                      value={ordreDuJourCustomInput}
                      onChange={(e) => setOrdreDuJourCustomInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOrdreDuJourCustom())}
                      placeholder={t('form.ordreDuJourCustomPlaceholder')}
                      className="flex-1 min-w-[200px]"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addOrdreDuJourCustom} disabled={!ordreDuJourCustomInput.trim()} className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {t('form.ordreDuJourAddCustom')}
                    </Button>
                  </div>
                  {ordreDuJourItems.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">{t('form.ordreDuJourEmpty')}</p>
                  ) : (
                    <ul className="space-y-2 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/80 dark:bg-gray-900/40">
                      {ordreDuJourItems.map((item, index) => (
                        <li
                          key={`${index}-${item}`}
                          className="group flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-600/50"
                        >
                          <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 pt-0.5">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeOrdreDuJourItem(index)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0 opacity-70 group-hover:opacity-100"
                            title={t('form.ordreDuJourRemove')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </FieldGroup>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              title={t('form.sectionStatus')}
              subtitle={t('form.sectionStatusHint')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              }
            />
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldGroup label={t('form.statut')}>
                  <StyledSelect value={statut} onChange={(e) => setStatut(e.target.value as StatutReunion)}>
                    {STATUT_REUNION_VALUES.map((v) => (
                      <option key={v} value={v}>
                        {t(`statut.${v}`)}
                      </option>
                    ))}
                  </StyledSelect>
                </FieldGroup>
              </div>
              <FieldGroup label={t('form.divers')}>
                <StyledTextarea value={divers} onChange={(e) => setDivers(e.target.value)} rows={4} />
              </FieldGroup>
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              title={t('form.sectionParticipants')}
              subtitle={t('form.sectionParticipantsHint')}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
            />
            <div className="p-6 space-y-6">
              <FieldGroup label={t('form.participants')} hint={t('form.participantsAppHint')}>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-h-56 overflow-y-auto space-y-2 bg-gray-50/50 dark:bg-gray-900/30">
                  {users.map((u) => (
                    <label key={u.id} className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-colors">
                      <input
                        type="checkbox"
                        checked={participantIds.includes(u.id)}
                        onChange={() => toggleParticipant(u.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {u.prenom} {u.nom}
                      </span>
                    </label>
                  ))}
                </div>
              </FieldGroup>

              <div>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">
                      {t('form.participantsManual')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('form.participantsManualHint')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={addManualRow}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary dark:text-primary-light text-sm font-semibold border border-primary/20 hover:border-primary/40 transition-all duration-200 shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {t('form.participantsManualAdd')}
                  </button>
                </div>
                {manualParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                    <svg className="w-8 h-8 mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                    </svg>
                    <p className="text-sm text-center px-4">{t('form.participantsManualEmpty')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/30">
                    {manualParticipants.map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                            {t('form.participantsManualPrenom')}
                          </label>
                          <StyledInput value={row.prenom} onChange={(e) => updateManual(row.key, 'prenom', e.target.value)} className="py-2" />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                            {t('form.participantsManualNom')}
                          </label>
                          <StyledInput value={row.nom} onChange={(e) => updateManual(row.key, 'nom', e.target.value)} className="py-2" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                            {t('pv.colInitiales')}
                          </label>
                          <StyledInput value={row.initiales} onChange={(e) => updateManual(row.key, 'initiales', e.target.value)} className="py-2" />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                            {t('pv.colTelephone')}
                          </label>
                          <StyledInput value={row.telephone} onChange={(e) => updateManual(row.key, 'telephone', e.target.value)} className="py-2" />
                        </div>
                        <div className="sm:col-span-1 flex justify-end pb-1">
                          <button
                            type="button"
                            onClick={() => removeManual(row.key)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title={t('form.ordreDuJourRemove')}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard className="!shadow-md">
            <div className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {canSubmit ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {t('form.readyToSave')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 font-medium">
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    {t('form.fillRequired')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/reunions-hebdo')}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                >
                  {t('form.cancel')}
                </button>
                {isEdit && id && (
                  <button
                    type="button"
                    onClick={() => navigate('/reunions-hebdo/' + id)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    {t('form.viewPV')}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className={`
                    flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-sm
                    ${
                      canSubmit && !saving
                        ? 'bg-primary hover:bg-primary-dark shadow-primary/30 hover:shadow-md hover:shadow-primary/20 hover:-translate-y-px active:translate-y-0'
                        : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('form.saving')}
                    </>
                  ) : (
                    <>
                      <IconSave />
                      {isEdit ? t('form.save') : t('form.create')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="xl:w-72 flex-shrink-0 space-y-5 xl:sticky xl:top-4 xl:self-start">
          <SectionCard>
            <SectionHeader
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title={t('form.progressLabel')}
            />
            <div className="p-4 space-y-2">
              <StepIndicator number={1} label={t('form.stepGeneral')} active={!step1Done} done={step1Done} />
              <StepIndicator number={2} label={t('form.stepAgenda')} active={step1Done && !step2Done} done={step2Done} />
              <StepIndicator number={3} label={t('form.stepParticipants')} active={step1Done && step2Done && !step3Done} done={step3Done} />
            </div>
          </SectionCard>

          <SectionCard>
            <SectionHeader
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              }
              title={t('form.summaryTitle')}
            />
            <div className="p-4 space-y-3">
              <SummaryStat
                label={t('form.date')}
                value={summaryDateLabel}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5"
                    />
                  </svg>
                }
              />
              <SummaryStat
                label={t('form.lieu')}
                value={lieu}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                }
              />
              <SummaryStat
                label={t('form.redacteur')}
                value={redacteurSummary}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                }
              />
              <SummaryStat
                label={t('form.ordreDuJour')}
                value={t('form.summaryPointsCount', { count: ordreDuJourItems.length })}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12" />
                  </svg>
                }
              />
              <SummaryStat
                label={t('form.participants')}
                value={participantCountLabel}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                  </svg>
                }
              />
              <SummaryStat
                label={t('form.statut')}
                value={t(`statut.${statut}`)}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            </div>
          </SectionCard>

          <SectionCard>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-info/10 text-info flex items-center justify-center flex-shrink-0 mt-0.5">
                  <IconInfo />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('form.helpTitle')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t('form.helpBody')}</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </form>
    </PageContainer>
  )
}
