import { cloneElement, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { useIsOnline } from '@/hooks/useConnectivity'

interface OfflineDisabledButtonProps {
  /** Le bouton enfant à wrapper */
  children: ReactElement<{ disabled?: boolean; className?: string }>
  /** Clé i18n du tooltip affiché quand offline (défaut: 'offline.actionUnavailable') */
  tooltipKey?: string
}

/**
 * Wrapper qui désactive un bouton quand la connexion est absente.
 * Respecte le `disabled` métier original du bouton enfant.
 */
export function OfflineDisabledButton({
  children,
  tooltipKey = 'offline.actionUnavailable',
}: OfflineDisabledButtonProps) {
  const { t } = useTranslation('common')
  const isOnline = useIsOnline()

  if (isOnline) return children

  const child = children
  const cloned = cloneElement(child, {
    disabled: true,
    className: [child.props.className, 'opacity-50 cursor-not-allowed'].filter(Boolean).join(' '),
  })

  return (
    <span title={t(tooltipKey)}>
      {cloned}
    </span>
  )
}
