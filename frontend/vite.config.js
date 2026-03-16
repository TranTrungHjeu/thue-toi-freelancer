import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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

