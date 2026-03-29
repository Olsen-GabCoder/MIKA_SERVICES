import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

/** Ligne de formulaire (création / édition matériau multi-fournisseurs). */
export type MateriauOfferFormRow = {
  key: string
  fournisseurId: number | ''
  fournisseurNom: string
  fournisseurContact: string
  prixTtc: string
  datePrix: string
  prixEstime: boolean
}

export type MateriauOffresFournisseurOption = { id: number; nom: string }

function FieldGroup({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="group flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400 group-focus-within:text-primary dark:group-focus-within:text-primary-light transition-colors duration-200">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
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

function SectionHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-700/60">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-white text-sm">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
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

const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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

const IconCalendar = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
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

type Patch = Partial<Omit<MateriauOfferFormRow, 'key'>>

export function MateriauOffresFormSection({
  offers,
  fournisseurs,
  duplicateSupplier,
  onAdd,
  onRemove,
  onUpdateRow,
}: {
  offers: MateriauOfferFormRow[]
  fournisseurs: MateriauOffresFournisseurOption[]
  duplicateSupplier: boolean
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdateRow: (index: number, patch: Patch) => void
}) {
  const { t } = useTranslation('bareme')

  return (
    <SectionCard>
      <SectionHeader
        icon={<IconSupplier />}
        title={t('create.materialSection')}
        subtitle={t('edit.materialMultiSubtitle')}
      />
      <div className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('create.materialSubtitle')}</p>
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary dark:text-primary-light text-sm font-semibold border border-primary/20 hover:border-primary/40 transition-all duration-200 self-start"
          >
            <IconPlus />
            {t('edit.addSupplierOffer')}
          </button>
        </div>

        {duplicateSupplier && (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{t('edit.duplicateSupplier')}</p>
        )}

        <div className="space-y-4">
          {offers.map((row, idx) => {
            const showFallback = row.fournisseurId === ''
            return (
              <div
                key={row.key}
                className="rounded-xl border border-gray-100 dark:border-gray-600/60 bg-gray-50/80 dark:bg-gray-800/40 p-4 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light text-xs font-bold">
                    {t('edit.offerRowBadge', { index: idx + 1 })}
                  </span>
                  {offers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {t('edit.removeOffer')}
                    </button>
                  )}
                </div>

                <FieldGroup label={t('create.fournisseur')} required={!showFallback}>
                  <StyledSelect
                    value={row.fournisseurId === '' ? '' : String(row.fournisseurId)}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : ''
                      onUpdateRow(idx, {
                        fournisseurId: v,
                        fournisseurNom: v !== '' ? '' : row.fournisseurNom,
                      })
                    }}
                  >
                    <option value="">{t('create.selectPlaceholder')}</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
                      </option>
                    ))}
                  </StyledSelect>
                </FieldGroup>

                {showFallback && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        !
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        {t('edit.fournisseurFallbackHint')}
                      </p>
                    </div>
                    <FieldGroup label={t('create.fournisseurNomFallback')}>
                      <StyledInput
                        value={row.fournisseurNom}
                        onChange={(e) => onUpdateRow(idx, { fournisseurNom: e.target.value })}
                        placeholder={t('edit.fournisseurNomPlaceholder')}
                      />
                    </FieldGroup>
                  </div>
                )}

                <FieldGroup label={t('detail.colContact')}>
                  <StyledInput
                    value={row.fournisseurContact}
                    onChange={(e) => onUpdateRow(idx, { fournisseurContact: e.target.value })}
                    placeholder={t('create.contactPlaceholder')}
                  />
                </FieldGroup>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FieldGroup label={t('create.prixUnitaireFcfa')} required>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <IconCurrency />
                      </div>
                      <StyledInput
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.prixTtc}
                        onChange={(e) => onUpdateRow(idx, { prixTtc: e.target.value })}
                        required
                        className="!pl-10"
                        placeholder="0"
                      />
                    </div>
                  </FieldGroup>
                  <FieldGroup label={t('detail.colDatePrix')}>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <IconCalendar />
                      </div>
                      <StyledInput
                        type="date"
                        value={row.datePrix}
                        onChange={(e) => onUpdateRow(idx, { datePrix: e.target.value })}
                        className="!pl-10"
                      />
                    </div>
                  </FieldGroup>
                </div>

                <Toggle
                  checked={row.prixEstime}
                  onChange={(v) => onUpdateRow(idx, { prixEstime: v })}
                  label={t('create.priceEstimated')}
                  badgeLabel={t('create.estimated')}
                />
              </div>
            )
          })}
        </div>
      </div>
    </SectionCard>
  )
}
