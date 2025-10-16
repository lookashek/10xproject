// @ts-check
import { defineConfig } from "astro/config";

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
});
