/**
 * Application entry: fetch fixture over HTTP → JSON.parse → draw2d.io.json.Reader.
 * User Timing marks align with test_plan.md (http_fetch_end, unmarshal_*, schema_visible).
 */
(function () {
  'use strict';

  function getFixtureName() {
    var params = new URLSearchParams(window.location.search);
    return params.get('fixture') || 'sample';
  }

  function setStatus(el, text, isError) {
    el.textContent = text;
    el.classList.toggle('is-error', !!isError);
  }

  function markSchemaVisible() {
    performance.mark('schema_visible');
    try {
      performance.measure('display_after_http', 'http_fetch_end', 'schema_visible');
      var entries = performance.getEntriesByName('display_after_http');
      var m = entries[entries.length - 1];
      if (m) {
        console.info('[perf] display_after_http:', m.duration.toFixed(2), 'ms');
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

  function fitCanvasToViewportAndContent(canvas, viewportEl) {
    var vp = viewportPixels(viewportEl);
    canvas.setDimension();
    var cw = canvas.initialWidth;
    var ch = canvas.initialHeight;
    canvas.setDimension(Math.max(cw, vp.w), Math.max(ch, vp.h));
  }

  document.addEventListener('DOMContentLoaded', function () {
    var statusEl = document.getElementById('status');
    var viewportEl = document.getElementById('canvas-viewport');
    var fixture = getFixtureName();
    setStatus(statusEl, 'Загрузка: fixtures/' + fixture + '.json …', false);

    var vp0 = viewportPixels(viewportEl);
    var canvas = new draw2d.Canvas('gfx_holder', vp0.w, vp0.h);
    canvas.setScrollArea('#canvas-viewport');
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
        performance.mark('http_fetch_end');
        var data = JSON.parse(text);

        canvas.clear();
        performance.mark('unmarshal_start');
        loader.unmarshal(data);
        performance.mark('unmarshal_end');

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
