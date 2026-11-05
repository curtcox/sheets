import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  outputDir:process.env.SHEETS_TEST_RESULTS??"test-results",
  fullyParallel: true,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : 3,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: process.env.SHEETS_TEST_BASE_URL??"http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  ...process.env.SHEETS_TEST_BASE_URL?{}:{webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: Boolean(process.env.FRAGMENT_KIT_BASE_URL) || !process.env.CI,
  }},
});
