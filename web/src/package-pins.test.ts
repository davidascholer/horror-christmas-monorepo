// @vitest-environment node
/**
 * Dependency policy for web/: React stays on 19, and the frontend foundation
 * packages (router, data cache, Tailwind) are pinned to exact versions.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe('package.json', () => {
  it('keeps React on major version 19', () => {
    for (const name of ['react', 'react-dom']) expect(pkg.dependencies[name], name).toMatch(/^[\^~]?19\./);
  });

  it('pins the router and data cache (runtime) and Tailwind (build-time) to exact versions', () => {
    for (const name of ['react-router', '@tanstack/react-query']) expect(pkg.dependencies[name], name).toMatch(/^\d+\.\d+\.\d+$/);
    for (const name of ['tailwindcss', '@tailwindcss/vite']) expect(pkg.devDependencies[name], name).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('uses React Router v7 and has no extra runtime dependencies', () => {
    expect(pkg.dependencies['react-router']).toMatch(/^7\./);
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['@tanstack/react-query', 'react', 'react-dom', 'react-router']);
  });
});
