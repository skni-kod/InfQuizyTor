import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // JEDYNA REGUŁA: Wszystkie żądania /api/* idą do backendu Go
      "/api": {
        target: "http://localhost:8080", // Adres Twojego serwera Go
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
