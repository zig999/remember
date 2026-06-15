import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.{test,spec}.ts", "src/__tests__/**/*.{test,spec}.ts"],
    setupFiles: ["./vitest.setup.ts"],
    reporters: ["default"],
    clearMocks: true,
  },
});
