import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-md py-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-primary/50 ${
            error ? 'border-danger dark:border-danger' : 'border-medium dark:border-gray-600'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-xs text-small text-danger dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
