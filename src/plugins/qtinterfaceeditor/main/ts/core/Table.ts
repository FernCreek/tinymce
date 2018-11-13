/**
 * @file Table.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {SPTinyMCEInterface} from 'shims/sptinymceinterface';
import {EditorCache} from './Cache';

//////////////////////////////////////////////////////////////////////////
// Table constants, see seapinetable plugin
//////////////////////////////////////////////////////////////////////////

// The cell margin names in order of their constants, see seapinetable TableMargins
const orderedMarginNames = ['top', 'bottom', 'left', 'right'];
// The names for the borders used as keys on the JSON and on the seapinetable plugin interfaces
const cellBorderNames = ['top', 'left', 'right', 'bottom'];
const rowBorderNames = cellBorderNames.concat('vertical');
const tableBorderNames = rowBorderNames.concat('horizontal');

//////////////////////////////////////////////////////////////////////////
// Table util functions (mostly to and from JSON helpers)
//////////////////////////////////////////////////////////////////////////

// Gets a border from the provided JSON border information
const getBorderFromJSON = (jsonBorder) => !!jsonBorder ? {width: jsonBorder.width, color: jsonBorder.color} : {width: 0, color: ''};
// Makes a key value pair object from the given key and value
const makeKVP = (str, value) => ({[str]: value});
// Makes a border interface from the JSON border information
const makeBorderInterfaceFromJSON = (borderNames, jsonBorders) => {
  const safeBorderObj = !!jsonBorders ? jsonBorders : {};
  return borderNames.reduce((borders, str) => Object.assign(borders, makeKVP(str, getBorderFromJSON(safeBorderObj[str]))), {});
};
// Makes an alignment interface from JSON
const makeAlignmentInterfaceFromJSON = (json) => ({horizontal: json.alignment, vertical: json.alignmentV});
// Validates the BG color
const validateBgColor = (color) => (!!color ? color : '#ffffff').toUpperCase();
// Sets the JSON alignments
const setJSONAlignmentBgColor = (plugin, $cells, json) => {
  json.alignment = plugin.getTableCellsTextAlignment($cells) || 'left';
  json.alignmentV = plugin.getTableCellsVerticalTextAlignment($cells) || 'middle';
  json.bgColor = validateBgColor(plugin.getTableCellsBackgroundColor($cells));
};
// Sets the JSON margins
const setJSONMargins = (marginsArray, json) =>
  json.cellMargins = orderedMarginNames.reduce((margins, str, idx) => Object.assign(margins, makeKVP(str, marginsArray[idx])), {});
// Sets the JSON border style
const setJSONBorderStyle = (borderStyle, json) => {
  json.borderStyle = borderStyle.style;
  if (borderStyle.commonColor) {
    json.borderColor = borderStyle.commonColor;
  }
  if (borderStyle.commonWidth) {
    json.borderWidth = borderStyle.commonWidth;
  }
};
// Gets the border interface for the given element
const getBorderInterface = (getBorderFn, $element, borderNames) =>
  borderNames.reduce((borders, str) => Object.assign(borders, makeKVP(str, getBorderFn($element, str))), {});

//////////////////////////////////////////////////////////////////////////
// Editor commands - saving and setting properties
//////////////////////////////////////////////////////////////////////////

// Whether there is currently a row to paste
let hasRowToPaste = false;

// Executes the provided table command
const fireTableCommand = (editor, cmd) => {
  editor.execCommand(cmd);
  switch (cmd) {
    case 'mceTableCutRow':
    case 'mceTableCopyRow':
      hasRowToPaste = true;
      break;
    case 'mceTablePasteRowBefore':
    case 'mceTablePasteRowAfter':
      hasRowToPaste = false;
      break;
    default:
      break;
  }
  SPTinyMCEInterface.signalHasRowToPaste(hasRowToPaste);
};

// Inserts a new table or applies different settings to the current table in the editor
const insertOrSaveTable = (editor, json, bInsert) => {
  const tablePlugin = editor.plugins.seapinetable;
  if (tablePlugin) {
    tablePlugin.insertOrSaveTable(
      bInsert ? undefined : EditorCache.getTableElement(),
      json.rows, json.columns, parseInt(json.width, 10),
      makeBorderInterfaceFromJSON(tableBorderNames, json.borders),
      json.alignment, parseInt(json.cellSpacing, 10), json.cellMargins, json.bgColor
    );
  }
};
// Saves the row or cell properties
const saveRowCellProperties = (editor, json, bIsCell) => {
  const tablePlugin = editor.plugins.seapinetable;
  const cachedEle = bIsCell ? EditorCache.getCellElement() : EditorCache.getRowElement();
  if (tablePlugin && cachedEle) {
    const saveFn = bIsCell ? tablePlugin.saveCellProperties : tablePlugin.saveRowProperties;
    saveFn(
      cachedEle,
      makeBorderInterfaceFromJSON(bIsCell ? cellBorderNames : rowBorderNames, json.borders),
      json.cellMargins,
      makeAlignmentInterfaceFromJSON(json),
      json.bgColor
    );
  }
};
// Applies the given properties to the current row in the editor
const setRowProperties = (editor, json) => saveRowCellProperties(editor, json, false);
// Applies the given properties to the current cell in the editor
const setCellProperties = (editor, json) => saveRowCellProperties(editor, json, true);

//////////////////////////////////////////////////////////////////////////
// Property request handlers, gets the information for qt
//////////////////////////////////////////////////////////////////////////

// Set common json shared between tables, rows and cells
const setCommonJSON = (tablePlugin, $ele, json, getMarginsFn, getBorderFn, borderNames, getBorderStyleFn) => {
  setJSONMargins(getMarginsFn($ele), json);
  const borders = getBorderInterface(getBorderFn, $ele, borderNames);
  json.borders = JSON.parse(JSON.stringify(borders));
  setJSONBorderStyle(getBorderStyleFn(borders), json);
};
// Sets table specific json
const makeTableSpecificJSON = (tablePlugin, $tableElement, tableElement) => ({
  cellSpacing: $tableElement.css('border-collapse') === 'separate' ? tablePlugin.getNumFromPxString($tableElement.css('borderSpacing')) : 0,
  alignment: tablePlugin.getTableAlignment($tableElement) || 'left',
  bgColor: validateBgColor(tablePlugin.getTableBackgroundColor($tableElement)),
  rows: tablePlugin.countTableRows($tableElement),
  columns: tablePlugin.countTableColumns($tableElement),
  width: tableElement.offsetWidth
});
// Determines and emits the signal with the properties of the selected table
const requestTableProperties = (editor) => {
  const tablePlugin = editor.plugins.seapinetable;
  const tableElement = editor.dom.getParent(editor.selection.getNode(), 'table');
  EditorCache.setTableElement(tableElement);
  if (tablePlugin && tableElement) {
    const $tableElement = $(tableElement);
    // Set table specific json
    const json: any = makeTableSpecificJSON(tablePlugin, $tableElement, tableElement);
    // Set common json shared between tables, rows and cells
    setCommonJSON(
      tablePlugin, $tableElement, json,
      tablePlugin.getTableMarginsArray,
      tablePlugin.getBorderForTable,
      tableBorderNames,
      tablePlugin.getBorderStyleForTable);
    SPTinyMCEInterface.signalResponseTableProperties(json);
  }
};
// Determines and emits the signal with the row or cell properties
const requestRowCellProperties = (editor, element, bIsCell) => {
  const tablePlugin = editor.plugins.seapinetable;
  if (tablePlugin && element) {
    const json: any = {};
    let getBorderFn, borderNames, getMarginsFn, getBorderStyleFn, signalFn;
    if (bIsCell) {
      getBorderFn = tablePlugin.getBorderForCell;
      borderNames = cellBorderNames;
      getMarginsFn = tablePlugin.getElementMarginsArray;
      getBorderStyleFn = tablePlugin.getBorderStyleForCell;
      signalFn = SPTinyMCEInterface.signalResponseTableCellProperties;
    } else {
      getBorderFn = tablePlugin.getBorderForRow;
      borderNames = rowBorderNames;
      getMarginsFn = tablePlugin.getRowMarginsArray;
      getBorderStyleFn = tablePlugin.getBorderStyleForRow;
      signalFn = SPTinyMCEInterface.signalResponseTableRowProperties;
    }

    const $ele = $(element);
    setJSONAlignmentBgColor(tablePlugin, $ele, json);
    setCommonJSON(tablePlugin, $ele, json, getMarginsFn, getBorderFn, borderNames, getBorderStyleFn);
    signalFn(json);
  }
};
// Determines and emits the signal with the properties of the selected row
const requestRowProperties = (editor) => {
  const rowElement = editor.dom.getParent(editor.selection.getNode(), 'tr');
  EditorCache.setRowElement(rowElement);
  requestRowCellProperties(editor, rowElement, false);
};
// Determines and emits the signal with the properties of the selected cell
const requestCellProperties = (editor) => requestRowCellProperties(editor, EditorCache.getCellElement(), true);

export {
  fireTableCommand,
  insertOrSaveTable, requestTableProperties,
  requestRowProperties, setRowProperties,
  requestCellProperties, setCellProperties
};