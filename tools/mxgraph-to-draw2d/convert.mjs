/**
 * Converts mxGraph / draw.io-style mxGraphModel XML (обёртки: bus, load, link, label, …)
 * в документ для draw2d.io.json.Reader: фигуры + рёбра как PolyLine по sourcePoint/targetPoint.
 *
 * Usage:
 *   node convert.mjs <input.xml> <output.json | output_dir>
 * Если второй аргумент — каталог (существующий или без расширения .json), записывается
 *   <имя_входа>.json в этот каталог (папки создаются при необходимости).
 * Example:
 *   node convert.mjs ../../test_schemes/mxGraph(xml)/buttons.xml ../../client/fixtures/buttons.json
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMParser } from '@xmldom/xmldom';

const toolDir = dirname(fileURLToPath(import.meta.url));

/** Обертки без фигуры (только model root). */
const SKIP_WRAPPER_TAGS = new Set(['object']);

/**
 * @param {string} inPath absolute input xml path
 * @param {string | undefined} outArg argv output (file or directory)
 */
function resolveOutputPath(inPath, outArg) {
  if (!outArg) {
    return resolve(toolDir, '../../client/fixtures/buttons.json');
  }
  const r = resolve(outArg);
  let st = null;
  try {
    st = statSync(r);
  } catch (e) {
    if (/** @type {NodeJS.ErrnoException} */ (e).code !== 'ENOENT') throw e;
  }
  if (st?.isDirectory()) {
    return join(r, `${basename(inPath, extname(inPath))}.json`);
  }
  if (!st) {
    if (extname(r).toLowerCase() === '.json') {
      return r;
    }
    return join(r, `${basename(inPath, extname(inPath))}.json`);
  }
  return r;
}

function parseStyle(styleStr) {
  const o = {};
  if (!styleStr) return o;
  for (const part of styleStr.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) {
      const key = part.trim();
      if (key) o[key] = true;
    } else {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      o[k] = v;
    }
  }
  return o;
}

function normalizeColor(c) {
  if (!c || String(c).toLowerCase() === 'none') return null;
  const s = String(c).trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    return s.length === 7 ? s : s;
  }
  return s;
}

function firstChildEl(parent, tagName) {
  if (!parent?.childNodes) return null;
  const want = tagName.toLowerCase();
  for (let i = 0; i < parent.childNodes.length; i++) {
    const n = parent.childNodes[i];
    if (n.nodeType === 1 && String(n.tagName).toLowerCase() === want) return n;
  }
  return null;
}

function getGeometry(mxCell) {
  const geo = firstChildEl(mxCell, 'mxGeometry');
  if (!geo) return null;
  return {
    x: parseFloat(geo.getAttribute('x') || '0'),
    y: parseFloat(geo.getAttribute('y') || '0'),
    width: parseFloat(geo.getAttribute('width') || '0'),
    height: parseFloat(geo.getAttribute('height') || '0'),
  };
}

/** Абсолютная позиция левого верхнего угла ячейки с геометрией (для смещения точек рёбер). */
function absOriginForParent(cellMap, parentId) {
  if (parentId === '0' || parentId === '1' || parentId == null) {
    return { x: 0, y: 0 };
  }
  const p = cellMap.get(parentId);
  if (!p) return { x: 0, y: 0 };
  const o = absTopLeft(cellMap, p.parentId, p.geom);
  return { x: o.x, y: o.y };
}

/**
 * Точки линии mxGraph для edge (sourcePoint / targetPoint / точки из Array).
 * @returns {{ x: number, y: number }[]|null}
 */
function extractEdgeVertices(mxCell, cellMap) {
  const geo = firstChildEl(mxCell, 'mxGeometry');
  if (!geo) return null;
  const parentId = mxCell.getAttribute('parent') || '1';
  const sourcePts = [];
  const targetPts = [];
  const middle = [];

  for (let i = 0; i < geo.childNodes.length; i++) {
    const n = geo.childNodes[i];
    if (n.nodeType !== 1) continue;
    const tn = String(n.tagName).toLowerCase();
    if (tn === 'mxpoint') {
      const x = parseFloat(n.getAttribute('x') || '0');
      const y = parseFloat(n.getAttribute('y') || '0');
      const as = n.getAttribute('as') || '';
      if (as === 'sourcePoint') sourcePts.push({ x, y });
      else if (as === 'targetPoint') targetPts.push({ x, y });
      else middle.push({ x, y });
    } else if (tn === 'array') {
      const pts = n.getElementsByTagName('mxPoint');
      for (let j = 0; j < pts.length; j++) {
        middle.push({
          x: parseFloat(pts[j].getAttribute('x') || '0'),
          y: parseFloat(pts[j].getAttribute('y') || '0'),
        });
      }
    }
  }

  let raw = [];
  if (sourcePts.length || targetPts.length) {
    raw = [...sourcePts, ...middle, ...targetPts];
  } else if (middle.length >= 2) {
    raw = middle;
  }
  if (raw.length < 2) return null;

  const off = absOriginForParent(cellMap, parentId);
  return raw.map((p) => ({ x: p.x + off.x, y: p.y + off.y }));
}

function parseBindings(mxCell) {
  const bindings = {};
  const holder = firstChildEl(mxCell, 'mxBindings');
  if (!holder) return bindings;
  const items = holder.getElementsByTagName('item');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const name = item.getAttribute('name');
    let val = item.getAttribute('value');
    if (name == null || val == null) continue;
    const unescaped = val.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    try {
      val = JSON.parse(unescaped);
    } catch {
      val = unescaped;
    }
    bindings[name] = val;
  }
  return bindings;
}

function bindingFillColor(bindings) {
  for (const [k, v] of Object.entries(bindings)) {
    if (k.includes('color.fill') && k.endsWith('.val') && typeof v === 'string' && v.startsWith('#')) {
      return v;
    }
  }
  return null;
}

function collectVertexCells(rootEl) {
  const out = [];
  for (let i = 0; i < rootEl.childNodes.length; i++) {
    const child = rootEl.childNodes[i];
    if (child.nodeType !== 1) continue;
    const tag = String(child.tagName).toLowerCase();
    if (tag === 'mxcell') {
      if (child.getAttribute('vertex') === '1') {
        out.push({ wrapper: null, mxCell: child });
      }
      continue;
    }
    if (SKIP_WRAPPER_TAGS.has(tag)) continue;
    const mx = firstChildEl(child, 'mxCell');
    if (mx && mx.getAttribute('vertex') === '1') {
      out.push({ wrapper: child, mxCell: mx });
    }
  }
  return out;
}

function collectEdgeCells(rootEl) {
  const out = [];
  for (let i = 0; i < rootEl.childNodes.length; i++) {
    const child = rootEl.childNodes[i];
    if (child.nodeType !== 1) continue;
    const tag = String(child.tagName).toLowerCase();
    if (tag === 'mxcell') {
      if (child.getAttribute('edge') === '1') {
        out.push({
          wrapper: null,
          mxCell: child,
          id: child.getAttribute('id') || `auto-edge-${out.length}`,
        });
      }
      continue;
    }
    if (SKIP_WRAPPER_TAGS.has(tag)) continue;
    const mx = firstChildEl(child, 'mxCell');
    if (mx && mx.getAttribute('edge') === '1') {
      out.push({
        wrapper: child,
        mxCell: mx,
        id: child.getAttribute('id') || mx.getAttribute('id') || `auto-edge-${out.length}`,
      });
    }
  }
  return out;
}

function shouldSkipMxCell(mxCell) {
  if (mxCell.getAttribute('isTable') === '1') return true;
  const style = mxCell.getAttribute('style') || '';
  const value = mxCell.getAttribute('value') || '';
  if (style.includes('html=1') && value.includes('<table')) return true;
  return false;
}

function inferKind(wrapperTag, styleStr) {
  const t = String(wrapperTag || '').toLowerCase();
  const s = parseStyle(styleStr);
  if (t === 'swimlane' || s.swimlane) return 'swimlane';
  if (t === 'ellipse' || s.ellipse || s.shape === 'ellipse') return 'ellipse';
  if (t === 'button' || s.button) return 'button';
  if (t === 'table' || s.table) return 'table';
  if (t === 'rectangle' || s.rectangle) return 'rectangle';
  if (t === 'label' || (s.html === '1' && s.align)) return 'textlabel';
  if (t === 'image' || s.shape === 'image') return 'imagebox';
  return 'rectangle';
}

function absTopLeft(cellMap, parentId, local) {
  if (parentId === '0' || parentId === '1' || parentId == null) {
    return { x: local.x, y: local.y };
  }
  const p = cellMap.get(parentId);
  if (!p) return { x: local.x, y: local.y };
  const pb = absTopLeft(cellMap, p.parentId, p.geom);
  return { x: pb.x + local.x, y: pb.y + local.y };
}

function main() {
  const inPath = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(toolDir, '../../test_schemes/mxGraph(xml)/buttons.xml');
  const outPath = resolveOutputPath(inPath, process.argv[3]);

  const xml = readFileSync(inPath, 'utf8');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const root = doc.getElementsByTagName('root')[0];
  if (!root) {
    console.error('No <root> in mxGraphModel');
    process.exit(1);
  }

  const collected = collectVertexCells(root);
  const cellMap = new Map();

  for (const { wrapper, mxCell } of collected) {
    if (shouldSkipMxCell(mxCell)) continue;
    const wrapperTag = wrapper ? String(wrapper.tagName).toLowerCase() : 'mxcell';
    const id = wrapper ? wrapper.getAttribute('id') : mxCell.getAttribute('id');
    if (!id) continue;
    const parentId = mxCell.getAttribute('parent');
    const geom = getGeometry(mxCell);
    if (!geom) continue;
    if (geom.width < 0 || geom.height < 0) continue;
    if (geom.width === 0 && geom.height === 0) continue;
    const styleStr = mxCell.getAttribute('style') || '';
    const bindings = parseBindings(mxCell);
    const kind = inferKind(wrapperTag, styleStr);
    const style = parseStyle(styleStr);
    const labelText = wrapper
      ? wrapper.getAttribute('label') ||
        wrapper.getAttribute('name') ||
        ''
      : mxCell.getAttribute('value') || '';

    cellMap.set(id, {
      id,
      parentId,
      geom,
      styleStr,
      style,
      bindings,
      kind,
      labelText,
      wrapperTag,
    });
  }

  /** @type {object[]} */
  const figures = [];

  const pushRect = (id, x, y, w, h, attrs = {}) => {
    figures.push({
      type: 'draw2d.shape.basic.Rectangle',
      id,
      x,
      y,
      width: Math.max(w, 1),
      height: Math.max(h, 1),
      radius: attrs.radius ?? 0,
      bgColor: attrs.bgColor ?? '#c0c0c0',
      color: attrs.color ?? '#333333',
      stroke: attrs.stroke ?? 1,
      ...attrs.extra,
    });
  };

  const pushPolyline = (id, vertex, attrs = {}) => {
    if (!vertex || vertex.length < 2) return;
    figures.push({
      type: 'draw2d.shape.basic.PolyLine',
      id,
      stroke: attrs.stroke ?? 1,
      color: attrs.color ?? '#000000',
      vertex,
    });
  };

  const pushOval = (id, x, y, w, h, attrs = {}) => {
    figures.push({
      type: 'draw2d.shape.basic.Oval',
      id,
      x,
      y,
      width: w,
      height: h,
      bgColor: attrs.bgColor ?? '#ffffff',
      color: attrs.color ?? '#333333',
      stroke: attrs.stroke ?? 1,
    });
  };

  const pushLabel = (id, x, y, text, attrs = {}) => {
    if (!text) return;
    figures.push({
      type: 'draw2d.shape.basic.Label',
      id,
      x,
      y,
      text: String(text).replace(/\\n/g, '\n'),
      fontSize: attrs.fontSize ?? 12,
      fontColor: attrs.fontColor ?? '#111111',
      bold: attrs.bold ?? false,
    });
  };

  for (const [id, cell] of cellMap) {
    const abs = absTopLeft(cellMap, cell.parentId, cell.geom);
    const x = abs.x;
    const y = abs.y;
    const { width: w, height: h } = cell.geom;
    const fill =
      bindingFillColor(cell.bindings) ||
      normalizeColor(cell.style.fillColor) ||
      (cell.kind === 'button' ? '#00ff00' : null) ||
      (cell.kind === 'swimlane' ? '#eef3ff' : '#ffffff');
    const strokeCol = normalizeColor(cell.style.strokeColor) || '#333333';
    const fs = parseInt(String(cell.style.fontSize || '14'), 10) || 14;
    const strokeW = parseFloat(String(cell.style.strokeWidth || cell.style.strokewidth || '1')) || 1;

    if (cell.kind === 'textlabel') {
      const txt = String(cell.labelText || '')
        .replace(/&#10;/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/<[^>]+>/g, '');
      pushRect(`fig-${id}-bg`, x, y, w, h, {
        bgColor: fill || '#f8f8f8',
        color: strokeCol,
        stroke: Math.max(1, strokeW),
        radius: 0,
      });
      if (txt.trim()) {
        pushLabel(`fig-${id}-lbl`, x + 2, y + 2, txt.trim(), {
          fontSize: fs,
          fontColor: normalizeColor(cell.style.fontColor) || '#000000',
        });
      }
      continue;
    }

    if (cell.kind === 'imagebox') {
      pushRect(`fig-${id}`, x, y, w, h, {
        bgColor: '#ececec',
        color: '#888888',
        stroke: 1,
        extra: { dasharray: '- ' },
      });
      pushLabel(`fig-${id}-img`, x + 4, y + 4, '[image]', { fontSize: 10, fontColor: '#666666' });
      continue;
    }

    if (cell.kind === 'ellipse') {
      pushOval(`fig-${id}`, x, y, w, h, { bgColor: fill, color: strokeCol });
      continue;
    }

    if (cell.kind === 'swimlane') {
      pushRect(`fig-${id}`, x, y, w, h, {
        bgColor: fill,
        color: '#4169e1',
        stroke: 2,
        radius: 2,
      });
      const title = cell.labelText || 'Group';
      pushLabel(`fig-${id}-title`, x + 6, y + 4, title, { fontSize: Math.min(fs, 14), fontColor: '#000060', bold: true });
      continue;
    }

    if (cell.kind === 'button') {
      const r = Math.min(16, Math.floor(Math.min(w, h) / 8));
      pushRect(`fig-${id}`, x, y, w, h, {
        bgColor: fill,
        color: strokeCol,
        stroke: 1,
        radius: r,
      });
      const btnLabel = cell.labelText || 'Button';
      pushLabel(`fig-${id}-lbl`, x + w / 2 - Math.min(w * 0.35, 80), y + h / 2 - fs / 2, btnLabel, {
        fontSize: Math.min(fs, 72),
        fontColor: normalizeColor(cell.style.fontColor) || '#000000',
        bold: true,
      });
      continue;
    }

    if (cell.kind === 'table') {
      pushRect(`fig-${id}`, x, y, w, h, { bgColor: '#fafafa', color: '#808080', stroke: 1 });
      const title = cell.labelText.trim();
      if (title) {
        pushLabel(`fig-${id}-caption`, x + 8, y + 4, title, { fontSize: Math.min(fs, 18), bold: true });
      }
      let items = cell.bindings.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch {
          items = [];
        }
      }
      if (Array.isArray(items) && items.length > 0) {
        const rowH = Math.max(14, Math.min(32, (h - 36) / items.length));
        let yy = y + 28;
        const maxRows = Math.min(items.length, 80);
        for (let r = 0; r < maxRows; r++) {
          const row = items[r];
          const line = row?.d || row?.val || row?.id || '';
          pushLabel(`fig-${id}-row-${r}`, x + 8, yy, String(line), {
            fontSize: Math.min(12, rowH - 2),
            fontColor: '#222',
          });
          yy += rowH;
        }
        if (items.length > maxRows) {
          pushLabel(`fig-${id}-more`, x + 8, yy, `… (+${items.length - maxRows} строк)`, { fontSize: 11, fontColor: '#666' });
        }
      }
      continue;
    }

    // rectangle (default) — bus, load, switch, ground, …
    pushRect(`fig-${id}`, x, y, w, h, {
      bgColor: fill,
      color: strokeCol,
      stroke: Math.max(1, strokeW),
      radius: cell.style.rounded ? 4 : 0,
    });
  }

  const edgeCells = collectEdgeCells(root);
  for (const { mxCell: emx, id: eid } of edgeCells) {
    if (shouldSkipMxCell(emx)) continue;
    const verts = extractEdgeVertices(emx, cellMap);
    if (!verts) continue;
    const est = parseStyle(emx.getAttribute('style') || '');
    const sw = parseFloat(String(est.strokeWidth || '1')) || 1;
    const sc = normalizeColor(est.strokeColor) || '#000000';
    pushPolyline(`ln-${eid}`, verts, { stroke: Math.max(1, sw), color: sc });
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(figures, null, 2), 'utf8');
  console.info(`Wrote ${figures.length} figures to ${outPath}`);
}

main();
