import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // The same '@/' -> src mapping tsconfig.app.json declares. TypeScript
    // only type-checks it; Vite is what actually resolves it at build time,
    // so both have to be told or the types pass and the bundle fails.
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
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
