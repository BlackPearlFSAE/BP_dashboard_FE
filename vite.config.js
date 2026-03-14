import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://mctrl.kmutt.ac.th/ken-api',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'https://mctrl.kmutt.ac.th/ken-api',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
