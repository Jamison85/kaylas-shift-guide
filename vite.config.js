import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/kaylas-shift-guide/",
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: chunk => chunk.name === "TillPreview" ? "till-preview/[name]-[hash].js" : "assets/[name]-[hash].js",
        assetFileNames: asset => asset.names?.includes("TillPreview.css") ? "till-preview/[name]-[hash][extname]" : "assets/[name]-[hash][extname]",
      },
    },
  },
});
