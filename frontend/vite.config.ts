import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Escuchar en todas las interfaces (0.0.0.0)
    port: 3000,
    watch: {
      usePolling: true, // Necesario para hot-reload en Docker
    },
    proxy: {
      "/api": {
        // En Docker usar el nombre del servicio, localmente usar localhost
        target: process.env.VITE_BACKEND_URL || "http://backend:5000",
        changeOrigin: true,
      },
    },
  },
});
