/**
 * Привязка интерактивности к фигурам после загрузки схемы (draw2d + JSON).
 * См. фикстуры с известными id (например sample-switch-* в sample.json).
 */
(function (global) {
  'use strict';

  /** User Timing: клик по выключателю → смена состояния */
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
    var knobXOff = knob.getX();
    var knobY = knob.getY();
    var knobXOn = track.getX() + track.getWidth() - knob.getWidth() - 3;

    function syncView() {
      knob.setPosition(on ? knobXOn : knobXOff, knobY);
      track.attr({
        bgColor: on ? '#66bb6a' : '#bdbdbd',
        color: on ? '#2e7d32' : '#616161'
      });
      label.attr({
        text: on ? 'Вкл' : 'Выкл',
        fontColor: on ? '#1b5e20' : '#616161'
      });
    }

    function onToggleClick() {
      try {
        performance.clearMarks(MARK_TOGGLE_INPUT);
        performance.clearMarks(MARK_TOGGLE_STATE);
      } catch (e) {
        /* ignore */
      }

      performance.mark(MARK_TOGGLE_INPUT);

      on = !on;
      syncView();

      performance.mark(MARK_TOGGLE_STATE);
      try {
        performance.measure(MEASURE_TOGGLE, MARK_TOGGLE_INPUT, MARK_TOGGLE_STATE);
        var list = performance.getEntriesByName(MEASURE_TOGGLE);
        var m = list[list.length - 1];
        if (m) {
          console.info(
            '[perf] ' + MEASURE_TOGGLE + ':',
            m.duration.toFixed(3),
            'ms (figure click → update state and repaint)'
          );
        }
      } catch (e) {
        /* ignore if measure unsupported */
      }
    }

    track.on('click', onToggleClick);
    knob.on('click', onToggleClick);
  }

  function installSchemaInteractiveBindings(canvas) {
    installToggleSwitch(canvas);
  }

  global.installSchemaInteractiveBindings = installSchemaInteractiveBindings;
})(typeof window !== 'undefined' ? window : globalThis);
