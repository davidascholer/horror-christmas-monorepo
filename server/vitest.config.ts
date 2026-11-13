import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // All DB tests share one PostgreSQL database and some assert on global
    // catalog state (e.g. home.service.test runs in a rolled-back transaction).
    // Run files serially so suites cannot observe each other's fixtures.
    fileParallelism: false,
  },
});
