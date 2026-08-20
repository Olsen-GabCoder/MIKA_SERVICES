import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    // docx et xlsx : ne pas pré-bundler (évite ENOENT build/index.mjs et 504 Outdated Optimize Dep)
    exclude: ['docx', 'xlsx'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: [
        'Logo_mika_services.png',
        'flags/fr.png',
        'flags/gb.png',
      ],
      manifest: {
        name: 'MIKA Services',
        short_name: 'MIKA',
        description: 'Plateforme de gestion de projets BTP — MIKA Services',
        theme_color: '#FF6B35',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'apple-touch-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globIgnores: [
          '**/react-pdf.browser-*.js',
          '**/exceljs.min-*.js',
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/ws/,
        ],
        runtimeCaching: [
          // Auth : JAMAIS cacher (cycle 401→refresh→retry)
          {
            urlPattern: /\/api\/auth\//,
            handler: 'NetworkOnly',
          },
          // Sessions utilisateur : toujours frais
          {
            urlPattern: /\/api\/users\/me\/sessions/,
            handler: 'NetworkOnly',
          },
          // Identité : NetworkFirst avec timeout court (fallback offline-cache existant)
          {
            urlPattern: /\/api\/users\/me(\/|$)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mika-user-identity',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] },
            },
          },
          // Audit : écriture seule, pas de cache
          {
            urlPattern: /\/api\/audit\//,
            handler: 'NetworkOnly',
          },
          // WebSocket : bypass complet
          {
            urlPattern: /\/ws(\/|$|\?)/,
            handler: 'NetworkOnly',
          },
          // App terrain : un seul mécanisme de cache (responseCache localStorage) —
          // pas de cache SW qui masquerait l'état réel après un replay offline.
          {
            urlPattern: /\/api\/terrain\//,
            handler: 'NetworkOnly',
          },
          // API REST générale : Network-First avec fallback cache
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mika-api-cache',
              networkTimeoutSeconds: 10,
              fetchOptions: { credentials: 'include' as const },
              cacheableResponse: { statuses: [200] },
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
          // Google Fonts — stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          // Google Fonts — fichiers de police (cross-origin, status 0 accepté)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
    // Copie index.html vers 404.html après build (SPA fallback pour hébergeurs qui servent 404.html)
    {
      name: 'copy-404',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist')
        const indexPath = path.join(outDir, 'index.html')
        const notFoundPath = path.join(outDir, '404.html')
        if (fs.existsSync(indexPath)) {
          fs.copyFileSync(indexPath, notFoundPath)
        }
      },
    },
  ],
  server: {
    port: 5173,
    strictPort: false,
    host: '127.0.0.1',
    // Backend sert sous context-path /api (aligné avec API_BASE_URL).
    // Les en-têtes Set-Cookie du backend sont transmis tels quels (cookie refreshToken pour la durée de session).
    proxy: {
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
