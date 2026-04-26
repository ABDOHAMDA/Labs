import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../labSystem");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@lab": labRoot
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
