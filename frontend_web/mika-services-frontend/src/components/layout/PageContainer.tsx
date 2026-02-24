import type { ReactNode } from 'react'

type PageContainerSize = 'narrow' | 'default' | 'wide' | 'full'

interface PageContainerProps {
  children: ReactNode
  /** narrow: formulaires simples | default: profil, fiche, formulaire multi-colonnes | wide: listes, tableaux | full: dashboard, pas de max-width */
  size?: PageContainerSize
  className?: string
}

const sizeClasses: Record<PageContainerSize, string> = {
  narrow: 'max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl',
  default: 'max-w-full lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[90rem]',
  wide: 'max-w-full xl:max-w-6xl 2xl:max-w-[90rem]',
  full: 'max-w-full',
}

export const PageContainer = ({ children, size = 'default', className = '' }: PageContainerProps) => {
  return (
    <div className={`w-full mx-auto ${sizeClasses[size]} ${className}`.trim()} role="main">
      {children}
    </div>
  )
}
