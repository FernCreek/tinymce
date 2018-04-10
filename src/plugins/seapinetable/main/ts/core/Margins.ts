/**
 * @file Margins.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {ICellMargins} from './Interfaces';
import {MarginNames, TableConstants, TableMargins} from './Constants';
import {getNumFromPxString} from './Utils';

//////////////////////////////////////////////////////////////////////////
// Margin related util functions
//////////////////////////////////////////////////////////////////////////

// Converts a margin interface into an array
const marginsToArray = (margins: ICellMargins) => [margins.top, margins.right, margins.bottom, margins.left];
// Checks if a margin is invalid
const isInvalidMargin = (margin: string | number): boolean => {
  let invalid = false;
  if (typeof margin !== 'number') {
    const asNum = parseInt(margin, 10);
    invalid = isNaN(asNum) || !isFinite(asNum);
  } else {
    invalid = margin < 0;
  }
  return invalid;
};
// Determines if the margins are all valid
const areMarginsValid = (margins: ICellMargins): boolean =>  marginsToArray(margins).every((margin) => !isInvalidMargin(margin));
// Converts the margins to a CSS string
const marginsToCSS = (margins: ICellMargins, defaultMargin): string => {
  return marginsToArray(margins).reduce((css, margin) => {
    return css += `${isInvalidMargin(margin) ? defaultMargin : margin}px `;
  }, '');
};
// Converts a margins array into a CSS string
const marginsArrayToCSS = (marginsArray): string => {
  let css = '';
  if (marginsArray && marginsArray.length === 4) {
    const margins: ICellMargins = {
      top: marginsArray[TableMargins.kTop],
      bottom: marginsArray[TableMargins.kBottom],
      left: marginsArray[TableMargins.kLeft],
      right: marginsArray[TableMargins.kRight]
    };
    css = marginsToCSS(margins, TableConstants.kDefaultCellMargin);
  }
  return css;
};

//////////////////////////////////////////////////////////////////////////
// Margin determination util functions
//////////////////////////////////////////////////////////////////////////

// Determines if padding is explicitly set on an element or nowt
const isPaddingExplicitlySet = ($element): boolean => {
  let explicitlySet = false;
  if ($element && $element.length === 1) {
    explicitlySet = !!$element[0].style.padding;
    if (!explicitlySet) {
      explicitlySet = MarginNames.findIndex((name) => !!$element[0].style[`padding-${name}`]) !== -1;
    }
  }
  return explicitlySet;
};
// Gets the configured margins of an element
const getElementMarginsArray = ($element) => {
  let margins = Array(4).fill(TableConstants.kDefaultCellMargin);
  if ($element && $element.length === 1) {
    margins = MarginNames.map((name) => {
      const padding = $element[0].style[`padding-${name}`];
      let margin = padding ? getNumFromPxString(padding) : TableConstants.kDefaultCellMargin;
      if (margin > TableConstants.kDefaultMaxMargin) {
        margin = TableConstants.kDefaultCellMargin;
      }
      return margin;
    });
  }
  return margins;
};
// Determines the margins on the element and gets the CSS string
const getElementMarginsCSS = ($element): string => marginsArrayToCSS(getElementMarginsArray($element));
// Determines if the given cell overrides the rest of the tables' margins
const doesCellOverrideMargins = ($cell): boolean => {
  let overrides = false;
  if ($cell && $cell.length === 1 && isPaddingExplicitlySet($cell)) {
    const cellCSS = getElementMarginsCSS($cell);
    const parentCSS = determineParentMarginCSS($cell, ['tr', 'table']);
    overrides = cellCSS ? cellCSS !== parentCSS : !!parentCSS;
  }
  return overrides;
};
// Determines if the given cells' padding matches the given CSS string
const doesCellMatchMargins = ($cell, cssPadding): boolean => {
  let matches = true;
  if ($cell && $cell.length === 1 && isPaddingExplicitlySet($cell)) {
    const css = getElementMarginsCSS($cell);
    if (css && css !== cssPadding) {
      matches = false;
    }
  }
  return matches;
};
// Determines the parent CSS if its explicitly set
const determineParentMarginCSS = ($element, parents) => {
  let parentCSS;
  parents.find((parentName) => {
    let foundParent = false;
    const $ele = $element.closest(parentName);
    if (isPaddingExplicitlySet($ele)) {
      parentCSS = getElementMarginsCSS($ele);
      foundParent = true;
    }
    return foundParent;
  });
  return parentCSS;
};

//////////////////////////////////////////////////////////////////////////
// Table and row margin getters
//////////////////////////////////////////////////////////////////////////

// Determines if the siblings margins all match
const doSiblingMarginsMatch = ($siblings): boolean => {
  let siblingsMatch = true;
  const arrSiblings = Array.from($siblings);
  if (arrSiblings && arrSiblings.length > 1) {
    const $first = $(arrSiblings.shift());
    const firstStr = getElementMarginsArray($first).toString();
    // Try to find the index of a sibling where the margins do not match
    siblingsMatch = arrSiblings.findIndex((sibling) => getElementMarginsArray($(sibling)).toString() !== firstStr) === -1;
  }
  return siblingsMatch;
};

/**
 * Determines the margins array for the given row
 * 1. Get the margins from the row
 * 2. If they're not on the row get the margins from the table
 * 3. If they're not on the table if all of all the cells margins match use those
 * 4. If the cells margins don't match just hand back the default margins
 * @param $row - the row
 * @returns the margins array
 */
const getRowMarginsArray = ($row) => {
  let marginsArray = Array(4).fill(TableConstants.kDefaultCellMargin);
  if ($row && $row.length === 1) {
    if (isPaddingExplicitlySet($row)) {
      marginsArray = getElementMarginsArray($row);
    } else { // Padding isn't set on the row, check on the table
      const $table = $row.closest('table');
      if (isPaddingExplicitlySet($table)) {
        marginsArray = getElementMarginsArray($table);
      } else { // Padding isn't on the table, check to see if the cells have matching padding styles
        const $cells = $row.find('td');
        if (doSiblingMarginsMatch($cells)) {
          marginsArray = getElementMarginsArray($($cells[0]));
        }
      }
    }
  }
  return marginsArray;
};

/**
 * Determines the margins array for the given row
 * 1. Get the margins from the table
 * 2. If they're not on the the table get the margins from rows
 * 3. If the row margins don't match just hand back the default margins
 * @param $table - the table
 * @returns the margins array
 */
const getTableMarginsArray = ($table) => {
  let marginsArray = Array(4).fill(TableConstants.kDefaultCellMargin);
  if ($table && $table.length === 1) {
    if (isPaddingExplicitlySet($table)) {
      marginsArray = getElementMarginsArray($table);
    } else { // Padding isn't set on the table, check the rows
      const $rows = $table.find('tr');
      if ($rows && $rows.length && doSiblingMarginsMatch($rows)) {
        marginsArray = getElementMarginsArray($($rows[0]));
      }
    }
  }
  return marginsArray;
};

//////////////////////////////////////////////////////////////////////////
// Margin application util functions
//////////////////////////////////////////////////////////////////////////

// Applies the margins to the specified table
const applyTableMargins = (margins: ICellMargins, $table) => {
  if (margins && $table) {
    let oldCSS;
    if (isPaddingExplicitlySet($table)) {
      oldCSS = getElementMarginsCSS($table);
    }
    const newCSS = marginsToCSS(margins, TableConstants.kDefaultCellMargin);
    $table.css('padding', newCSS);
    Array.from($table.find('tr')).forEach((row) => {
      const $row = $(row);
      if (!isPaddingExplicitlySet($row)) { // If a row is overriding our margins, don't mess with it.
        // Check to see if the cell matches our old margins, if they do, then our margins weren't actually overridden.
        Array.from($row.find('td')).forEach((cell) => {
          const $cell = $(cell);
          if (!oldCSS && !isPaddingExplicitlySet($cell) || doesCellMatchMargins($cell, oldCSS)) {
            $cell.css('padding', newCSS);
          }
        });
      }
    });
  }
};
// Applies the margins to the specified row
const applyRowMargins = (margins: ICellMargins, $row) => {
  if ($row && margins && areMarginsValid(margins)) {
    const oldCSS = marginsArrayToCSS(getRowMarginsArray($row));
    const newCSS = marginsToCSS(margins, TableConstants.kDefaultCellMargin);
    $row.css('padding', newCSS);
    Array.from($row.find('td')).forEach((cell) => { // Reset the padding on any cell that doesn't match the old CSS
      const $cell = $(cell);
      if (!oldCSS || doesCellMatchMargins($cell, oldCSS)) {
        $cell.css('padding', newCSS);
      }
    });
  }
};
// Applies the cell margins to the specified cell
const applyCellMargins = (margins: ICellMargins, $cell) => {
  if ($cell && margins) {
    const marginCSS = areMarginsValid(margins) ?
      marginsToCSS(margins, TableConstants.kDefaultCellMargin) : // Margins are valid use them
      determineParentMarginCSS($cell, ['tr', 'table']); // Invalid, determine from parents
    $cell.css('padding', marginCSS);
  }
};

export {
  applyTableMargins, applyRowMargins, applyCellMargins,
  getTableMarginsArray, getRowMarginsArray, getElementMarginsArray,
  doesCellOverrideMargins, isPaddingExplicitlySet
};