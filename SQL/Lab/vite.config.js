import { defineConfig } from 'vite'
import { existsSync } from 'node:fs'
import react from '@vitejs/plugin-react'

// Docker Compose should set VITE_API_PROXY_TARGET=http://api:80 on the web service.
// If it is missing (old container), default to api:80 when running inside Docker — not 127.0.0.1:3000,
// because localhost inside the web container is not the API container (proxy would ECONNREFUSED).
const academyApiTarget =
  process.env.VITE_API_PROXY_TARGET ||
  (existsSync('/.dockerenv') ? 'http://api:80' : 'http://127.0.0.1:3000')

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Same-origin /academy → PHP (avoids hardcoded localhost:3000 + CORS issues)
      '/academy': {
        target: academyApiTarget,
        changeOrigin: true,
      },
    },
  },
})
