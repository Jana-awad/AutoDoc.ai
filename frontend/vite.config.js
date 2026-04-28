import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, /api/* is forwarded to backend at 127.0.0.1:8000 (strip /api prefix)
      // e.g. /api/v1/business/dashboard/metrics -> http://127.0.0.1:8000/v1/business/dashboard/metrics
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err, req, res) => {
            console.warn(
              "[Vite proxy] Backend request failed. Is the backend running on http://127.0.0.1:8000?",
              err.message,
            );
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            if (proxyRes.statusCode === 404 && req.url?.startsWith("/api/")) {
              console.warn(
                "[Vite proxy] 404 for",
                req.url,
                "- Restart the backend so /v1/business/* routes are loaded.",
              );
            }
          });
        },
      },
    },
  },
  // server: {
  //   host: true,
  //   port: 5173,
  //   strictPort: false,
  //   open: true,
  // },
});
