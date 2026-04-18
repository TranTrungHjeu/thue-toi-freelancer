import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const backendTarget = env.VITE_DEV_BACKEND_TARGET || "http://localhost:8080";

  return {
    define: {
      global: "globalThis",
    },
    plugins: [react(), tailwindcss()],
    server: {
      // Lắng nghe tất cả network interface để truy cập được từ ngoài Container
      host: "0.0.0.0",
      port: 5173,
      // Cấu hình HMR cho môi trường Docker (Polling thay vì inotify)
      watch: {
        usePolling: true,
      },
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/ws": {
          target: backendTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
