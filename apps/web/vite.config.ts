import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Expose on the LAN so a phone can open http://<pc-ip>:5173 in the gym.
    host: true,
    // The web app calls /api/*; Vite forwards it to Nest so the phone never
    // needs to reach the API port directly.
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
