import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SalleReunion } from '@/types/salleReunion'

const PERMISSION_KEY = 'salle-notification-asked'

function hasAskedPermission(): boolean {
  try {
    return sessionStorage.getItem(PERMISSION_KEY) === '1'
  } catch {
    return false
  }
}

function markAsked(): void {
  try {
    sessionStorage.setItem(PERMISSION_KEY, '1')
  } catch { /* noop */ }
}

export function useSalleNotifications(
  salle: SalleReunion | null,
  currentUserId: number | undefined
) {
  const navigate = useNavigate()
  const previousOuverteRef = useRef<boolean | null>(null)

  // Request notification permission once per session
  useEffect(() => {
    if (hasAskedPermission()) return
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'default') {
      Notification.requestPermission()
      markAsked()
    }
  }, [])

  useEffect(() => {
    if (!salle) return

    const currentOuverte = salle.ouverte

    // First load: initialize without notifying
    if (previousOuverteRef.current === null) {
      previousOuverteRef.current = currentOuverte
      return
    }

    const wasOuverte = previousOuverteRef.current
    previousOuverteRef.current = currentOuverte

    // Detect transition: closed -> open
    if (!wasOuverte && currentOuverte) {
      // Don't notify the admin who just opened it
      if (salle.ouvertePar?.id === currentUserId) return

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const notif = new Notification('Salle MIKA en direct', {
          body: 'Cliquez pour rejoindre la salle de reunion.',
          icon: '/Logo_mika_services.png',
          tag: 'salle-mika-live',
        })
        notif.onclick = () => {
          window.focus()
          navigate('/salle-mika')
          notif.close()
        }
      }
    }
  }, [salle, currentUserId, navigate])
}
