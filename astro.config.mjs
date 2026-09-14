// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://clicksiu.buzz',
  output: 'server',
  integrations: [react(), sitemap()],
  adapter: cloudflare(),
});