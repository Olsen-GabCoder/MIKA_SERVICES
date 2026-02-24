import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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
    // Backend sert sous context-path /api (aligné avec API_BASE_URL)
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
