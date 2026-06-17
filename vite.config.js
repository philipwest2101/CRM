import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base so the build works on GitHub Pages (served from a
  // /<repo-name>/ subpath) as well as locally and on any other host.
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
