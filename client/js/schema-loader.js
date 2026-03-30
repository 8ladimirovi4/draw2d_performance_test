/**
 * Loads draw2d diagrams using the official {@link draw2d.io.json.Reader} API.
 * @see https://freegroup.github.io/draw2d/index.html#/api/draw2d.io.json.Reader
 */
(function (global) {
  'use strict';

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
    this.reader.unmarshal(this.canvas, jsonDocument);
  };

  global.SchemaLoader = SchemaLoader;
})(typeof window !== 'undefined' ? window : globalThis);
