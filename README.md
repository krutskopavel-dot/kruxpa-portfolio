# Portfolio

Pavel Krutsko's portfolio. Astro 7, plain CSS with tokens from Figma, images through `astro:assets`.
Design source: Figma file "Test", homepage frame **Home v3** (`231:15234`).

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

## Structure

- `src/pages/index.astro` — homepage (Header → Hero → Selected work → What I do → About → Contact CTA → Footer)
- `src/pages/work/` — case studies (DISio, Artchain); shared case components in `src/components/case/`
- `src/components/` — one component per section
- `src/styles/global.css` — fonts and design tokens
- `src/site.ts` — name, contact links, CV file
- `showreel/` — original prototype of the hero showreel (the site uses `src/components/Showreel.astro`)
- `tools/video-fx/` — local tool for the portrait loop video

## Fonts

ABC Areal and ABC Areal Mono (Dinamo, Free Fonts License) are in `public/fonts/` as WOFF2.
Young Serif (the "clear." accent) is SIL OFL.

## Deploy

Vercel detects Astro automatically: import the repo, keep the default build (`npm run build`, output `dist`).
