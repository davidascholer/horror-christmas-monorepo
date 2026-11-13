/**
 * Site chrome shared by every page: skip link, header with brand and primary
 * navigation, `main` landmark, footer. Rendered inside `#root`, on the server
 * and in the browser, so it must be identical in both (no browser-only state).
 *
 * Links are plain anchors on purpose: pages are separate static documents and
 * the browser has no page data for another page yet, so client-side
 * navigation would only show a notice. Switch to router links once pages can
 * fetch their own data.
 *
 * There is exactly one <nav>. "Collections" jumps to the featured collections
 * section of the homepage (`/#featured-collections`) because no collections
 * index page exists (open item in OPEN-DECISIONS.md).
 *
 * The homepage lays out its own full-width sections; every other page uses the
 * narrow `page-content` column (styles.css). The shell picks by location, which
 * the server router and the browser router both provide, so the markup is the same on both.
 */
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { FEATURED_COLLECTIONS_HREF, HOME_PATH } from '../routes';

// min-h-11 (44px): a touch target of at least 44px.
const LINK =
  'inline-flex min-h-11 items-center rounded-sm text-slime underline-offset-4 hover:text-slime-soft hover:underline motion-safe:transition-colors';

export function AppShell({ children }: { children: ReactNode }) {
  const isHome = useLocation().pathname === HOME_PATH;
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-2 focus:text-slime focus:ring-2 focus:ring-slime"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-surface">
        <nav aria-label="Site" className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <a
            href={HOME_PATH}
            className="inline-flex min-h-11 items-center rounded-sm text-lg font-bold tracking-wide text-bone hover:text-blood-glow motion-safe:transition-colors motion-safe:hover:animate-flicker"
          >
            Horror Christmas
          </a>
          <ul className="flex items-center gap-5">
            <li>
              <a href={FEATURED_COLLECTIONS_HREF} className={LINK}>
                Collections
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className={`${isHome ? '' : 'page-content '}w-full flex-1 outline-none`}>
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <p className="mx-auto max-w-5xl px-4 py-6 text-sm text-bone-muted sm:px-6">Horror Christmas</p>
      </footer>
    </div>
  );
}
