// @ts-check
import process from "node:process";
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

// Wybierz adapter w zależności od środowiska
const adapter =
  process.env.CF_PAGES === "1" || process.env.CLOUDFLARE
    ? cloudflare({ mode: "directory" })
    : node({ mode: "standalone" });

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter,
  env: {
    schema: {
      // Public variables (dostępne na kliencie i serwerze)
      PUBLIC_SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),
      PUBLIC_SUPABASE_KEY: envField.string({
        context: "client",
        access: "public",
        optional: false,
      }),

      // Server-only variables
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true, // Must be optional for Cloudflare runtime compatibility
      }),

      // Test variables
      E2E_USERNAME: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      E2E_PASSWORD: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      E2E_USERNAME_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },
});
