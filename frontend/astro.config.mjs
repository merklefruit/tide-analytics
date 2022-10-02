import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import image from "@astrojs/image";
import preact from "@astrojs/preact";
import vercel from "@astrojs/vercel/serverless";

import { SITE } from "./src/config";

export default defineConfig({
  site: SITE.origin,
  base: SITE.basePath,
  output: "server",
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: true,
      },
    }),
    sitemap(),
    image(),
    preact({
      compat: true,
    }),
  ],
  adapter: vercel(),
});
