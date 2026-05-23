import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.{ts,tsx}"],
      exclude: ["lib/abi.ts", "lib/wagmi.ts", "lib/chains.ts", "lib/types.ts"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname
    }
  }
});
