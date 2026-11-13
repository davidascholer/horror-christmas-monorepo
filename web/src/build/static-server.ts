/**
 * Tiny static file server for checking generated output (Task 6.6), built on
 * node:http only. Mimics what a CDN does for the output directory:
 * `/movies/x/` serves `movies/x/index.html`, files are served with a content
 * type chosen by extension, anything else is 404. Bound to 127.0.0.1.
 * Used by the offline output test and by scripts/verify-static-offline.ts.
 */
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

export const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

/** Maps a URL path to a file path inside `root`, or null if it would leave `root`. */
export function resolveFile(root: string, urlPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  const rel = decoded.endsWith('/') ? decoded + 'index.html' : decoded;
  const file = path.resolve(root, '.' + rel);
  return file.startsWith(path.resolve(root) + path.sep) ? file : null;
}

export interface StaticServer {
  origin: string;
  close(): Promise<void>;
}

export async function startStaticServer(root: string): Promise<StaticServer> {
  const server: Server = createServer((req, res) => {
    void (async () => {
      const file = resolveFile(root, req.url ?? '/');
      const info = file ? await stat(file).catch(() => null) : null;
      if (!file || !info?.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream',
        'Content-Length': body.length,
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    })().catch(() => {
      res.writeHead(500).end();
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
        server.closeAllConnections();
      }),
  };
}
