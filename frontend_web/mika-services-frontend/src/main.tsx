import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/store'
import { queryClient } from './services/queryClient'
import { AppRouter } from './router/Router'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { ToastProvider } from './contexts/ToastContext'
import { PWAUpdatePrompt } from './components/pwa/PWAUpdatePrompt'
import { ReconnectionOrchestrator } from './components/pwa/ReconnectionOrchestrator'
import { SyncStatusBadge } from './components/pwa/SyncStatusBadge'
import './index.css'
import { getStoredTheme, applyThemeToDocument } from './utils/themeStorage'
import { getStoredAnimationPreference, applyAnimationsToDocument } from './utils/animationPreferences'
import { i18nReady } from './i18n'

// Kill switch : désenregistre tout SW résiduel en mode développement.
// En dev, VitePWA ne sert pas de SW (devOptions.enabled n'est pas activé).
// Si un SW est présent, c'est un résidu d'un build précédent (npm run build/preview)
// ou d'un autre projet ayant utilisé localhost:5173. On nettoie agressivement au boot.
async function killResidualServiceWorkers() {
  if (!import.meta.env.DEV) return
  if (!('serviceWorker' in navigator)) return
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations.map(async (registration) => {
        const url = registration.active?.scriptURL ?? registration.installing?.scriptURL ?? registration.waiting?.scriptURL ?? 'unknown'
        const success = await registration.unregister()
        if (success) console.info('[dev] Service Worker résiduel désenregistré :', url)
      })
    )
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      if (keys.length > 0) console.info('[dev] Caches résiduels purgés :', keys)
    }
  } catch (error) {
    console.warn('[dev] Échec kill switch SW :', error)
  }
}

// Appliquer le thème et les animations dès le chargement (source: localStorage, avant tout rendu)
applyThemeToDocument(getStoredTheme())
applyAnimationsToDocument(getStoredAnimationPreference())

// Synchronisation état → document après chaque dispatch (thème + animations)
let prevTheme = store.getState().ui.theme
let prevAnimations = store.getState().ui.animationPreference
store.subscribe(() => {
  const state = store.getState().ui
  if (state.theme !== prevTheme) {
    prevTheme = state.theme
    applyThemeToDocument(state.theme)
  }
  if (state.animationPreference !== prevAnimations) {
    prevAnimations = state.animationPreference
    applyAnimationsToDocument(state.animationPreference)
  }
})

// En dev : on attend le kill switch AVANT le render pour éviter que PWAUpdatePrompt
// ré-enregistre le SW pendant le cycle de désinscription.
// En prod : la fonction return immédiatement (import.meta.env.DEV === false → tree-shaké).
killResidualServiceWorkers().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ConfirmProvider>
              <AppRouter />
              <PWAUpdatePrompt />
              <ReconnectionOrchestrator />
              <SyncStatusBadge />
            </ConfirmProvider>
          </ToastProvider>
        </QueryClientProvider>
      </Provider>
    </StrictMode>,
  )
})

// Synchroniser la langue du document dès qu'i18n est prêt (sans bloquer le rendu)
i18nReady.catch(() => {})
