import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  ssr: {
    // Dependencies that should be externalized for SSR
    noExternal: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
