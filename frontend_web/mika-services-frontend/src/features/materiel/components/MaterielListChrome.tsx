import { useMemo, type ReactNode } from 'react'

const DEBOUNCE_MS = 350
export { DEBOUNCE_MS }

export function MaterielStatPill({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: ReactNode
}) {
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

export function MaterielEmptyState({
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        ) : (
          <svg className="w-9 h-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11"
            />
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

export function MaterielPagination({
  currentPage,
  totalPages,
  size,
  onPageChange,
  onSizeChange,
  labelRange,
  labelPrev,
  labelNext,
  labelPerPage,
}: {
  currentPage: number
  totalPages: number
  size: number
  onPageChange: (p: number) => void
  onSizeChange: (s: number) => void
  labelRange: string
  labelPrev: string
  labelNext: string
  labelPerPage: string
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
        <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span className="sr-only">{labelPerPage}</span>
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            aria-label={labelPerPage}
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s} / {labelPerPage}
              </option>
            ))}
          </select>
        </label>
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

export const IconGrid = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125H9.375m3.75-3.75h-3.75"
    />
  </svg>
)

export const IconClock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export const IconAlert = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
)
