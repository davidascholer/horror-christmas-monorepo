import { rm } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Output layout: `dist-static/` is the single deployable artifact.
 *   `vite build`           -> dist-static/assets/*, dist-static/.vite/manifest.json
 *   `npm run build:static` -> dist-static/{collections,movies,...}/, sitemap.xml, robots.txt, images/
 * Vite must not empty the directory (the generator's files may be there), so
 * this plugin removes only Vite's own previous output (hashed assets and the
 * manifest) before each client build. Stale hashed files cannot pile up.
 */
function cleanClientOutput(): Plugin {
  let outDir = '';
  return {
    name: 'clean-client-output',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async buildStart() {
      await rm(path.join(outDir, 'assets'), { recursive: true, force: true });
      await rm(path.join(outDir, '.vite'), { recursive: true, force: true });
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: process.env.VITEST ? [react()] : [react(), tailwindcss(), cleanClientOutput()],
  // The dev server serves public/ (images/fallback.svg). For builds it is off: the static generator
  // copies public/ into the output (copyPublicAssets), the single mechanism, so there is no double copy.
  publicDir: command === 'serve' ? 'public' : false,
  build: {
    outDir: 'dist-static',
    emptyOutDir: false,
    assetsDir: 'assets',
    manifest: true,
    // No index.html input: the client bundle is just the entry, so Vite emits no page that could
    // collide with the generated homepage. The generator adds the tags for it to every page.
    rollupOptions: { input: 'src/entry-client.tsx' },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
}));
