import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Khi chạy `vite dev` thuần (không qua wrangler pages dev),
      // proxy /api sang wrangler đang chạy ở cổng 8788.
      '/api': 'http://127.0.0.1:8788',
    },
  },
})
