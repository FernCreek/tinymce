/**
 * @file Plugin.ts
 * Plugin for handing extended custom table logic.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

import PluginManager from 'tinymce/core/api/PluginManager';
import {
  countTableColumns, countTableRows, getNumFromPxString, getTableAlignment,
  getTableBackgroundColor, getTableCellsBackgroundColor, getTableCellsTextAlignment, getTableCellsVerticalTextAlignment
} from './core/Utils';
import {
  getBorderForCell, getBorderForRow, getBorderForTable, getBorderStyleForCell, getBorderStyleForRow,
  getBorderStyleForTable
} from './core/Borders';
import {
  doesCellOverrideMargins, getElementMarginsArray, getRowMarginsArray, getTableMarginsArray,
  isPaddingExplicitlySet
} from './core/Margins';
import {insertOrSaveTable, saveCellProperties, saveRowProperties} from './core/SaveProperties';

PluginManager.add('seapinetable', function (editor) {
  const applyEditorArg = (fn) => (...args) => fn(editor, ...args); // Apply the editor as an argument
  const applyEditorArgToObj = (obj) => Object.keys(obj).reduce((objApp, key) => Object.assign(objApp, ({[key]: applyEditorArg(obj[key])})), {});
  // Util functions
  const util = {
    getNumFromPxString,
    isPaddingExplicitlySet
  };
  // Table information getters
  const tableInfo = {
    countTableRows,
    countTableColumns,
    getTableAlignment,
    getBorderForTable,
    getBorderStyleForTable,
    getTableMarginsArray,
    getTableBackgroundColor
  };
  // Row information getters
  const rowInfo = {
    getBorderForRow,
    getBorderStyleForRow,
    getRowMarginsArray
  };
  // Cell information getters
  const cellInfo = {
    getBorderForCell,
    getBorderStyleForCell,
    getElementMarginsArray,
    doesCellOverrideMargins,
    getTableCellsBackgroundColor,
    getTableCellsTextAlignment,
    getTableCellsVerticalTextAlignment
  };
  // Add commands for saving/applying properties
  const savers = applyEditorArgToObj({
    saveCellProperties,
    saveRowProperties,
    insertOrSaveTable
  });
  return Object.assign({}, util, tableInfo, rowInfo, cellInfo, savers);
});

export default function () { }