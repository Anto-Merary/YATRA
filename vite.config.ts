import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  // Trigger reload
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@src": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    // Ensure preview server handles SPA routing
    port: 4173,
  },
  build: {
    // Ensure build outputs are optimized
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        mobile: path.resolve(__dirname, "mobile.html"),
      },
    },
  },
});


