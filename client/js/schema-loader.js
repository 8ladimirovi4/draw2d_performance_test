
(function (global) {
  'use strict';

  /**
   * TableBox из fixture: восстановление rows через addRow при unmarshal.
   * На время добавления всех строк подавляем scheduleLayout и repaintBlocked у контейнера,
   * затем cancelLayout + один scheduleLayout — меньше лишних _renderLayout/repaint, чем N вызовов
   * addRow со своим scheduleLayout (коалесцинг rAF в Box частичный, т.к. _layoutPending сбрасывается
   * после каждого кадра).
   */


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
  };

  global.SchemaLoader = SchemaLoader;
})(typeof window !== 'undefined' ? window : globalThis);
