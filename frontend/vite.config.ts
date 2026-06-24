import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// BR-01: path aliases live in tsconfig.json; vite-tsconfig-paths is the single bridge.
// BR-02: VITE_BFF_URL is consumed at runtime via import.meta.env (validated in lib/env.ts).
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env["VITE_BFF_URL"] ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    chunkSizeWarningLimit: 350,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          tanstack: [
            "@tanstack/react-query",
            "@tanstack/react-router",
            "@tanstack/react-table",
          ],
          graph: ["@xyflow/react", "d3-force", "d3-hierarchy"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
