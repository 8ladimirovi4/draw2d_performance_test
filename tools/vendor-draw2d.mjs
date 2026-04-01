/**
 * Скачивает draw2d (freegroup/draw2d, pin версии) в client/vendor/draw2d.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dest = path.join(root, 'client', 'vendor', 'draw2d', 'draw2d.js');
const url =
  'https://cdn.jsdelivr.net/gh/freegroup/draw2d@v6.6.4/dist/draw2d.js';

function fetchToFile(u, filePath) {
  return new Promise((resolve, reject) => {
    const req = https.get(u, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const loc = res.headers.location;
        if (!loc) {
          reject(new Error('Redirect without location'));
          return;
        }
        fetchToFile(new URL(loc, u).href, filePath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode + ' ' + u));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, Buffer.concat(chunks));
        resolve();
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

await fetchToFile(url, dest);
console.log('draw2d →', dest, '(' + fs.statSync(dest).size + ' bytes)');
