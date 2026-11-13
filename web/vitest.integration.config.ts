import { defineConfig } from 'vitest/config';

// Manual integration checks only (see src/build/fetch-build-data.integration.ts).
// The default `npm test` uses vite.config.ts and never includes these files.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.ts'],
    testTimeout: 60_000,
  },
});
