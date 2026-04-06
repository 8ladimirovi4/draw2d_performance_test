import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import fastify from 'fastify';
import fastifyStatic from '@fastify/static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const clientRoot = path.join(__dirname, '..', 'client');

async function buildServer() {
  const app = fastify({ logger: true });

  await app.register(fastifyStatic, {
    root: clientRoot,
    prefix: '/',
    index: ['index.html'],
    decorateReply: false,
  });

  return app;
}

async function main() {
  const app = await buildServer();
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || 'localhost';
  await app.listen({ port, host });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
