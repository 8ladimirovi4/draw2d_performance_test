/**
 * Копирует jQuery / jQuery UI из server/node_modules в client/vendor (тот же origin, без CDN).
 * Пытается скачать PNG иконок темы base (в npm их нет); при ошибке сети — только предупреждение.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const nm = path.join(root, 'server', 'node_modules');
const vendor = path.join(root, 'client', 'vendor');
const uiImages = path.join(vendor, 'jquery-ui', 'images');
const baseUrl =
  'https://code.jquery.com/ui/1.13.2/themes/base/images/';

const pngNames = [
  'ui-icons_444444_256x240.png',
  'ui-icons_555555_256x240.png',
  'ui-icons_ffffff_256x240.png',
  'ui-icons_777620_256x240.png',
  'ui-icons_cc0000_256x240.png',
  'ui-icons_777777_256x240.png',
];

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function fetchFile(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const loc = res.headers.location;
        if (!loc) {
          reject(new Error('Redirect without location'));
          return;
        }
        fetchFile(new URL(loc, url).href, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode + ' ' + url));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, Buffer.concat(chunks));
        resolve();
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('timeout ' + url));
    });
  });
}

copy(path.join(nm, 'jquery', 'dist', 'jquery.min.js'), path.join(vendor, 'jquery', 'jquery.min.js'));
copy(
  path.join(nm, 'jquery-ui-dist', 'jquery-ui.min.js'),
  path.join(vendor, 'jquery-ui', 'jquery-ui.min.js')
);
copy(
  path.join(nm, 'jquery-ui-dist', 'jquery-ui.min.css'),
  path.join(vendor, 'jquery-ui', 'jquery-ui.min.css')
);

try {
  fs.mkdirSync(uiImages, { recursive: true });
  for (const name of pngNames) {
    await fetchFile(baseUrl + name, path.join(uiImages, name));
  }
} catch (e) {
  console.warn(
    '[vendor-jquery] PNG темы не загружены (сеть/файрвол). jQuery UI может без иконок:',
    e.message || e
  );
}

console.log('vendor jQuery →', path.join(vendor, 'jquery', 'jquery.min.js'));
console.log('vendor jQuery UI →', path.join(vendor, 'jquery-ui'));
