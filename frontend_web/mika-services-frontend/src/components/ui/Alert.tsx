import { type ReactNode } from 'react'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  children: ReactNode
  onClose?: () => void
}

export const Alert = ({ type, title, children, onClose }: AlertProps) => {
  const typeStyles = {
    success: 'bg-success/10 border-success text-success dark:bg-success/20 dark:border-success dark:text-success',
    error: 'bg-danger/10 border-danger text-danger dark:bg-danger/20 dark:border-danger dark:text-red-400',
    warning: 'bg-warning/10 border-warning text-warning dark:bg-warning/20 dark:border-warning dark:text-warning',
    info: 'bg-info/10 border-info text-info dark:bg-info/20 dark:border-info dark:text-info',
  }

  return (
    <div className={`border rounded-lg p-md dark:bg-gray-800/50 ${typeStyles[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && <h4 className="font-bold mb-xs">{title}</h4>}
          <div className="text-body dark:text-gray-200">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-md text-current opacity-70 hover:opacity-100 dark:text-gray-300"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
