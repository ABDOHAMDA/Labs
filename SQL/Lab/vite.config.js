import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker, web container reaches PHP via service name "api". On host dev: localhost:3000.
const academyApiTarget =
  process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000'

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
