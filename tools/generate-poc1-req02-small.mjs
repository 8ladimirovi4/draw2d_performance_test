/**
 * client/fixtures/poc1-req02-small.json — POC_1.REQ_02 + JPG 200×200 внизу.
 *
 *   6×7, 35×2 динамика, 40×6, 250 надписей 5 симв., 35×2, изображение JPG.
 *   Фигур: 672 + 1 (Image) = 673
 *
 * Координаты: один вертикальный коридор yCursor, ширина контента ≤ ~860px.
 *
 * Запуск: node tools/generate-poc1-req02-small.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outJson = path.join(root, 'client', 'fixtures', 'poc1-req02-small.json');
const jpegPath = path.join(root, 'client', 'fixtures', 'req02-200x200.jpg');

if (!fs.existsSync(jpegPath)) {
  console.error('Нужен файл', jpegPath);
  process.exit(1);
}

const LX = 16;
const GAP = 28;

let seq = 0;
function uid(kind) {
  seq += 1;
  return 'req02-' + kind + '-' + seq;
}

const figures = [];

function pushRect(x, y, w, h, bg, stroke, radius) {
  figures.push({
    type: 'draw2d.shape.basic.Rectangle',
    id: uid('rect'),
    x,
    y,
    width: w,
    height: h,
    radius: radius !== undefined ? radius : 0,
    bgColor: bg,
    color: stroke || '#333333',
    stroke: 1
  });
}

function pushOval(x, y, w, h, bg) {
  figures.push({
    type: 'draw2d.shape.basic.Oval',
    id: uid('oval'),
    x,
    y,
    width: w,
    height: h,
    bgColor: bg || '#ddeeff',
    color: '#333333',
    stroke: 1
  });
}

function pushCircle(x, y, d, bg) {
  figures.push({
    type: 'draw2d.shape.basic.Circle',
    id: uid('circ'),
    x,
    y,
    width: d,
    height: d,
    bgColor: bg || '#e3f2fd',
    color: '#333333',
    stroke: 1
  });
}

function pushArc(x, y, w, h) {
  figures.push({
    type: 'draw2d.shape.basic.Arc',
    id: uid('arc'),
    x,
    y,
    width: w,
    height: h,
    startAngle: 195,
    endAngle: 345,
    color: '#424242',
    stroke: 1
  });
}

function pushOpAmp(x, y, w, h) {
  figures.push({
    type: 'draw2d.shape.analog.OpAmp',
    id: uid('op'),
    x,
    y,
    width: w,
    height: h,
    color: '#37474f',
    stroke: 1
  });
}

function pushDocument(x, y, w, h, bg) {
  figures.push({
    type: 'draw2d.shape.flowchart.Document',
    id: uid('doc'),
    x,
    y,
    width: w,
    height: h,
    bgColor: bg || '#a5d6a7',
    color: '#2e7d32',
    stroke: 1
  });
}

function pushSlider(x, y, w, h, value) {
  figures.push({
    type: 'draw2d.shape.widget.Slider',
    id: uid('sld'),
    x,
    y,
    width: w,
    height: h,
    value: Math.min(100, Math.max(0, value)),
    bgColor: '#cfd8dc',
    color: '#7cb342',
    stroke: 1,
    radius: 3
  });
}

function pushPie(x, y, diameter, data) {
  figures.push({
    type: 'draw2d.shape.diagram.Pie',
    id: uid('pie'),
    x,
    y,
    width: diameter,
    height: diameter,
    diameter,
    data,
    stroke: 1,
    color: '#37474f'
  });
}

function pushPostIt(x, y, w, h, bg) {
  figures.push({
    type: 'draw2d.shape.note.PostIt',
    id: uid('post'),
    x,
    y,
    width: w,
    height: h,
    text: ' ',
    bgColor: bg || '#f8bbd0',
    color: '#880e4f',
    fontColor: '#4a148c',
    fontSize: 8,
    stroke: 1,
    padding: 2,
    radius: 3
  });
}

function pushLabel(x, y, text, fontSize, fontColor, bold) {
  figures.push({
    type: 'draw2d.shape.basic.Label',
    id: uid('lbl'),
    x,
    y,
    text,
    fontSize: fontSize != null ? fontSize : 11,
    fontColor: fontColor || '#111111',
    bold: !!bold
  });
}

function pushImage(x, y, w, h, path) {
  figures.push({
    type: 'draw2d.shape.basic.Image',
    id: uid('img'),
    x,
    y,
    width: w,
    height: h,
    path: path
  });
}

const COL_GAP = 96;
const DYN_COL = 86;
const PACK_COL = 98;
const LABEL_COL = 34;

let y = 16;

for (let g = 0; g < 6; g++) {
  const gx = LX + g * COL_GAP;
  for (let s = 0; s < 7; s++) {
    const px = gx + (s % 3) * 30;
    const py = y + Math.floor(s / 3) * 30;
    if (s === 0) {
      pushRect(px, py, 26, 24, '#d4d4ee');
    } else if (s === 1) {
      pushOval(px, py, 24, 20, '#dde8ff');
    } else if (s === 2) {
      pushCircle(px, py, 24, '#bbdefb');
    } else if (s === 3) {
      pushOpAmp(px, py, 26, 22);
    } else if (s === 4) {
      pushRect(px, py, 26, 24, '#c5cae9');
    } else if (s === 5) {
      pushOval(px, py, 22, 18, '#d1c4e9');
    } else {
      pushArc(px, py, 28, 24);
    }
  }
}
y += 90 + GAP;

for (let i = 0; i < 35; i++) {
  const col = i % 7;
  const row = Math.floor(i / 7);
  const gx = LX + col * DYN_COL;
  const gy = y + row * 42;
  pushDocument(gx, gy, 40, 28, '#b2dfbc');
  pushSlider(gx + 46, gy + 7, 38, 14, (i * 17) % 101);
}
y += Math.ceil(35 / 7) * 42 + GAP;

for (let g = 0; g < 40; g++) {
  const gcol = g % 8;
  const grow = Math.floor(g / 8);
  const gx = LX + gcol * PACK_COL;
  const gy = y + grow * 72;
  for (let s = 0; s < 6; s++) {
    const px = gx + (s % 3) * 32;
    const py = gy + Math.floor(s / 3) * 34;
    if (s < 5) {
      pushRect(px, py, 28, 32, '#e1f5fe');
    } else {
      const k = (g + grow + gcol) % 4;
      const d = [20, 25, 30, 25][k];
      const rest = 100 - d;
      const q = rest / 3;
      pushPie(px, py, 28, [d, q, q, q]);
    }
  }
}
y += Math.ceil(40 / 8) * 72 + GAP;

for (let i = 0; i < 250; i++) {
  const text = 'N' + String(i).padStart(4, '0');
  const gx = LX + (i % 25) * LABEL_COL;
  const gy = y + Math.floor(i / 25) * 20;
  pushLabel(gx, gy, text);
}
y += Math.ceil(250 / 25) * 20 + GAP;

for (let i = 0; i < 35; i++) {
  const col = i % 7;
  const row = Math.floor(i / 7);
  const gx = LX + col * DYN_COL;
  const gy = y + row * 38;
  pushRect(gx, gy, 38, 28, '#ffe0b2');
  pushPostIt(gx + 44, gy, 38, 28, '#f8bbd0');
}
y += Math.ceil(35 / 7) * 38 + GAP;

pushImage(LX, y, 200, 200, '/fixtures/req02-200x200.jpg');

fs.writeFileSync(outJson, JSON.stringify(figures, null, 2) + '\n');

const types = new Set(figures.map((f) => f.type));
console.log('OK', outJson, 'figures:', figures.length, '(672 контента + JPG)');
console.log('unique type:', types.size);
