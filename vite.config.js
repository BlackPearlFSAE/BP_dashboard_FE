import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const isLocal = env.VITE_BACKEND === 'local'
  const apiTarget = isLocal ? 'http://localhost:3000' : 'https://blackpearl-ws-8z9a.onrender.com'
  const wsTarget  = isLocal ? 'ws://localhost:3000'  : 'wss://blackpearl-ws-8z9a.onrender.com'

  return {
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
    // Config development server (for npm run dev)
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: !isLocal,
          secure: !isLocal,
        },
        '/ws': {
          target: wsTarget,
          changeOrigin: !isLocal,
          secure: !isLocal,
          ws: true,
        },
      },
    },
  }
})
