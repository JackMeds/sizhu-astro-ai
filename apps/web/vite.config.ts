import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const repoBase = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = process.env.GITHUB_ACTIONS && repoBase ? `/${repoBase}/` : "/";

export default defineConfig({
  base,
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
