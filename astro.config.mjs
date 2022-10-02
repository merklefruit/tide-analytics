import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import image from "@astrojs/image";
import preact from "@astrojs/preact";

import { SITE } from "./src/config";

export default defineConfig({
  site: SITE.origin,
  base: SITE.basePath,
  output: "static",

  integrations: [
    tailwind({ config: { applyBaseStyles: false } }),

    sitemap(),

    image(),

    preact({ compat: true }),
  ],
});
