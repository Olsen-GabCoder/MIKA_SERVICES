import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface KeyboardShortcutsOverlayProps {
  isAdmin: boolean
  onClose: () => void
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-[14px] font-bold text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600 shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsOverlay({ isAdmin, onClose }: KeyboardShortcutsOverlayProps) {
  const { t } = useTranslation('salleReunion')

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const shortcuts = [
    { key: 'R', label: t('shortcuts.join') },
    { key: 'Esc', label: t('shortcuts.leave') },
    ...(isAdmin ? [
      { key: 'O', label: t('shortcuts.open') },
      { key: 'F', label: t('shortcuts.close') },
    ] : []),
    { key: '?', label: t('shortcuts.help') },
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 salle-anim-fade" role="dialog" aria-modal="true" aria-label={t('shortcuts.title')}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[400px] rounded-3xl bg-white dark:bg-neutral-900 p-7 salle-anim-scale border border-neutral-200 dark:border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[18px] font-bold text-neutral-900 dark:text-white">{t('shortcuts.title')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label={t('modal.annuler')}>
            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="space-y-4">
          {shortcuts.map(s => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-[14px] text-neutral-600 dark:text-neutral-400">{s.label}</span>
              <Kbd>{s.key}</Kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
