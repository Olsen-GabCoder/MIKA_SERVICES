import { type ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  headerActions?: ReactNode
}

export const Card = ({ title, subtitle, children, className = '', headerActions }: CardProps) => {
  return (
    <div className={`mika-theme-card rounded-lg border shadow-sm dark:shadow-none ${className}`}>
      {(title || subtitle || headerActions) && (
        <div className="px-lg py-md border-b border-light dark:border-gray-600 flex items-center justify-between">
          <div>
            {title && <h3 className="text-h4 font-bold text-dark dark:text-gray-100">{title}</h3>}
            {subtitle && <p className="text-small text-medium dark:text-gray-400 mt-xs">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="px-lg py-md text-dark dark:text-gray-200">{children}</div>
    </div>
  )
}
