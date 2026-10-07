// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jaalip.com',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
});
