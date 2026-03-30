/**
 * Вставляет или заменяет содержимое mxGraph XML в элементе <Model> внутри <Scheme> файла .mtp.
 *
 * Режим замены (по умолчанию): ищется <Scheme> с заданными ID / Version / Name>, подменяется <Model>.
 *
 * Режим добавления: node tools/embed-scheme-model.mjs --add ...
 *   Новый блок <Scheme> вставляется перед </SchemeSet> (после существующих схем).
 *
 * Использование:
 *   node tools/embed-scheme-model.mjs [--add] <mtp> [xml] [Scheme-ID] [Name] [Version]
 *
 * Без аргументов (не --add): mtp и xml по умолчанию для схемы buttons (замена).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let argv = process.argv.slice(2);
const addMode = argv[0] === '--add';
if (addMode) argv = argv.slice(1);

const mtpPath = resolve(argv[0] || join(root, 'scada_projects/test_schemes_2.mtp'));
const xmlPath = resolve(
  argv[1] || join(root, 'test_schemes/mxGraph(xml)/buttons.xml')
);
const schemeId =
  argv[2] || (addMode ? randomUUID() : '518b51c4-6602-4285-9056-4d17f9498d39');
const schemeName =
  argv[3] ||
  (addMode ? basename(xmlPath, extname(xmlPath)) : 'buttons');
const schemeVersion = argv[4] || '3.0';

/** Убирает UTF-8 BOM — иначе некоторые загрузчики .mtp дают «лишние данные до корня» / ошибка XML. */
function stripBom(s) {
  if (!s || s.charCodeAt(0) !== 0xfeff) return s;
  return s.slice(1);
}

function escapeXmlText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeXmlAttr(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let mtp = stripBom(readFileSync(mtpPath, 'utf8'));
const raw = stripBom(readFileSync(xmlPath, 'utf8').trim());
const esc = escapeXmlText(raw);

if (addMode) {
  if (mtp.includes(`ID="${schemeId}"`)) {
    console.error('Схема с таким ID уже есть в файле:', schemeId);
    process.exit(1);
  }
  const nameAttr = escapeXmlAttr(schemeName);
  const block = `\n        <Scheme ID="${schemeId}" Version="${schemeVersion}" Name="${nameAttr}">\n          <Model>${esc}</Model>\n        </Scheme>`;
  const insertRe = /(\n)(      <\/SchemeSet>)/;
  if (!insertRe.test(mtp)) {
    console.error('Не найден закрывающий тег </SchemeSet> в:', mtpPath);
    process.exit(1);
  }
  mtp = mtp.replace(insertRe, `$1${block}$1$2`);
} else {
  const re = new RegExp(
    `(<Scheme ID="${schemeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" Version="${schemeVersion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" Name="${schemeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">\\s*)<Model>[\\s\\S]*?<\\/Model>(\\s*<\\/Scheme>)`
  );

  if (!re.test(mtp)) {
    console.error(
      'Не найден блок Scheme с указанными ID / Version / Name. Для новой схемы используйте --add:',
      mtpPath
    );
    process.exit(1);
  }

  mtp = mtp.replace(re, (_, open, close) => `${open}<Model>${esc}</Model>${close}`);
}

writeFileSync(mtpPath, mtp, 'utf8');
console.info(addMode ? 'Добавлена схема в:' : 'Обновлён:', mtpPath);
console.info('Источник модели:', xmlPath);
console.info('Scheme ID:', schemeId, 'Name:', schemeName, 'Version:', schemeVersion);
console.info('Размер экранированной модели (символов):', esc.length);
