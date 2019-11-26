/**
 * @file SaveProperties.ts
 * Handles saving the various properties of tables.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {applyCellMargins, applyRowMargins, applyTableMargins} from './Margins';
import {getCSSForBorder} from './Borders';
import {getNumFromPxString} from './Utils';
import {IAlignment, IBorder, ICellBorders, ICellMargins, IRowBorders, ITableBorders} from './Interfaces';
import Env from 'tinymce/core/api/Env';

//////////////////////////////////////////////////////////////////////////
// Util application logic used by cells, rows and table application
//////////////////////////////////////////////////////////////////////////

// Applies the old table attributes previously used as new styles
// Note: This only applies the changes if the old attribute is actually present
const translateOldTableProperties = ($table) => {
  if ($table) {
    // Parses a numerical attribute value if the attribute is present
    const parseAttrIfPresent = (attrName) => {
      let attrValue = $table.attr(attrName);
      if (attrValue) {
        attrValue = parseInt(attrValue, 10);
      }
      return attrValue;
    };

    // Attempts to parse an old attribute, if it is present applies the translation  function
    const translateAttr = (attrName, translateFn) => {
      const attrValue = parseAttrIfPresent(attrName);
      if (attrValue !== undefined) { translateFn(attrValue); }
      $table.removeAttr(attrName);
    };

    // Translates cell spacing
    const translateCellSpacing = (cellSpacing) => {
      if (cellSpacing === 0) {
        $table.css('border-collapse', 'collapse');
        $table.css('border-spacing', '');
      } else {
        $table.css('border-collapse', 'separate');
        $table.css('border-spacing', `${cellSpacing}px`);
      }
    };

    // Translates cell padding
    const translateCellPadding = (cellPadding) => {
      const margins: ICellMargins = {left: cellPadding, top: cellPadding, bottom: cellPadding, right: cellPadding};
      applyTableMargins(margins, $table);
    };

    // Translates border width
    const translateBorderWidth = (borderWidth) => {
      const border: IBorder = {width: borderWidth, color: '#000000'};
      $table.find('td').css('border', getCSSForBorder(border));
      $table.css('border-style', '');
    };

    const translations = {
      cellSpacing: translateCellSpacing,
      cellPadding: translateCellPadding,
      border: translateBorderWidth
    };

    Object.keys(translations).forEach((key) => translateAttr(key, translations[key]));
    $table.removeAttr('data-mce-style');
    $table.addClass('mce-item-table');
  }
};

// Adjusts the width of the table and all of its cells to apply the new width
const adjustTableWidth = ($table, newWidth) => {
  if ($table && $table.length === 1) {
    const cssWidth = $table[0].style.width || $table.css('width');
    if (cssWidth) {
      const oldWidth = getNumFromPxString(cssWidth);
      if (oldWidth !== newWidth) {
        // The overall table width has changed. We need to make the appropriate adjustments. There are set steps for
        // doing this that will ensure that we set the proper table cell widths with the least amount of effort:
        //  1. Set the table width. If the table cells don't already have widths set in CSS, then the cells will
        //     update to the correct width so we can set it manually in CSS later.
        //  2. Determine the ratio that the table either grew or shrunk by.
        //  3. Loop through the table cells. If the width for cells is not already set in CSS, set it to whatever
        //     the current actual width is. If the width is already set in CSS, then multiply it by the ratio we
        //     determined above and re-set it to the new width.
        $table.css('width', newWidth);
        $table.removeAttr('width');
        const ratio = newWidth / oldWidth;
        Array.from($table.find('td')).forEach((cell) => {
          const $cell = $(cell), cellStyleWidth = ($cell[0] as HTMLElement).style.width;
          const widthToSet = cellStyleWidth ?
            `${Math.round(getNumFromPxString(cellStyleWidth) * ratio)}px` :
            $cell.css('width'); // The width is not explicitly set on this cell, so we need to set it now.
          $cell.css('width', widthToSet);
        });
      }
    }
  }
};

// Applies the cell margins to the given selector
const applyMargins = ($ele, cellMargins: ICellMargins, applyFn: (m: ICellMargins, ele: any) => void) => {
  if ($ele && cellMargins) {
    applyFn(cellMargins, $ele);
  }
};

// Applies alignment to the given selector
const applyAlignmentToElement = ($ele, alignment: IAlignment) => {
  if ($ele && alignment) {
    $ele.css('text-align', alignment.horizontal);
    $ele.css('vertical-align', alignment.vertical);
    $ele.removeAttr('align');
    $ele.removeAttr('vAlign');
  }
};

// Applies the background color to the given selector
const applyColorToElement = ($ele, bgColor) => {
  if ($ele && (typeof bgColor === 'string')) {
    $ele.css('background-color', bgColor);
    $ele.removeAttr('bgColor');
  }
};

//////////////////////////////////////////////////////////////////////////
// Border application logic
//////////////////////////////////////////////////////////////////////////

// Determines if the selector has border-collapse set to separate
const areBordersSeparate = ($ele): boolean => $ele.css('border-collapse') === 'separate';

// Applies the cell borders to the given cell
const applyCellBorders = ($cell, cellBorders: ICellBorders, separateBorders: boolean) => {
  if (cellBorders) {
    Object.keys(cellBorders).forEach((key) => $cell.css(`border-${key}`, getCSSForBorder(cellBorders[key])));
    if (!separateBorders) {
      let $cellTmp = $cell.prev();
      // Set the right border on the cell to the left to match this cells left border
      $cellTmp.removeAttr('data-mce-style');
      $cellTmp.css('border-right', getCSSForBorder(cellBorders.left));
      // Set the left border on the cell to the right to match this cells right border
      $cellTmp = $cell.next();
      $cellTmp.removeAttr('data-mce-style');
      $cell.next().css('border-left', getCSSForBorder(cellBorders.right));
      // Set the bottom border on the cell above to match this cells top border
      $cellTmp = $($cell.parent().prev().children()[$cell.index()]);
      $cellTmp.removeAttr('data-mce-style');
      $cellTmp.css('border-bottom', getCSSForBorder(cellBorders.top));
      // Set the top border on the cell below to match this cells bottom border
      $cellTmp = $($cell.parent().next().children()[$cell.index()]);
      $cellTmp.removeAttr('data-mce-style');
      $cellTmp.css('border-top', getCSSForBorder(cellBorders.bottom));
    }
  }
};

// Applies the row borders to the given row
const applyRowBorders = ($row, rowBorders: IRowBorders, separateBorders: boolean,
                         alignment, bgColor) => {
  if (rowBorders) {
    const $cells = $row.find('td');
    $cells.css('border-left', getCSSForBorder(rowBorders.vertical));
    $cells.css('border-right', getCSSForBorder(rowBorders.vertical));
    // Set the top border on the cells in the row
    $cells.css('border-top', getCSSForBorder(rowBorders.top));
    let $tmpCells;
    if (!separateBorders) {
      // Set the bottom border on the row above, if was bigger it needs to match this
      $tmpCells = $row.prev().find('td');
      // Clear out any previous TinyMCE data it needs to be recomputed after these changes
      $tmpCells.removeAttr('data-mce-style');
      $tmpCells.css('border-bottom', getCSSForBorder(rowBorders.top));
    }
    // Set the bottom border on the cells in the row
    $cells.css('border-bottom', getCSSForBorder(rowBorders.bottom));
    if (!separateBorders) {
      // Set the top border on the row below, if it was bigger it needs to match this
      $tmpCells = $row.next().find('td');
      // Clear out any previous TinyMCE data it needs to be recomputed after these changes
      $tmpCells.removeAttr('data-mce-style');
      $tmpCells.css('border-top', getCSSForBorder(rowBorders.bottom));
    }

    applyAlignmentToElement($cells, alignment);
    applyColorToElement($cells, bgColor);

    // Set the left border on the left cell
    let $edgeCell = $row.find('td:first-child');
    $edgeCell.css('border-left', getCSSForBorder(rowBorders.left));

    // Set the right border on the right cell
    $edgeCell = $row.find('td:last-child');
    $edgeCell.css('border-right', getCSSForBorder(rowBorders.right));
  }
};

// Applies the table borders to the given table
const applyTableBorders = ($table, $cells, tableBorders: ITableBorders, bgColor) => {
  // Set the cells to have the internal vertical and horizontal borders
  let $tmpCells = $cells;
  const verticalCSS = getCSSForBorder(tableBorders.vertical), horizontalCSS = getCSSForBorder(tableBorders.horizontal);
  $tmpCells.css('border-left', verticalCSS);
  $tmpCells.css('border-right', verticalCSS);
  $tmpCells.css('border-top', horizontalCSS);
  $tmpCells.css('border-bottom', horizontalCSS);

  // Cells need to have their bgColor so when the tables is set it overrides the cells
  if (typeof bgColor === 'string') {
    $tmpCells.prop('bgColor', bgColor);
  }
  // Set the left border on the left cells
  $tmpCells = $table.find('tr td:first-child');
  $tmpCells.css('border-left', getCSSForBorder(tableBorders.left));
  // Set the right border on the right cells
  $tmpCells = $table.find('tr td:last-child');
  $tmpCells.css('border-right', getCSSForBorder(tableBorders.right));
  // Set the top border on the cells in the first row
  $tmpCells = $table.find('tr:first-child td');
  $tmpCells.css('border-top', getCSSForBorder(tableBorders.top));
  // Set the bottom border on the bottom cells
  $tmpCells = $table.find('tr:last-child td');
  $tmpCells.css('border-bottom', getCSSForBorder(tableBorders.bottom));
};

//////////////////////////////////////////////////////////////////////////
// Row/cell specific application logic
//////////////////////////////////////////////////////////////////////////

// Saves the properties to the given row or cell, this logic is the same for both
const saveCellRowProperties = ($ele, isCell: boolean,
                               borders: ICellBorders | IRowBorders,
                               cellMargins: ICellMargins,
                               alignment: IAlignment,
                               bgColor) => {
  translateOldTableProperties($($ele.closest('table')));
  applyMargins($ele, cellMargins, isCell ? applyCellMargins : applyRowMargins);
  isCell ?
    applyCellBorders($ele, borders, areBordersSeparate($ele)) :
    applyRowBorders($ele, borders as IRowBorders, areBordersSeparate($ele), alignment, bgColor);
  applyAlignmentToElement($ele, alignment);
  applyColorToElement($ele, bgColor);
};

// Saves the cell properties to the given cell
const saveCellProperties = (editor, node,
                            cellBorders: ICellBorders,
                            cellMargins: ICellMargins,
                            alignment: IAlignment,
                            bgColor) => {
  if (editor && node) {
    editor.undoManager.transact(() => {
      const $cell = $(node);
      $cell.removeAttr('data-mce-style'); // Remove cached tinymce style
      saveCellRowProperties($cell, true, cellBorders, cellMargins, alignment, bgColor);
    });
  }
};

// Saves the row properties to the given row
const saveRowProperties = (editor, node,
                           rowBorders: IRowBorders,
                           cellMargins: ICellMargins,
                           alignment: IAlignment,
                           bgColor) => {
  if (editor && node) {
    editor.undoManager.transact(() => {
      const $row = $(node);
      $row.children('td').addBack().removeAttr('data-mce-style'); // Remove cached tinymce style
      saveCellRowProperties($row, false, rowBorders, cellMargins, alignment, bgColor);
    });
  }
};

//////////////////////////////////////////////////////////////////////////
// Table specific application logic
//////////////////////////////////////////////////////////////////////////

// Inserts a blank table with the given number of rows and columns
const insertTable = (editor, rows, columns) => {
  // Copied from the TinyMCE table plugin.
  let html = '<table id="tinysc-table"><tbody>';

  for (let y = 0; y < rows; y++) {
    html += '<tr>';

    for (let x = 0; x < columns; x++) {
      html += '<td>' + (Env.ie ? ' ' : '<br>') + '</td>';
    }

    html += '</tr>';
  }

  html += '</tbody></table><p>&nbsp;</p>';

  editor.insertContent(html);
  // END copy from TinyMCE
  return $(editor.dom.select('#tinysc-table'));
};

// Applies the width and cell spacing to the given table
const applyTableWidthAndSpacing = ($table, width, cellSpacing) => {
  // Don't set width 0 on the table or it will not be visible. Instead, follow the behavior of the native client and
  // do not set a width at all, which will let the browser draw the table at its min width
  if (!isNaN(width) && width !== 0) {
    adjustTableWidth($table, width);
  }

  // Set the border styling and cell spacing on the table
  if (!isNaN(cellSpacing)) {
    if (cellSpacing === 0) {
      $table.css('border-collapse', 'collapse');
      $table.css('border-spacing', '');
    } else {
      $table.css('border-spacing', cellSpacing + 'px');
      $table.css('border-collapse', 'separate');
    }
  }
};

// Applies the given alignment to the given table
const applyTableAlignment = ($table, alignment) => {
  if (alignment) {
    if (alignment === 'left' || alignment === 'right') {
      $table.css('float', alignment);
    } else if (alignment === 'center') {
      $table.css('float', 'none');
      $table.css('margin-left', 'auto');
      $table.css('margin-right', 'auto');
    }
    $table.removeAttr('align');
  }
};

// Focuses the first table cell if applicable
const focusFirstCellIfApplicable = (editor, $table, insertMode: boolean) => {
  let focusFirstCell = true;
  if (!insertMode) {
    // Check if selection is in a cell still. If not, it means the cell was removed
    // by this table edit, and we need to put the cursor in the first cell.
    const node = editor.selection.getNode();
    if (node && $(node).closest('td').length) {
        focusFirstCell = false;
    }
  }

  // Put the cursor in the first cell when inserting a table, or when a table edit removes the cell that had the cursor.
  if (focusFirstCell) {
    const firstCell = $table.find('td').first();
    if (firstCell.length) {
      editor.selection.setCursorLocation(firstCell[0], 0);
    }
  }
};

// Inserts or saves the given table
const insertOrSaveTable = (editor, node, rows, columns, width,
                           tableBorders: ITableBorders,
                           alignment, cellSpacing,
                           cellMargins: ICellMargins,
                           bgColor) => {
  if (editor) {
    editor.undoManager.transact(() => {
      let $table;
      const insertMode = !node;
      if (insertMode) {
        $table = insertTable(editor, rows, columns);
      } else {
        $table = $(node);
        translateOldTableProperties($table);
      }
      if ($table && $table.length) {
        applyTableWidthAndSpacing($table, width, cellSpacing);
      }
      const $cells = $table.find('td');
      // Clear out any previous TinyMCE data it needs to be recomputed after these changes
      $table.removeAttr('data-mce-style');
      $cells.removeAttr('data-mce-style');
      applyMargins($table, cellMargins, applyTableMargins);
      applyTableBorders($table, $cells, tableBorders, bgColor);
      applyTableAlignment($table, alignment);
      applyColorToElement($table, bgColor);
      $table.removeAttr('id');
      focusFirstCellIfApplicable(editor, $table, insertMode);
    });
  }
};

export {saveCellProperties, saveRowProperties, insertOrSaveTable};
