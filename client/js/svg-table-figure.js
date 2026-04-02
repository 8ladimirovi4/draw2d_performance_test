/**
 * Таблица как одна SVG-фигура (производительнее N×M Label).
 * Паттерн из официального примера draw2d: examples/shape_custom_svg — CustomFigure extends SVGFigure, getSVG().
 * Базовый класс: src/SVGFigure.js (getSVG / setSVG, importSVG, setPersistentAttributes + размер из JSON или из корня &lt;svg&gt;).
 */
(function (global) {
  'use strict';

  var draw2d = global.draw2d;
  if (!draw2d || !draw2d.SVGFigure) {
    throw new Error('svg-table-figure.js: draw2d.SVGFigure is required (load draw2d.js first)');
  }

  function escapeXml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function colorToCss(c) {
    if (c == null) {
      return '#333333';
    }
    if (typeof c === 'string') {
      return c;
    }
    if (typeof c.rgba === 'function') {
      return c.rgba();
    }
    return String(c);
  }

  draw2d.shape.custom = draw2d.shape.custom || {};

  draw2d.shape.custom.SvgTableFigure = draw2d.SVGFigure.extend(
    /** @lends draw2d.shape.custom.SvgTableFigure.prototype */ {
      NAME: 'draw2d.shape.custom.SvgTableFigure',

      init: function (attr, setter, getter) {
        this.rows = [];
        this.cellPadding = { top: 4, right: 8, bottom: 4, left: 8 };
        this.fontSize = 11;
        this.fontFamily = 'sans-serif';
        this.headerFontWeight = 'bold';
        this.bodyFontWeight = 'normal';
        this.textColor = '#333333';
        this.headerTextColor = '#111111';
        this.gridStroke = null;

        this._super(
          Object.assign(
            {
              width: 200,
              height: 80,
              stroke: 1,
              radius: 2,
              bgColor: '#fafafa',
              color: '#9e9e9e',
            },
            attr || {}
          ),
          setter,
          getter
        );
      },

      /**
       * Динамическая разметка таблицы в SVG (плоский список дочерних узлов у &lt;svg&gt; — как ожидает SVGFigure#importSVG).
       */
      buildTableSvg: function () {
        var rows = this.rows;
        var pad = this.cellPadding;
        var fs = this.fontSize;
        /* Высота строки: запас под текст и вертикальную ошибку SVGFigure#importSVG (см. расчёт y ниже). */
        var rowHeight = Math.max(
          Math.ceil(fs * 2.5) + Math.ceil(pad.top / 2) + Math.ceil(pad.bottom / 2),
          34
        );
        var charW = Math.ceil(fs * 0.62);
        var strokeW = this.stroke || 1;
        var rx = this.radius || 0;

        if (!rows.length) {
          return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">' +
            '<rect x="0" y="0" width="120" height="40" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>' +
            '<text x="8" y="26" font-size="' +
            fs +
            '" font-family="' +
            escapeXml(this.fontFamily) +
            '" fill="#999">(empty)</text></svg>'
          );
        }

        var ncols = rows.reduce(function (m, r) {
          return Math.max(m, Array.isArray(r) ? r.length : 0);
        }, 0);
        var nrows = rows.length;

        var c;
        var r;
        var colWidths = [];
        for (c = 0; c < ncols; c++) {
          var maxLen = 0;
          for (r = 0; r < nrows; r++) {
            var row = rows[r];
            var cell = Array.isArray(row) ? row[c] : '';
            var t = cell === null || cell === undefined ? '' : String(cell);
            if (t.length > maxLen) {
              maxLen = t.length;
            }
          }
          colWidths[c] = Math.max(
            Math.ceil(maxLen * charW + pad.left + pad.right),
            32
          );
        }

        var innerW = 0;
        for (c = 0; c < ncols; c++) {
          innerW += colWidths[c];
        }
        var innerH = nrows * rowHeight + pad.top + pad.bottom;
        var w = innerW + strokeW * 2;
        var h = innerH + strokeW * 2;

        var bg = colorToCss(this.bgColor);
        var border = colorToCss(this.color);
        var gridColor = this.gridStroke != null ? colorToCss(this.gridStroke) : border;

        var parts = [];
        parts.push(
          '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            w +
            '" height="' +
            h +
            '">'
        );
        parts.push(
          '<rect x="0" y="0" width="' +
            w +
            '" height="' +
            h +
            '" fill="' +
            escapeXml(bg) +
            '" stroke="' +
            escapeXml(border) +
            '" stroke-width="' +
            strokeW +
            '" rx="' +
            rx +
            '" ry="' +
            rx +
            '"/>'
        );

        var x0 = strokeW;
        var prefix = [0];
        for (c = 0; c < ncols; c++) {
          prefix[c + 1] = prefix[c] + colWidths[c];
        }

        for (c = 1; c < ncols; c++) {
          var vx = x0 + prefix[c];
          parts.push(
            '<line x1="' +
              vx +
              '" y1="' +
              strokeW +
              '" x2="' +
              vx +
              '" y2="' +
              (h - strokeW) +
              '" stroke="' +
              escapeXml(gridColor) +
              '" stroke-width="1"/>'
          );
        }

        /* Линия чуть ниже границы строки, чтобы не совпадать с нижним краем глифа. */
        var sepLinePad = 1.5;
        for (r = 1; r < nrows; r++) {
          var sepY = strokeW + pad.top + r * rowHeight + sepLinePad;
          parts.push(
            '<line x1="' +
              strokeW +
              '" y1="' +
              sepY +
              '" x2="' +
              (w - strokeW) +
              '" y2="' +
              sepY +
              '" stroke="' +
              escapeXml(gridColor) +
              '" stroke-width="1"/>'
          );
        }

        /*
         * SVGFigure#importSVG (ванильный draw2d): для <text> задаётся y = svg_y + getBBox().h/2,
         * но getBBox() берётся до attr() с font-size — это bbox «дефолтного» paper.text, не ячейки.
         * Чтобы визуальный якорь оказался у середины строки: svg_y ≈ cellMid − h0/2 (h0 ≈ высота до attr).
         */
        var preAttrBBoxHalf = Math.ceil(fs * 0.68);
        for (r = 0; r < nrows; r++) {
          var rowTop = strokeW + pad.top + r * rowHeight;
          var cellMidY = rowTop + rowHeight / 2;
          var yText = cellMidY - preAttrBBoxHalf;
          if (r === 0) {
            yText += Math.ceil(fs * 0.1);
          }
          var colX = x0;
          for (c = 0; c < ncols; c++) {
            var row = rows[r];
            var raw = Array.isArray(row) ? row[c] : '';
            var text =
              raw === null || raw === undefined ? '' : String(raw);
            var weight = r === 0 ? this.headerFontWeight : this.bodyFontWeight;
            var tFill = r === 0 ? this.headerTextColor : this.textColor;
            parts.push(
              '<text x="' +
                (colX + pad.left) +
                '" y="' +
                yText +
                '" font-size="' +
                fs +
                '" font-family="' +
                escapeXml(this.fontFamily) +
                '" font-weight="' +
                weight +
                '" fill="' +
                escapeXml(tFill) +
                '" text-anchor="start">' +
                escapeXml(text) +
                '</text>'
            );
            colX += colWidths[c];
          }
        }

        parts.push('</svg>');
        return parts.join('');
      },

      getSVG: function () {
        return this.buildTableSvg();
      },

      getPersistentAttributes: function () {
        var m = this._super();
        m.rows = this.rows;
        m.cellPadding = this.cellPadding;
        m.fontSize = this.fontSize;
        m.fontFamily = this.fontFamily;
        m.headerFontWeight = this.headerFontWeight;
        m.bodyFontWeight = this.bodyFontWeight;
        m.textColor = this.textColor;
        m.headerTextColor = this.headerTextColor;
        if (this.gridStroke != null) {
          m.gridStroke = this.gridStroke;
        }
        return m;
      },

      setPersistentAttributes: function (memento) {
        if (memento.rows != null) {
          this.rows = memento.rows;
        }
        if (memento.cellPadding != null) {
          this.cellPadding = memento.cellPadding;
        }
        if (memento.fontSize != null) {
          this.fontSize = parseFloat(memento.fontSize);
        }
        if (memento.fontFamily != null) {
          this.fontFamily = memento.fontFamily;
        }
        if (memento.headerFontWeight != null) {
          this.headerFontWeight = memento.headerFontWeight;
        }
        if (memento.bodyFontWeight != null) {
          this.bodyFontWeight = memento.bodyFontWeight;
        }
        if (memento.textColor != null) {
          this.textColor = memento.textColor;
        }
        if (memento.headerTextColor != null) {
          this.headerTextColor = memento.headerTextColor;
        }
        if (memento.gridStroke != null) {
          this.gridStroke = memento.gridStroke;
        }

        this._super(memento);

        if (this.canvas !== null && this.svgNodes !== null) {
          this.setSVG(this.getSVG());
        }
        return this;
      },
    }
  );
})(typeof window !== 'undefined' ? window : globalThis);
