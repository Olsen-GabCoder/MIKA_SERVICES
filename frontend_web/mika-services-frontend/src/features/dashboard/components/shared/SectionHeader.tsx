export interface SectionHeaderProps {
  title: string
  number?: number
  action?: { label: string; onClick: () => void }
}

export function SectionHeader({ title, number, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5 mt-2">
      <div className="flex items-center gap-2.5">
        {/* Gradient bar: orange → teal */}
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-[#48B5A0]" />
        <h2 className="text-xs font-bold text-[var(--db-text-muted)] uppercase tracking-widest">
          {title}
        </h2>
        {number !== undefined && (
          <span className="text-[10px] font-semibold text-[var(--db-text-faint)] bg-[var(--db-border-subtle)] rounded-full w-5 h-5 flex items-center justify-center">
            {number}
          </span>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-xs font-semibold text-[var(--db-accent)] hover:underline min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {action.label} &rarr;
        </button>
      )}
    </div>
  )
}
