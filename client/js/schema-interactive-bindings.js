(function (global) {
  'use strict';

  /** User Timing: клик по выключателю → смена состояния; конец — после 2× rAF (как schema_visible в app.js). */
  var MARK_TOGGLE_INPUT = 'user_toggle_switch_input';
  var MARK_TOGGLE_STATE = 'user_toggle_switch_state_ready';
  var MEASURE_TOGGLE = 'user_toggle_switch_click_to_state';

  function installToggleSwitch(canvas, ids) {
    ids = ids || {};
    var trackId = ids.trackId || 'sample-switch-track';
    var knobId = ids.knobId || 'sample-switch-knob';
    var labelId = ids.labelId || 'sample-switch-state';

    var track = canvas.getFigure(trackId);
    var knob = canvas.getFigure(knobId);
    var label = canvas.getFigure(labelId);
    if (!track || !knob || !label) {
      return;
    }

    var on = false;
    var knobRelXOff = knob.getX() - track.getX();
    var knobRelY = knob.getY() - track.getY();
    var knobPadX = 3;
    var toggleFrameSeq = 0;

    function syncView() {
      var tx = track.getX();
      var ty = track.getY();
      var knobXOn = tx + track.getWidth() - knob.getWidth() - knobPadX;
      var knobXOff = tx + knobRelXOff;
      knob.setPosition(on ? knobXOn : knobXOff, ty + knobRelY);
      track.attr({
        bgColor: on ? '#66bb6a' : '#bdbdbd',
        color: on ? '#2e7d32' : '#616161',
      });
      label.attr({
        text: on ? 'Вкл' : 'Выкл',
        fontColor: on ? '#1b5e20' : '#616161',
      });
    }

    function onToggleClick() {
      var seq = ++toggleFrameSeq;
      try {
        performance.clearMarks(MARK_TOGGLE_INPUT);
        performance.clearMarks(MARK_TOGGLE_STATE);
      } catch (e) {
        /* ignore */
      }

      performance.mark(MARK_TOGGLE_INPUT);

      on = !on;
      syncView();

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (seq !== toggleFrameSeq) {
            return;
          }
          performance.mark(MARK_TOGGLE_STATE);
          try {
            performance.measure(MEASURE_TOGGLE, MARK_TOGGLE_INPUT, MARK_TOGGLE_STATE);
            var list = performance.getEntriesByName(MEASURE_TOGGLE);
            var m = list[list.length - 1];
            if (m) {
              console.info(
                '[perf] ' + MEASURE_TOGGLE + ':',
                m.duration.toFixed(3),
                'ms (figure click → syncView, then 2× requestAnimationFrame before measure end)',
              );
            }
          } catch (e) {
            /* ignore if measure unsupported */
          }
        });
      });
    }

    track.on('click', onToggleClick);
    knob.on('click', onToggleClick);
    label.on('click', onToggleClick);
  }

  function installSchemaInteractiveBindings(canvas) {
    installToggleSwitch(canvas);
    var i;
    for (i = 1; i <= 35; i++) {
      var n = i < 10 ? '0' + i : String(i);
      installToggleSwitch(canvas, {
        trackId: 'sample-switch-' + n + '-track',
        knobId: 'sample-switch-' + n + '-knob',
        labelId: 'sample-switch-' + n + '-state',
      });
    }
    installToggleSwitch(canvas, {
      trackId: 'poc1-smp-sw-13-track',
      knobId: 'poc1-smp-sw-13-knob',
      labelId: 'poc1-smp-sw-13-state',
    });
    for (i = 1; i <= 310; i++) {
      var preN = i === 1 ? '' : '-' + (i < 10 ? '00' + i : i < 100 ? '0' + i : String(i));
      installToggleSwitch(canvas, {
        trackId: 'poc1-req01-pre-sw-track' + preN,
        knobId: 'poc1-req01-pre-sw-knob' + preN,
        labelId: 'poc1-req01-pre-sw-state' + preN,
      });
    }
    installToggleSwitch(canvas, {
      trackId: 'sample-top-sw-track',
      knobId: 'sample-top-sw-knob',
      labelId: 'sample-top-sw-state',
    });
  }

  global.installSchemaInteractiveBindings = installSchemaInteractiveBindings;
})(typeof window !== 'undefined' ? window : globalThis);
