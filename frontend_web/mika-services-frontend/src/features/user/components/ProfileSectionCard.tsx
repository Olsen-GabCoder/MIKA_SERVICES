import type { ReactNode } from 'react'

/** Ligne d'accent en haut des cartes profil — cohérent avec la charte (primary). */
function ProfileCardAccent() {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-primary-light to-primary rounded-t-xl pointer-events-none"
      aria-hidden
    />
  )
}

/** Styles unifiés pour toutes les cartes de la page Profil — design premium, cohérent avec le reste de l'app. */
export const PROFILE_CARD_CLASS =
  'relative overflow-hidden flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 ' +
  'shadow-[0_1px_3px_0_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.2)] ' +
  'transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-primary/20 dark:hover:border-primary/30'

export const PROFILE_CARD_HEADER_CLASS =
  'px-6 py-4 border-b border-gray-200 dark:border-gray-600 shrink-0 flex items-center gap-3 ' +
  'bg-gradient-to-r from-gray-50 to-gray-100/80 dark:from-gray-700/50 dark:to-gray-700/30'

export const PROFILE_CARD_BODY_CLASS =
  'p-6 flex-1 flex flex-col gap-5 text-gray-900 dark:text-gray-100 min-h-0'

export const PROFILE_CARD_ICON_CLASS =
  'w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 ring-1 ring-primary/10 ring-inset'

interface ProfileSectionCardProps {
  /** Contenu de l'en-tête : icône + titre (et optionnellement sous-titre). */
  header: ReactNode
  children: ReactNode
  /** Pour étendre la carte et remplir l'espace vertical (ex. colonne gauche, dernière carte). */
  fill?: boolean
  className?: string
}

export function ProfileSectionCard({
  header,
  children,
  fill = false,
  className = '',
}: ProfileSectionCardProps) {
  return (
    <section
      className={`${PROFILE_CARD_CLASS} ${fill ? 'min-h-[200px] flex-1' : ''} ${className}`.trim()}
    >
      <ProfileCardAccent />
      <div className={PROFILE_CARD_HEADER_CLASS}>{header}</div>
      <div className={PROFILE_CARD_BODY_CLASS}>{children}</div>
    </section>
  )
}

interface ProfileSectionCardHeaderProps {
  icon: ReactNode
  title: string
  subtitle?: string
}

export function ProfileSectionCardHeader({ icon, title, subtitle }: ProfileSectionCardHeaderProps) {
  return (
    <>
      <div className={PROFILE_CARD_ICON_CLASS}>{icon}</div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </>
  )
}

export { ProfileCardAccent }
