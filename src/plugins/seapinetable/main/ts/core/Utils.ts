/**
 * @file Utils.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import DOMUtils from 'tinymce/core/api/dom/DOMUtils';

//////////////////////////////////////////////////////////////////////////
// Generic string manipulation
//////////////////////////////////////////////////////////////////////////

// Gets the num from a CSS string that may have px in it
const getNumFromPxString = (pxString): number => {
  let num = parseInt(pxString.substring(0, pxString.indexOf('px')), 10);
  if (isNaN(num)) {
    num = 0;
  }
  return num;
};

//////////////////////////////////////////////////////////////////////////
// Counting table rows/columns
//////////////////////////////////////////////////////////////////////////

// Gets the number of table rows
const countTableRows = ($table) => !!$table ? $table.find('tr').length : 0;
// Table columns is the columns of the row with the most columns
const countTableColumns = ($table) => {
  const countRowCols = ($row) => !!$row ? Array.from($row.find('td')).reduce((cols, row) => cols + $(row).prop('colSpan'), 0) : 0;
  const reducer = (currMaxCols: number, row) => Math.max(countRowCols($(row)), currMaxCols);
  return !!$table ? Array.from($table.find('tr')).reduce(reducer, 0) : 0;
};

//////////////////////////////////////////////////////////////////////////
// Alignment util functions
//////////////////////////////////////////////////////////////////////////

// Gets the table alignment
const getTableAlignment = ($table) => {
  let align = '';
  if ($table && $table.length === 1) {
    switch ($table.css('float)')) {
      case 'left':
        align = 'left';
        break;
      case 'right':
        align = 'right';
        break;
      case 'none':
        align = $table[0].style['margin-left'] === 'auto' && $table[0].style['margin-right'] === 'auto' ?
          'center' : $table.attr('align');
        break;
      default:
        align = $table.attr('align');
        break;
    }
  }
  return align;
};
// Gets the table cells text alignment, uses the fallback attribute if not present
const getCellTextAlignmentStyle = ($cells, style, fallbackAttr): string => {
  let alignment = '';
  if ($cells && $cells.length) {
    alignment =  $cells[0].style[style] ? $cells.css(style) : $cells.attr(fallbackAttr);
  }
  return alignment;
};
// Gets the table cells text alignment
const getTableCellsTextAlignment = ($cells) => getCellTextAlignmentStyle($cells, 'text-align', 'align');
// Gets the table cells text vertical alignment
const getTableCellsVerticalTextAlignment = ($cells) => getCellTextAlignmentStyle($cells, 'vertical-align', 'vAlign');

//////////////////////////////////////////////////////////////////////////
// Background color util functions
//////////////////////////////////////////////////////////////////////////

// Gets the background color off the given selector if present
const getBackgroundColorIfPresent = ($element) => {
  let color = '';
  if ($element && $element.length) {
    color = $element[0].style['background-color'] ?
      DOMUtils.DOM.toHex($element.css('background-color')) : $element.attr('bgColor');
  }
  return color;
};
// Gets the table background color
const getTableBackgroundColor = ($table) => {
  let color;
  if ($table && $table.length === 1) {
    color = getBackgroundColorIfPresent($table);
    if (!color) { // No color found try to grab from the cells
      color = getBackgroundColorIfPresent($table.find('td'));
    }
  }
  return color;
};
// Gets the table cells background color
const getTableCellsBackgroundColor = ($cells) => getBackgroundColorIfPresent($cells);

export {
  getNumFromPxString, countTableRows, countTableColumns,
  getTableAlignment, getTableBackgroundColor,
  getTableCellsBackgroundColor, getTableCellsTextAlignment, getTableCellsVerticalTextAlignment
};