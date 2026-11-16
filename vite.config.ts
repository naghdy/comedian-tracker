import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths: the same build works at comediantracker.com/ and at the
  // old naghdy.com/comedian-tracker/ path (no router, so nothing needs an absolute base).
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
