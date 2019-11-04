/**
 * @file Borders.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {IBorder, ICellBorders, IRowBorders, ISharedBorderStyle, ITableBorders} from './Interfaces';
import {DefaultBorder} from './Constants';
import DOMUtils from 'tinymce/core/api/dom/DOMUtils';
import {getNumFromPxString} from './Utils';

//////////////////////////////////////////////////////////////////////////
// Border util functions
//////////////////////////////////////////////////////////////////////////

// Gets the CSS string for the border
const getCSSForBorder = (border: IBorder) => {
  let css = 'none';
  if (border && border.width > 0) {
    css = `${border.width}px ${border.color} solid`;
  }
  return css;
};

// Gets the uppercase hex for a string
const toHexUpper = (colorStr) => DOMUtils.DOM.toHex(colorStr).toUpperCase();

/**
 * Gets the border width string for the given cell.
 *
 * NOTE TTBugs #41231
 * This is needed because FireFox getComputedStyle returns an incorrect value when querying the top and left borders
 * of a cell in a table where border-collapse is on. This causes jquery to return the same incorrect value.
 *
 * Due to this we are pulling the value directly off of the style on the cell. If the borders are set not on
 * the cell elements this, and large amounts of the border styling functionality will break.
 *
 * @param {jQuery} $cell Cell selector, should only contain one HTMLElement.
 * @param {String} borderCSSStyleStr The CSS style property to get the information for.
 * @returns {String} The string containing the border width information.
 */
const getBorderWidthForCell = ($cell, borderCSSStyleStr) => {
  let borderWidth = '0px';
  if ($cell && $cell.length === 1) {
    const borderStyleStr = $cell[0].style[borderCSSStyleStr];
    // On old tables the border may not be set on the cell itself - use the computed value for the cell if needed.
    borderWidth =  borderStyleStr ? borderStyleStr : $cell.css(borderCSSStyleStr);
  }
  return borderWidth;
};

// Translates 'top' and 'width' to 'border-top-width' to be used to get specific border styles and widths
const getCSSBorderStr = (borderStr, propStr) => `border-${borderStr}-${propStr}`;

//////////////////////////////////////////////////////////////////////////
// Border getter functions
//////////////////////////////////////////////////////////////////////////

/**
 * Gets the border information for a cell
 * @param $cell - the cell to get the border for
 * @param borderStr - The border to get the information for. Should be 'top' 'left' 'right' or 'bottom'.
 * @returns {IBorder} the border
 */
const getBorderForCell = ($cell, borderStr) => {
  const border: IBorder = DefaultBorder;
  if ($cell && borderStr) {
    const getCSSStr = (prop) => getCSSBorderStr(borderStr, prop);
    const borderStyleStr = $cell.css(getCSSStr('style'));
    if (borderStyleStr === 'hidden' || borderStyleStr === 'none') {
      border.width = 0;
    } else {
      const borderWidth = getNumFromPxString(getBorderWidthForCell($cell, getCSSStr('width')));
      border.width = borderWidth;
      if (borderWidth > 0) {
        border.color = toHexUpper($cell.css(getCSSStr('color')));
      }
    }
  }
  return border;
};

// Get width, color, and remaining cells
const getFirstBorderAndCellsFromRow = ($row, widthCSSStr, colorCSSStr) => {
  const $cells: any[] = Array.from($row.find('td'));
  const $firstCell = $($cells.shift());
  const width: string = getBorderWidthForCell($firstCell, widthCSSStr);
  // @ts-ignore
  const color: string = $firstCell.css(colorCSSStr) as string;
  return {width, color, $cells};
};

// Get width, color and remaining rows
const getFirstBorderAndRowsFromTable = ($table, borderStr) => {
  const $rows: any[] = Array.from($table.find('tr'));
  const $firstRow = $($rows.shift());
  return {rowBorder: getBorderForRow($firstRow, borderStr), $rows};
};

// Whether the cells' border widths and colors match the given ones
const doCellBordersMatch = ($cells: any[], width, color, widthCSSStr, colorCSSStr): boolean => {
  return $cells.every((cell) => { // See if a non-matching border is found
    const $cell = $(cell);
    return $cell.css(colorCSSStr) === color && getBorderWidthForCell($cell, widthCSSStr) === width;
  });
};

// Grab the top or bottom border of all of the cells, set it if they are the same, if not use default
const getRowTopBottomBorderForRow = ($row, widthCSSStr, colorCSSStr): IBorder => {
  const border: IBorder = DefaultBorder;
  const {width, color, $cells} = getFirstBorderAndCellsFromRow($row, widthCSSStr, colorCSSStr);
  if (doCellBordersMatch($cells, width, color, widthCSSStr, colorCSSStr)) {
    border.width = getNumFromPxString(width);
    border.color = toHexUpper(color);
  }
  return border;
};

// Grab the right border of the furthest right or left border of the furthest left
const getLeftRightBorderForRow = ($cell, widthCSSStr, colorCSSStr): IBorder => {
  const border: IBorder = DefaultBorder;
  border.width = getNumFromPxString(getBorderWidthForCell($cell, widthCSSStr));
  border.color = toHexUpper($cell.css(colorCSSStr));
  return border;
};

// Grab the inner borders of all of the cells and set the vertical border if they are the same
const getRowVerticalBorderForRow = ($row) => {
  const border: IBorder = DefaultBorder;
  const leftCSS = 'border-left-', rightCSS = 'border-right-';
  const {width, color, $cells} = getFirstBorderAndCellsFromRow($row, rightCSS + 'width', rightCSS + 'color');
  // Partially applied border matcher for vertical borders
  const doVerticalBordersMatch = (widthStr, colorStr) => doCellBordersMatch($cells, width, color, widthStr, colorStr);
  // Check the left border of all the inner cells except the left most
  const leftMatching = doVerticalBordersMatch(leftCSS + 'width', leftCSS + 'color');
  // Check the right border of all the inner cells except the most right
  $cells.pop(); // Remove the right most so it is not checked
  if (leftMatching && doVerticalBordersMatch(rightCSS + 'width', rightCSS + 'color')) {
    border.width = getNumFromPxString(width);
    border.color = toHexUpper(color);
  }
  return border;
};

/**
 * Gets the border information for a row
 * @param $row - the row to get the border for
 * @param borderStr - The border to get the information for. Should be 'top' 'left' 'right' 'bottom' or 'horizontal'.
 * @returns {IBorder} the border
 */
const getBorderForRow = ($row, borderStr): IBorder => {
  let border: IBorder = DefaultBorder;
  if ($row && borderStr) {
    const getCSSStr = (prop) => getCSSBorderStr(borderStr, prop);
    const widthCSSStr = getCSSStr('width');
    const colorCSSStr = getCSSStr('color');
    const getRowLeftRightBorder = ($cell) =>  getLeftRightBorderForRow($cell, widthCSSStr, colorCSSStr);
    switch (borderStr) {
      case 'top':
      case 'bottom':
        border = getRowTopBottomBorderForRow($row, widthCSSStr, colorCSSStr);
        break;
      case 'left':
        border = getRowLeftRightBorder($row.find('td:first-child'));
        break;
      case 'right':
        border = getRowLeftRightBorder($row.find('td:last-child'));
        break;
      case 'vertical':
        border = getRowVerticalBorderForRow($row);
        break;
      default: // Hand back default border
        break;
    }
  }
  return border;
};

// Whether the rows' border widths and colors match the given ones
const doRowBordersMatch = ($rows: any[], border, borderStr): boolean => {
  return $rows.every((row) => { // See if a non-matching border is found
    const testBorder = getBorderForRow($(row), borderStr);
    return border.color === testBorder.color && border.width === testBorder.width;
  });
};

// Gets the left or right border for the table
const getTableLeftRightVerticalBorder = ($table, borderStr) => {
  let border: IBorder = DefaultBorder;
  const {rowBorder, $rows} = getFirstBorderAndRowsFromTable($table, borderStr);
  if (doRowBordersMatch($rows, border, borderStr)) {
    border = rowBorder;
  }
  return border;
};

// Get horizontal border for the table
const getTableHorizontalBorder = ($table) => {
  let border: IBorder = DefaultBorder;
  const {rowBorder, $rows} = getFirstBorderAndRowsFromTable($table, 'bottom');
  // Check the top border of all of the rows (except the most top)
  const topBordersMatch = doRowBordersMatch($rows, rowBorder, 'top');
  // Check the bottom border of all the rows (except the bottom most)
  $rows.pop(); // Don't check the bottom border of the last row
  if (topBordersMatch && doRowBordersMatch($rows, rowBorder, 'bottom')) {
    border = rowBorder;
  }
  return border;
};

/**
 * Gets the border information for the given table
 * @param $table - the table to get the border for
 * @param borderStr - The border to get the information for. Should be 'top' 'left' 'right' 'bottom' 'horizontal' or 'vertical'.
 * @returns {IBorder} the border
 */
const getBorderForTable = ($table, borderStr): IBorder => {
  let border: IBorder = DefaultBorder;
  if ($table && borderStr) {
    const $rows = $table.find('tr');
    switch (borderStr) {
      case 'left':
      case 'right':
      case 'vertical':
        border = getTableLeftRightVerticalBorder($table, borderStr);
        break;
      case 'top':
        border = getBorderForRow($($rows[0]), borderStr);
        break;
      case 'bottom':
        border = getBorderForRow($($rows[$rows.length - 1]), borderStr);
        break;
      case 'horizontal':
        border = getTableHorizontalBorder($table);
        break;
      default: // Hand back default border
        break;
    }
  }
  return border;
};

//////////////////////////////////////////////////////////////////////////
// Border style functions
//////////////////////////////////////////////////////////////////////////

// Converts a border interface to an array of borders
const borderInterfaceToArray = (borders: ICellBorders | IRowBorders | ITableBorders): IBorder[] =>
  Object.keys(borders).map((key) => borders[key]);

// Gets the outside borders from an interface
const getOutsideBorders = (borders: IRowBorders | ITableBorders): IBorder[] =>
  [borders.top, borders.left, borders.right, borders.bottom];

// Determines if the array of borders all match
const doBordersMatch = (borders: IBorder[]): boolean => {
  let bordersMatch = true;
  if (borders.length > 1) {
    const firstBorder: IBorder = borders.shift();
    bordersMatch = borders.every((border) => border.width === firstBorder.width && border.color === firstBorder.color);
  }
  return bordersMatch;
};

// Determines if all the borders on the interface match
const allBordersMatch = (borders: ICellBorders | IRowBorders | ITableBorders): boolean =>
  doBordersMatch(borderInterfaceToArray(borders));

// Determines if the outer borders on the interface match
const outerBordersMatch = (borders: IRowBorders | ITableBorders): boolean => doBordersMatch(getOutsideBorders(borders));

// Gets the first border style, used to get a style when they all match on the interface
const getFirstStyleFromInterface = (borders: ICellBorders | IRowBorders | ITableBorders): ISharedBorderStyle =>
  borders.top.width === 0 ?
    {style: 'none'} :
    {style: 'full', commonWidth: borders.top.width, commonColor: borders.top.color};

// Gets the border style for the given cell
const getBorderStyleForCell = (cellBorders: ICellBorders): ISharedBorderStyle =>
  allBordersMatch(cellBorders) ? getFirstStyleFromInterface(cellBorders) : {style: 'custom'};

// Gets the border style when the inner borders match, but not all borders
const getInnerMatchingStyle = (borders: IRowBorders | ITableBorders): ISharedBorderStyle => {
  let style: ISharedBorderStyle;
  const innerWidth = borders.vertical.width;
  if (innerWidth === 0) { // No inner width, this is a box
    style = {style: 'box', commonWidth: borders.top.width, commonColor: borders.top.color};
  } else if (borders.top.color === borders.vertical.color) { // If the inner width is one this is a grid
    style = innerWidth === 1 ? {style: 'grid', commonWidth: borders.top.width} : {style: 'custom'};
    style.commonColor = borders.top.color;
  } else {
    style = {style: 'custom'};
  }
  return style;
};

// Gets the border style for the row or table
const getBorderStyleForRowTable = (borders: IRowBorders | ITableBorders, innerBordersMatch: boolean): ISharedBorderStyle =>
  allBordersMatch(borders) ?
    getFirstStyleFromInterface(borders) : // All borders match grab first style
    outerBordersMatch(borders) && innerBordersMatch ? // Check if the outer and inner borders match amongst themselves
      getInnerMatchingStyle(borders) : // Get the style for when the inner borders are matching
      {style: 'custom'};

// Gets the border style for the given row
const getBorderStyleForRow = (rowBorders: IRowBorders): ISharedBorderStyle =>
  getBorderStyleForRowTable(rowBorders, true); // The inside borders always match for a row, vertical matches itself

// Gets the border style for the given table
const getBorderStyleForTable = (tableBorders: ITableBorders): ISharedBorderStyle =>
  getBorderStyleForRowTable(tableBorders, doBordersMatch([tableBorders.horizontal, tableBorders.vertical]));

export {
  getCSSForBorder,
  getBorderForTable, getBorderStyleForTable,
  getBorderForRow, getBorderStyleForRow,
  getBorderForCell, getBorderStyleForCell
};