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
