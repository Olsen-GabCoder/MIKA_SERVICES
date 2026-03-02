import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { store } from './store/store'
import { queryClient } from './services/queryClient'
import { AppRouter } from './router/Router'
import { ConfirmProvider } from './contexts/ConfirmContext'
import './index.css'
import { getStoredTheme, applyThemeToDocument } from './utils/themeStorage'
import { getStoredAnimationPreference, applyAnimationsToDocument } from './utils/animationPreferences'
import { i18nReady } from './i18n'

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

// Rendre l'app immédiatement pour afficher les pages plus vite ; i18n s'hydrate en parallèle (évite écran blanc prolongé).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <AppRouter />
        </ConfirmProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)

// Synchroniser la langue du document dès qu'i18n est prêt (sans bloquer le rendu)
i18nReady.catch(() => {})
