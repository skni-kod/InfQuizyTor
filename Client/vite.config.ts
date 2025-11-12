import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ⬇️ NAJPIERW NAJBARDZIEJ SZCZEGÓŁOWA REGUŁA ⬇️
      // Reguła dla USOS API

      // ⬇️ POTEM BARDZIEJ OGÓLNA REGUŁA ⬇️
      // Reguła dla Twojego backendu Go
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        // Tutaj 'rewrite' jest zwykle niepotrzebne,
        // jeśli backend Go też oczekuje ścieżki /api
      },
    },
  },
});
