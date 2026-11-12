import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { ocrDevPlugin } from "./vite-ocr-plugin.js";

// Live preview: `npm run dev` -> http://localhost:5173
// Tailwind v4 se učitava preko Vite plugina (bez postcss.config.js).
export default defineConfig({
  // Apsolutna bazna putanja za standardno SPA HTML5 routing rutiranje
  base: "/",
  plugins: [ocrDevPlugin(), react(), tailwindcss()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        headers: {
          Origin: "http://localhost:3000",
        },
      },
    },
  },
});
