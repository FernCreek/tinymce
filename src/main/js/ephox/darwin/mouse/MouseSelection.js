define(
  'ephox.darwin.mouse.MouseSelection',

  [
    'ephox.darwin.selection.CellSelection',
    'ephox.peanut.Fun',
    'ephox.perhaps.Option',
    'ephox.sugar.api.SelectorFind'
  ],

  function (CellSelection, Fun, Option, SelectorFind) {
    return function (bridge, container) {
      var cursor = Option.none();

      var restoreInitialSelection = function (cell) {
        bridge.selectContents(cell);
      };

      /* Keep this as lightweight as possible when we're not in a table selection, it runs constantly */
      var mousedown = function (event) {
        cursor = SelectorFind.closest(event.target(), 'td,th');
        CellSelection.clear(container);
      };

      /* Keep this as lightweight as possible when we're not in a table selection, it runs constantly */
      var mouseover = function (event) {
        cursor.each(function (start) {
          CellSelection.clear(container);
          var finish = SelectorFind.closest(event.target(), 'td,th');
          var boxes = finish.bind(Fun.curry(CellSelection.identify, start)).getOr([]);
          // Wait until we have more than one, otherwise you can't do text selection inside a cell.
          if (boxes.length > 1) {
            CellSelection.selectRange(container, boxes, start, finish.getOrDie());

            // stop the browser from creating a big text selection. Doesn't work in all cases, but it's nice when it does
            restoreInitialSelection(start);
          }
        });
      };

      /* Keep this as lightweight as possible when we're not in a table selection, it runs constantly */
      var mouseup = function () {
        cursor.each(function (start) {
          // if we have a multi cell selection, set the cursor back to collapsed at the start point
          CellSelection.retrieve(container).each(function (cells) {
            if (cells.length > 1) {
              restoreInitialSelection(start);
            }
          });
          // clear state
          cursor = Option.none();
        });
      };

      return {
        mousedown: mousedown,
        mouseover: mouseover,
        mouseup: mouseup
      };
    };
  }
);