import { defineConfig } from "@playwright/test";

/** E2E runs against an already-running dev server (npm run dev). Override with BASE_URL. */
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000" },
});
