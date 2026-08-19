import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages serves the custom domain from the origin root, not the
  // repository project-path used by the legacy github.io URL.
  base: "/",
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ["mc.upcraft.cn"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@sizhu/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@sizhu/prompt": path.resolve(__dirname, "../../packages/prompt/src/index.ts"),
      "@sizhu/render": path.resolve(__dirname, "../../packages/render/src/index.ts")
    }
  }
});
