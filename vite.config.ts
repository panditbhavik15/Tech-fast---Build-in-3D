import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    sourcemap: false,
    // Three.js is one deliberate, cacheable chunk; the warning threshold is
    // raised to match that decision instead of hiding it.
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        // Split the heavy 3D and animation runtimes so route-independent code
        // stays small.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("three") || id.includes("@react-three")) return "three";
          if (id.includes("gsap") || id.includes("framer-motion")) return "motion";
        },
      },
    },
  },
});
