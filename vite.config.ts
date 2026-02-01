import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";

// Custom plugin for clean URLs in development
function cleanUrlsPlugin() {
  return {
    name: "clean-urls",
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }) {
      server.middlewares.use((req: { url?: string }, res: unknown, next: () => void) => {
        const url = req.url?.split("?")[0] || "";

        // Dev: serve the static homepage at the root (mirrors prod rewrites)
        if (url === "/" || url === "/index.html") {
          req.url = "/homepage.html";
          return next();
        }

        // Skip if already has extension or is an asset
        if (url.includes(".") || url.startsWith("/@") || url.startsWith("/src") || url.startsWith("/node_modules")) {
          return next();
        }

        // Try to find matching .html file in public folder
        const publicPath = path.join(__dirname, "public", url + ".html");
        const rootPath = path.join(__dirname, url + ".html");

        if (fs.existsSync(publicPath)) {
          req.url = url + ".html";
        } else if (fs.existsSync(rootPath)) {
          req.url = url + ".html";
        }

        next();
      });
    },
  };
}

export default defineConfig({
  // Trigger reload
  plugins: [react(), cleanUrlsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@src": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // Listen on all addresses, needed for domain spoofing like rityatra.in
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


