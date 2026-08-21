/**
 * Service worker Firebase Cloud Messaging — gère les push reçus en arrière-plan.
 * Ce fichier doit être à la racine du site (public/).
 * Il coexiste avec le service worker Workbox (généré par vite-plugin-pwa).
 */
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/11.7.3/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.7.3/firebase-messaging-compat.js')

// Config injectee via query params a l'enregistrement (source unique = src/config/firebase.ts).
// Repli sur les valeurs par defaut si le SW est enregistre sans params (auto-registration Firebase).
const params = new URLSearchParams(self.location.search)
firebase.initializeApp({
  apiKey: params.get('apiKey') || 'AIzaSyBF1hDYrmHC37wa9qhyYqSe5fFX-TiAq5k',
  authDomain: params.get('authDomain') || 'mika-services.firebaseapp.com',
  projectId: params.get('projectId') || 'mika-services',
  storageBucket: params.get('storageBucket') || 'mika-services.firebasestorage.app',
  messagingSenderId: params.get('messagingSenderId') || '598453909387',
  appId: params.get('appId') || '1:598453909387:web:43e34d7af5a9e73ea8218e',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'MIKA Terrain'
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.type ? `mika-${payload.data.type}-${payload.data.id}` : 'mika-notification',
    data: payload.data,
  }
  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data
  let url = '/terrain'
  if (data?.type === 'dma') url = `/terrain?screen=dma-detail&id=${data.id}`
  else if (data?.type === 'transfert') url = `/terrain?screen=transfert-detail&id=${data.id}`

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/terrain') && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
