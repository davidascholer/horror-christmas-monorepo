/**
 * The HTML document around the app (server render only).
 *
 * Document owns <html>, <head> and the scripts. The app itself (shell, routes,
 * page) lives in `#root` and is what the browser hydrates, so everything the
 * browser must reproduce is inside `#root` and nothing else is.
 *
 * Head: `head` carries the per-page title, meta description, canonical link,
 * Open Graph tags and Schema.org JSON-LD (buildPageHead, page-head.tsx). They
 * are written directly inside <head>, so React's hoisting has nothing to move
 * and there is exactly one of each. Stylesheet and preload links from the
 * client build manifest are added after it.
 *
 * Scripts (the complete allowed set, asserted in static-output.test.ts):
 *   1. application/ld+json  (in `head`)
 *   2. application/json     (hydration data, #__PAGE_DATA__)
 *   3. one <script type="module" src> for the client entry
 * No inline executable script, no inline event handlers.
 */
import type { ReactNode } from 'react';
import type { ClientAssets } from './client-assets';
import { PAGE_DATA_ELEMENT_ID, type HydrationPayload } from '../app/page-data';
import { serializeJsonForScript } from './safe-json';

export interface DocumentProps {
  head: ReactNode;
  assets: ClientAssets;
  payload: HydrationPayload;
  /** The rendered app (the contents of #root). */
  children: ReactNode;
}

export function Document({ head, assets, payload, children }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {head}
        {assets.css.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        {assets.modulePreload.map((href) => (
          <link key={href} rel="modulepreload" href={href} />
        ))}
        <script type="module" src={assets.entry} />
      </head>
      <body>
        <div id="root">{children}</div>
        <script
          type="application/json"
          id={PAGE_DATA_ELEMENT_ID}
          dangerouslySetInnerHTML={{ __html: serializeJsonForScript(payload) }}
        />
      </body>
    </html>
  );
}
