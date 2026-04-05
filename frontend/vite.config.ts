import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://backend:8000',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('react-router')) {
              return 'vendor-router'
            }
            if (
              id.includes('recharts') ||
              id.includes('chart.js') ||
              id.includes('d3')
            ) {
              return 'vendor-charts'
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion'
            }
            return 'vendor-misc'
          }
        },
      },
    },
    chunkSizeWarningLimit: 400,
  },
})