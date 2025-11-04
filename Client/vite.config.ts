import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Wszystkie żądania zaczynające się od /api...
      "/api": {
        // ...przekieruj do swojego backendu Go
        target: "http://localhost:8080",
        changeOrigin: true, // Niezbędne do poprawnego działania proxy
        secure: false, // Użyj false, jeśli backend nie ma HTTPS
      },
    },
  },
});
