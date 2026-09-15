import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/GameSnake/" : "/",
  server: {
    host: "0.0.0.0",
    port: 4821,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4821,
    strictPort: true,
  },
});
