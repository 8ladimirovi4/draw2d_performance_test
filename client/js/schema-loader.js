
(function (global) {
  'use strict';

  /** Keys handled by Figure / VectorFigure {@link draw2d.Figure#setPersistentAttributes} chains. */
  var MEMENTO_KEYS = {
    type: true,
    id: true,
    source: true,
    target: true,
    x: true,
    y: true,
    width: true,
    height: true,
    userData: true,
    selectable: true,
    draggable: true,
    cssClass: true,
    alpha: true,
    angle: true,
    bgColor: true,
    color: true,
    stroke: true,
    radius: true,
    dasharray: true,
    /** Fixture-only: filled via addRow (see applyTableBoxRowsFromElement). */
    rows: true
  };

  function applyTableBoxRowsFromElement(canvas, element) {
    if (!element || element.type !== 'draw2d.shape.box.TableBox') {
      return;
    }
    if (!Array.isArray(element.rows) || element.rows.length === 0) {
      return;
    }
    var fig = canvas.getFigure(element.id);
    if (!fig || typeof fig.addRow !== 'function' || typeof fig.removeRow !== 'function') {
      return;
    }
    while (fig.getRowCount() > 0) {
      fig.removeRow(0);
    }
    var r;
    for (r = 0; r < element.rows.length; r++) {
      var row = element.rows[r];
      if (Array.isArray(row) && row.length > 0) {
        fig.addRow.apply(fig, row);
      }
    }
    if (typeof fig.forceLayout === 'function') {
      fig.forceLayout();
    }
  }

  function applyLabelLikeDeclaredWidth(fig, element) {
    var name = fig.NAME || '';
    if (
      name !== 'draw2d.shape.basic.Label' &&
      name !== 'draw2d.shape.note.PostIt'
    ) {
      return;
    }
    if (typeof element.width !== 'number' || element.width <= 0) {
      return;
    }
    if (element.resizeable === false) {
      return;
    }
    fig.attr({ resizeable: true });
    if (typeof fig.clearCache === 'function') {
      fig.clearCache();
    }
  }

  function applyWhitelistAttrsFromElement(canvas, element) {
    if (!element || element.source || element.target) {
      return;
    }
    var fig = canvas.getFigure(element.id);
    if (!fig) {
      return;
    }
    var patch = {};
    var key;
    var figName = fig.NAME || '';
    for (key in element) {
      if (!Object.prototype.hasOwnProperty.call(element, key) || MEMENTO_KEYS[key]) {
        continue;
      }
      if (figName === 'draw2d.shape.box.TableBox' && key === 'grid' && typeof element.grid === 'boolean') {
        continue;
      }
      if (fig.setterWhitelist[key]) {
        patch[key] = element[key];
      }
    }
    if (Object.keys(patch).length > 0) {
      fig.attr(patch);
    }
    applyLabelLikeDeclaredWidth(fig, element);
  }

  function SchemaLoader(canvas) {
    if (!canvas) {
      throw new Error('SchemaLoader requires a draw2d.Canvas instance');
    }
    this.canvas = canvas;
    this.reader = new draw2d.io.json.Reader();
  }

  /**
   * @param {object|Array|string} jsonDocument Same shape as in draw2d examples (array of figure descriptors, or parseable string).
   */
  SchemaLoader.prototype.unmarshal = function unmarshal(jsonDocument) {
    var data =
      typeof jsonDocument === 'string' ? JSON.parse(jsonDocument) : jsonDocument;
    if (!Array.isArray(data)) {
      throw new Error('SchemaLoader: expected a JSON array of figure descriptors');
    }
    this.reader.unmarshal(this.canvas, data);
    var i;
    for (i = 0; i < data.length; i++) {
      applyWhitelistAttrsFromElement(this.canvas, data[i]);
      applyTableBoxRowsFromElement(this.canvas, data[i]);
    }
  };

  global.SchemaLoader = SchemaLoader;
})(typeof window !== 'undefined' ? window : globalThis);
