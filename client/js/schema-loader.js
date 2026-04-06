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
    var data = typeof jsonDocument === 'string' ? JSON.parse(jsonDocument) : jsonDocument;
    if (!Array.isArray(data)) {
      throw new Error('SchemaLoader: expected a JSON array of figure descriptors');
    }
    this.reader.unmarshal(this.canvas, data);
  };

  global.SchemaLoader = SchemaLoader;
})(typeof window !== 'undefined' ? window : globalThis);
