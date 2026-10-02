import { defineConfig } from 'astro/config';

export default defineConfig({
  // Production domain (used for canonical URLs / sitemap).
  site: 'https://kruxpa.xyz',
  // The preview pane hands each dev server its own port via PORT.
  server: { port: Number(process.env.PORT) || 4321 },
  // Sharp with a near-lossless preset for UI screenshots (quality="max"), see src/lib/image-service.ts
  image: { service: { entrypoint: './src/lib/image-service.ts' } },
});
