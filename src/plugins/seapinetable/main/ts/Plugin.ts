/**
 * @file Plugin.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

import PluginManager from 'tinymce/core/api/PluginManager';
import {get} from 'shims/tinysc';
import {
  countTableColumns, countTableRows, getNumFromPxString, getTableAlignment,
  getTableBackgroundColor, getTableCellsBackgroundColor, getTableCellsTextAlignment, getTableCellsVerticalTextAlignment
} from './api/Utils';
import {
  getBorderForCell, getBorderForRow, getBorderForTable, getBorderStyleForCell, getBorderStyleForRow,
  getBorderStyleForTable
} from './api/Borders';
import {
  doesCellOverrideMargins, getElementMarginsArray, getRowMarginsArray, getTableMarginsArray,
  isPaddingExplicitlySet
} from './api/Margins';
import {insertOrSaveTable, saveCellProperties, saveRowProperties} from './api/SaveProperties';
import {IAlignment, ICellBorders, ICellMargins, IRowBorders, ITableBorders} from './api/Interfaces';

PluginManager.add('seapinetable', function (editor) {

  // Apply the editor as an argumentto the save commands
  const saveCell =
    (node, cellBorders: ICellBorders, cellMargins: ICellMargins, alignment: IAlignment, bgColor) =>
      saveCellProperties(editor, node, cellBorders, cellMargins, alignment, bgColor);
  const saveRow =
    (node, rowBorders: IRowBorders, cellMargins: ICellMargins, alignment: IAlignment, bgColor) =>
      saveRowProperties(editor, node, rowBorders, cellMargins, alignment, bgColor);
  const saveTable =
    (node, rows, columns, width, tableBorders: ITableBorders, alignment, cellSpacing, cellMargins: ICellMargins, bgColor) =>
      insertOrSaveTable(editor, node, rows, columns, width, tableBorders, alignment, cellSpacing, cellMargins, bgColor);

  // Expose the global TinySC object after the editor has been initialized
  editor.on('init', () => get());
  // Expose the available methods for outside usage
  return {
    // Util functions
    getNumFromPxString,
    isPaddingExplicitlySet,
    // Table information getters
    countTableRows,
    countTableColumns,
    getTableAlignment,
    getBorderForTable,
    getBorderStyleForTable,
    getTableMarginsArray,
    getTableBackgroundColor,
    // Row information getters
    getBorderForRow,
    getBorderStyleForRow,
    getRowMarginsArray,
    // Cell information getters
    getBorderForCell,
    getBorderStyleForCell,
    getElementMarginsArray,
    doesCellOverrideMargins,
    getTableCellsBackgroundColor,
    getTableCellsTextAlignment,
    getTableCellsVerticalTextAlignment,
    // Add commands for application
    saveCellProperties: saveCell,
    saveRowProperties: saveRow,
    insertOrSaveTable: saveTable
  };
});

export default function () { }