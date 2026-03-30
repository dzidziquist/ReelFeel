import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/static/',
  plugins: [react(), tailwindcss()],
  server: {
    base: '/',        // dev server keeps root base for hot-reload
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
