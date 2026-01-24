import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost', // Use localhost to avoid permission issues
    port: 5173,
    watch: {
      usePolling: true, // Better for Docker/WSL
    },
    hmr: {
      overlay: true, // Show error overlay
    },
  },
  build: {
    sourcemap: true, // Better debugging
  },
  optimizeDeps: {
    include: ['mermaid'],
  },
})
