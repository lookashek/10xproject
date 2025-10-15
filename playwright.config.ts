import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Najpierw załaduj .env.test
loadEnv({ path: ".env.test", override: false });

// Jeśli testujemy lokalnie z mockowanym serwerem, domyślne poświadczenia (tylko jeśli nie są w .env.test)
process.env.PUBLIC_SUPABASE_URL ??= "http://localhost:54321";
process.env.PUBLIC_SUPABASE_KEY ??= "public-anon-key";

const mapEnv = (source: string, target: string) => {
  if (!process.env[target] && process.env[source]) {
    process.env[target] = process.env[source];
  }
};

mapEnv("NEXT_PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_URL");
mapEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "PUBLIC_SUPABASE_KEY");
mapEnv("PUBLIC_SUPABASE_URL", "SUPABASE_URL");
mapEnv("PUBLIC_SUPABASE_KEY", "SUPABASE_KEY");

// Walidacja zmiennych środowiskowych (pomijamy w CI, bo są ustawiane w kroku testu)
if (!process.env.CI) {
  const requiredEnvVars = ["PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_KEY", "E2E_USERNAME", "E2E_PASSWORD"];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable '${key}'. Check your .env.test file.`);
    }
  }
}

const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 30 * 1000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Uruchamiaj testy sekwencyjnie (jeden web server)
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1366, height: 768 },
    headless: true,
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev:e2e",
    url: BASE_URL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "test",
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || "",
      PUBLIC_SUPABASE_ANON_KEY: process.env.PUBLIC_SUPABASE_ANON_KEY || "",
      PUBLIC_SUPABASE_KEY: process.env.PUBLIC_SUPABASE_KEY || "",
    },
  },
});
