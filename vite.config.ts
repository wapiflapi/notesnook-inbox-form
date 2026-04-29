import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const macScrollbarPath = fileURLToPath(
  new URL("./node_modules/mac-scrollbar/dist/mac-scrollbar.module.js", import.meta.url)
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: "mac-scrollbar", replacement: macScrollbarPath }]
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    server: {
      deps: {
        inline: ["@notesnook/editor", "@notesnook/theme", "@notesnook/ui", "mac-scrollbar"]
      }
    }
  }
});
