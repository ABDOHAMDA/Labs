import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker, proxy to API container; locally use localhost:3001
const apiTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
