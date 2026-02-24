export const Loading = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex items-center justify-center text-primary">
      <div
        className={`${sizeStyles[size]} border-4 border-primary-light dark:border-gray-600 border-t-primary dark:border-t-primary rounded-full animate-spin`}
      />
    </div>
  )
}
