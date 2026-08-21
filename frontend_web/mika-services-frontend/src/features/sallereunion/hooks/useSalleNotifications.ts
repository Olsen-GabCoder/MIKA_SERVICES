import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SalleReunion } from '@/types/salleReunion'

export function useSalleNotifications(
  salle: SalleReunion | null,
  currentUserId: number | undefined
) {
  const navigate = useNavigate()
  const previousOuverteRef = useRef<boolean | null>(null)

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
    if (wasOuverte || !currentOuverte) return
    // Don't notify the admin who just opened it
    if (salle.ouvertePar?.id === currentUserId) return
    if (typeof Notification === 'undefined') return

    const showNotification = () => {
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

    // Permission demandée uniquement au moment où une notification a du sens
    // (une salle vient de s'ouvrir), pas de facon aggressive au montage.
    if (Notification.permission === 'granted') {
      showNotification()
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') showNotification()
      })
    }
  }, [salle, currentUserId, navigate])
}
