import { defineConfig } from 'astro/config';

export default defineConfig({
  // Set to the production domain once it is known (used for canonical URLs / sitemap).
  // site: 'https://example.com',
  // The preview pane hands each dev server its own port via PORT.
  server: { port: Number(process.env.PORT) || 4321 },
});
