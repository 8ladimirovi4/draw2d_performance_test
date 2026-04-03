/**
 * Консоль: длина перемещения фигуры в координатах холста после commit в CommandStack.
 * Лог: [perf] canvas path ≈ X px
 */
(function (global) {
  'use strict';

  var EPS = 0.001;

  /** @returns {{ dx: number, dy: number } | null} */
  function moveDeltaFromCommand(cmd) {
    if (!cmd || !cmd.NAME) {
      return null;
    }
    if (cmd.NAME === 'draw2d.command.CommandMove') {
      if (typeof cmd.newX !== 'number' || typeof cmd.oldX !== 'number') {
        return null;
      }
      return { dx: cmd.newX - cmd.oldX, dy: cmd.newY - cmd.oldY };
    }
    if (cmd.NAME === 'draw2d.command.CommandCollection' && cmd.commands) {
      var res = null;
      cmd.commands.each(function (i, c) {
        if (res) {
          return;
        }
        var d = moveDeltaFromCommand(c);
        if (d && (Math.abs(d.dx) > EPS || Math.abs(d.dy) > EPS)) {
          res = d;
        }
      });
      return res;
    }
    return null;
  }

  /**
   * @param {draw2d.Canvas} canvas
   */
  function installPerfDragGesture(canvas) {
    if (!canvas || typeof canvas.getCommandStack !== 'function') {
      return;
    }
    var stack = canvas.getCommandStack();
    var POST = draw2d.command.CommandStack.POST_EXECUTE;

    stack.on('change', function (event) {
      if ((event.getDetails() & POST) === 0) {
        return;
      }
      var d = moveDeltaFromCommand(event.getCommand());
      if (!d) {
        return;
      }
      var path = Math.hypot(d.dx, d.dy);
      if (path < EPS) {
        return;
      }
      console.info('[perf] canvas path ≈', path.toFixed(1), 'px');
    });
  }

  global.installPerfDragGesture = installPerfDragGesture;
})(typeof window !== 'undefined' ? window : globalThis);
