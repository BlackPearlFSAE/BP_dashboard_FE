import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Split vendor code into dedicated chunks so chart.js (and its heavy
  // peers) only download on routes that actually render charts, and
  // react stays cacheable across deploys. See docs/code-splitting.md.
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': [
            'chart.js',
            'react-chartjs-2',
            'chartjs-plugin-zoom',
            'chartjs-adapter-date-fns',
            'hammerjs',
          ],
        },
      },
    },
  },
  // Dev server proxy — FE & BE share origin in prod (nginx), so we mirror
  // that in dev by proxying /api and /ws to the local backend on :3000.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
})
