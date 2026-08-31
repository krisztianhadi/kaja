import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/__tests__/**/*.test.ts"],
    // day-boundary tests (backdate) depend on local-time math - pin the
    // timezone so they pass on any runner, not just Bangkok
    env: {
      TZ: "Asia/Bangkok",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
