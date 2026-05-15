import { useEffect } from 'react'

interface ShortcutHandlers {
  onJoin?: () => void
  onOpenModal?: () => void
  onCloseModal?: () => void
  onToggleHelp?: () => void
  isAdmin: boolean
  roomOpen: boolean
  joined: boolean
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName
  if (!tag) return false
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement as HTMLElement)?.isContentEditable === true
}

export function useKeyboardShortcuts({
  onJoin,
  onOpenModal,
  onCloseModal,
  onToggleHelp,
  isAdmin,
  roomOpen,
  joined,
}: ShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        case 'r':
          if (roomOpen && !joined && onJoin) {
            e.preventDefault()
            onJoin()
          }
          break
        case 'o':
          if (isAdmin && !roomOpen && onOpenModal) {
            e.preventDefault()
            onOpenModal()
          }
          break
        case 'f':
          if (isAdmin && roomOpen && !joined && onCloseModal) {
            e.preventDefault()
            onCloseModal()
          }
          break
        case '?':
          e.preventDefault()
          onToggleHelp?.()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onJoin, onOpenModal, onCloseModal, onToggleHelp, isAdmin, roomOpen, joined])
}
