(function (global) {
  'use strict';

  var DRAG_DISTANCE_PX = 100;
  var FIXTURES = {
    'poc1-req02-small': true,
    'poc1-req01-big': true,
  };

  var STRIP_X = 16;
  var STRIP_Y = 8;
  var STRIP_H = 22;
  var MARK_W = 3;
  var MARK_PAD = 4;

  function shouldInstall(fixtureName) {
    return !!FIXTURES[fixtureName];
  }

  function lockFigure(fig) {
    if (!fig) {
      return;
    }
    if (typeof fig.setSelectable === 'function') {
      fig.setSelectable(false);
    }
    if (typeof fig.setDraggable === 'function') {
      fig.setDraggable(false);
    }
    if (typeof fig.setDeleteable === 'function') {
      fig.setDeleteable(false);
    }
    if (typeof fig.setResizeable === 'function') {
      fig.setResizeable(false);
    }
  }

  /**
   * @param {draw2d.Canvas} canvas
   * @param {string} fixtureName
   */
  function installPerfDragDistanceGuide(canvas, fixtureName) {
    if (!canvas || !shouldInstall(fixtureName)) {
      return;
    }

    var markTop = STRIP_Y - MARK_PAD;
    var markH = STRIP_H + MARK_PAD * 2;
    var stripRight = STRIP_X + DRAG_DISTANCE_PX;

    var guideJson = [
      {
        type: 'draw2d.shape.basic.Rectangle',
        id: 'perf-ac04-drag-strip',
        x: STRIP_X,
        y: STRIP_Y,
        width: DRAG_DISTANCE_PX,
        height: STRIP_H,
        radius: 0,
        bgColor: '#fff3cd',
        color: '#e65100',
        stroke: 1,
      },
      {
        type: 'draw2d.shape.basic.Rectangle',
        id: 'perf-ac04-mark-start',
        x: STRIP_X - Math.floor(MARK_W / 2),
        y: markTop,
        width: MARK_W,
        height: markH,
        radius: 0,
        bgColor: '#bf360c',
        color: '#bf360c',
        stroke: 0,
      },
      {
        type: 'draw2d.shape.basic.Rectangle',
        id: 'perf-ac04-mark-stop',
        x: stripRight - Math.ceil(MARK_W / 2),
        y: markTop,
        width: MARK_W,
        height: markH,
        radius: 0,
        bgColor: '#bf360c',
        color: '#bf360c',
        stroke: 0,
      },
      {
        type: 'draw2d.shape.basic.Label',
        id: 'perf-ac04-drag-hint',
        x: STRIP_X,
        y: STRIP_Y + STRIP_H + 4,
        text: '100 px на холсте: START — STOP (AC_04)',
        fontSize: 11,
        fontColor: '#5d4037',
        stroke: 0,
      },
    ];

    var reader = new draw2d.io.json.Reader();
    reader.unmarshal(canvas, guideJson);

    guideJson.forEach(function (d) {
      lockFigure(canvas.getFigure(d.id));
    });
  }

  global.installPerfDragDistanceGuide = installPerfDragDistanceGuide;
})(typeof window !== 'undefined' ? window : globalThis);
