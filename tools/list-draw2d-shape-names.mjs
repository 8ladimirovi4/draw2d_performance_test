import https from 'node:https';

const url =
  'https://cdn.jsdelivr.net/gh/freegroup/draw2d@v6.6.4/dist/draw2d.js';

const data = await new Promise((resolve, reject) => {
  https
    .get(url, (r) => {
      let d = '';
      r.on('data', (c) => {
        d += c;
      });
      r.on('end', () => resolve(d));
    })
    .on('error', reject);
});

const re = /NAME:\s*["'](draw2d\.shape[^"']+)["']/g;
const found = new Set();
let m;
while ((m = re.exec(data)) !== null) {
  found.add(m[1]);
}

const list = [...found].sort();
console.log('Unique NAME count:', list.length);
for (const n of list) {
  console.log(n);
}
