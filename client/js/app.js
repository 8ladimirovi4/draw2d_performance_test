/**
 * Application entry: fetch fixture over HTTP → JSON.parse → draw2d.io.json.Reader.
 * User Timing: см. константы MARK_* / MEASURE_* ниже (выключатель — в schema-interactive-bindings.js).
 */
(function () {
  'use strict';

  /** User Timing: ответ тела HTTP → первый кадр после отрисовки схемы */
  var MARK_HTTP_FETCH_END = 'http_fetch_end';
  var MARK_UNMARSHAL_START = 'unmarshal_start';
  var MARK_UNMARSHAL_END = 'unmarshal_end';
  var MEASURE_UNMARSHAL_TO_CANVAS = 'unmarshal_to_canvas';

  var MARK_SCHEMA_VISIBLE = 'schema_visible';
  var MEASURE_DISPLAY_AFTER_HTTP = 'display_after_http';

  function getFixtureName() {
    var params = new URLSearchParams(window.location.search);
    return params.get('fixture') || 'sample';
  }

  function setStatus(el, text, isError) {
    el.textContent = text;
    el.classList.toggle('is-error', !!isError);
  }

  function markSchemaVisible() {
    performance.mark(MARK_SCHEMA_VISIBLE);
    try {
      performance.measure(MEASURE_DISPLAY_AFTER_HTTP, MARK_HTTP_FETCH_END, MARK_SCHEMA_VISIBLE);
      var entries = performance.getEntriesByName(MEASURE_DISPLAY_AFTER_HTTP);
      var m = entries[entries.length - 1];
      if (m) {
        console.info(
          '[perf] ' + MEASURE_DISPLAY_AFTER_HTTP + ':',
          m.duration.toFixed(2),
          'ms (HTTP response body received → on-screen schema marker: JSON.parse, unmarshal, canvas/viewport sizing, then 2× requestAnimationFrame before mark)'
        );
      }
    } catch (e) {
      /* ignore if marks missing */
    }
  }

  function viewportPixels(viewportEl) {
    var w = viewportEl.clientWidth;
    var h = viewportEl.clientHeight;
    return { w: Math.max(1, w), h: Math.max(1, h) };
  }

  function patchCanvasPointerCoordinates(canvas) {
    if (!canvas.html || !canvas.html[0] || !canvas.paper || !canvas.paper.canvas) {
      return;
    }
    var surface = canvas.paper.canvas;

    function surfaceRect() {
      return surface.getBoundingClientRect();
    }

    canvas.fromDocumentToCanvasCoordinate = function (clientX, clientY) {
      var r = surfaceRect();
      return new draw2d.geo.Point(
        (clientX - r.left) * this.zoomFactor,
        (clientY - r.top) * this.zoomFactor
      );
    };
    canvas.fromCanvasToDocumentCoordinate = function (x, y) {
      var r = surfaceRect();
      return new draw2d.geo.Point(
        x * (1 / this.zoomFactor) + r.left,
        y * (1 / this.zoomFactor) + r.top
      );
    };
  }

  function fitCanvasToViewportAndContent(canvas, viewportEl) {
    var vp = viewportPixels(viewportEl);
    var pad = 32;
    var maxR = 0;
    var maxB = 0;
    canvas.getFigures().each(function (i, fig) {
      var r = fig.getOuterBoundingBox();
      maxR = Math.max(maxR, r.x + r.w);
      maxB = Math.max(maxB, r.y + r.h);
    });
    if (maxR < 8 || maxB < 8) {
      canvas.setDimension();
      maxR = canvas.initialWidth;
      maxB = canvas.initialHeight;
    }
    canvas.setDimension(
      Math.max(maxR + pad, vp.w),
      Math.max(maxB + pad, vp.h)
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    var statusEl = document.getElementById('status');
    var viewportEl = document.getElementById('canvas-viewport');
    var fixture = getFixtureName();
    setStatus(statusEl, 'Загрузка: fixtures/' + fixture + '.json …', false);

    var vp0 = viewportPixels(viewportEl);
    var canvas = new draw2d.Canvas('gfx_holder', vp0.w, vp0.h);
    canvas.setScrollArea('#canvas-viewport');
    patchCanvasPointerCoordinates(canvas);
    if (typeof installPerfDragGesture === 'function') {
      installPerfDragGesture(canvas);
    }
    var loader = new SchemaLoader(canvas);

    var url = '/fixtures/' + encodeURIComponent(fixture) + '.json';

    window.addEventListener('resize', function () {
      fitCanvasToViewportAndContent(canvas, viewportEl);
    });

    fetch(url)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ' for ' + url);
        }
        return res.text();
      })
      .then(function (text) {
        performance.mark(MARK_HTTP_FETCH_END);
        //parsing text -> object not included to render metric
        var data = JSON.parse(text);

        canvas.clear();

        performance.mark(MARK_UNMARSHAL_START);
        loader.unmarshal(data);
        if (typeof installSchemaInteractiveBindings === 'function') {
          installSchemaInteractiveBindings(canvas);
        }
        performance.mark(MARK_UNMARSHAL_END);
        
        try {
          performance.measure(MEASURE_UNMARSHAL_TO_CANVAS, MARK_UNMARSHAL_START, MARK_UNMARSHAL_END);
          var um = performance.getEntriesByName(MEASURE_UNMARSHAL_TO_CANVAS);
          var u = um[um.length - 1];
          if (u) {
            console.info(
              '[perf] ' + MEASURE_UNMARSHAL_TO_CANVAS + ':',
              u.duration.toFixed(2),
              'ms (in-memory schema object → canvas figures; JSON.parse not included)'
            );
          }
        } catch (e) {
          /* ignore if marks missing */
        }

        if (typeof installPerfDragDistanceGuide === 'function') {
          installPerfDragDistanceGuide(canvas, fixture);
        }

        fitCanvasToViewportAndContent(canvas, viewportEl);

        requestAnimationFrame(function () {
          requestAnimationFrame(markSchemaVisible);
        });

        setStatus(
          statusEl,
          'Схема загружена (' + fixture + '). Фигур на холсте: ' + canvas.getFigures().getSize(),
          false
        );
      })
      .catch(function (err) {
        console.error(err);
        setStatus(statusEl, 'Ошибка: ' + err.message, true);
      });
  });
})();
