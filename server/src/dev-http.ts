/**
 * Minimal development HTTP entry point (Task 6.1).
 *
 * NOT a framework choice (API Framework is still an open decision). This is
 * the thinnest adapter over the route table, using only node:http, so the web
 * build can be exercised manually against a live local API. It follows the
 * adapter contract documented in ./api/routes.ts:
 *   findRoute -> route.handle -> write status + JSON body; unknown route 404;
 *   unexpected errors 500.
 *
 * Run: npm run dev:http   (PORT defaults to 3000, binds to 127.0.0.1 only)
 */
import { createServer } from 'node:http';
import { PrismaClient } from '@prisma/client';
import { findRoute, type ApiServices, type RawQuery } from './api/routes.js';
import { HomeService } from './services/home.service.js';
import { CollectionService } from './services/collection.service.js';
import { MovieService } from './services/movie.service.js';
import { CharacterService } from './services/character.service.js';
import { ProductService } from './services/product.service.js';
import { SearchService } from './services/search.service.js';
import { BuildService } from './services/build.service.js';

const prisma = new PrismaClient();
const services: ApiServices = {
  home: new HomeService(prisma),
  collections: new CollectionService(prisma),
  movies: new MovieService(prisma),
  characters: new CharacterService(prisma),
  products: new ProductService(prisma),
  search: new SearchService(prisma),
  build: new BuildService(prisma),
};

const send = (res: import('node:http').ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const match = findRoute(req.method ?? 'GET', url.pathname);
    if (!match) {
      send(res, 404, { error: { code: 'NOT_FOUND', message: 'Route not found' } });
      return;
    }
    const query: RawQuery = {};
    for (const [key, value] of url.searchParams) if (!(key in query)) query[key] = value;
    const result = await match.route.handle(services, match.params, query);
    send(res, result.status, result.body);
  } catch (error) {
    console.error(error);
    send(res, 500, { error: { code: 'INTERNAL', message: 'Internal server error' } });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, '127.0.0.1', () => {
  console.log(`Dev API listening on http://127.0.0.1:${port}`);
});

const shutdown = () => {
  server.close(() => void prisma.$disconnect().then(() => process.exit(0)));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
