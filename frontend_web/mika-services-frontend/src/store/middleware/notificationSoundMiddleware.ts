import type { Middleware } from '@reduxjs/toolkit'
import { playNotificationSound } from '@/utils/playNotificationSound'

/**
 * Joue un son lorsque une notification ou un message temps réel est reçu,
 * si l'utilisateur a activé le son des notifications.
 */
export const notificationSoundMiddleware: Middleware = (store) => (next) => (action: unknown) => {
  const result = next(action)
  const type = (action as { type?: string })?.type
  if (
    type === 'communication/addRealtimeNotification' ||
    type === 'communication/addRealtimeMessage'
  ) {
    const state = store.getState()
    if (state.auth.user?.notificationSoundEnabled !== false) {
      playNotificationSound()
    }
  }
  return result
}
