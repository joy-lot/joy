import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: [
      "src/**/*.test.{ts,tsx}",
      "test/safety/**/*.test.{ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "test/golden/**",
      "test/rag-eval/**",
    ],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
