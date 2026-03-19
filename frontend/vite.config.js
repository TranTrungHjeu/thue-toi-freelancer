import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Lắng nghe tất cả network interface để truy cập được từ ngoài Container
    host: '0.0.0.0',
    port: 5173,
    // Cấu hình HMR cho môi trường Docker (Polling thay vì inotify)
    watch: {
      usePolling: true,
    },
  },
})

