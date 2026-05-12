import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/detect': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 180000,
        proxyTimeout: 180000,
      },
      '/stream': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        ws: true,
        timeout: 180000,
        proxyTimeout: 180000,
      },
      '/analytics': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 60000,
        proxyTimeout: 60000,
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        timeout: 10000,
        proxyTimeout: 10000,
      },
    },
  },
})
