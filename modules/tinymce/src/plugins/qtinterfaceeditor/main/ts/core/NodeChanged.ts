/**
 * @file NodeChanged.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

// eslint-disable-next-line notice/notice
import { QtHostInterface } from 'sp-qt-web-engine-util';

import { EditorCache } from './Cache';
import { SupportedFontSizes } from './Constants';

let emitCursorIsBold: ((isBold: boolean) => void) | undefined;
let emitCursorIsItalic: ((isItalic: boolean) => void) | undefined;
let emitCursorIsUnderline: ((isUnderline: boolean) => void) | undefined;
let emitCursorIsStrikethrough: ((isStrikethrough: boolean) => void) | undefined;
let emitCursorDefaultFontFamily: (() => void) | undefined;
let emitCursorFontFamily: ((fontFamily: string | number) => void) | undefined;
let emitCursorDefaultFontSize: (() => void) | undefined;
let emitCursorFontSize: ((fontSize: number) => void) | undefined;
let emitCursorOnImage: ((onImage: boolean) => void) | undefined;
let emitCursorAlignNone: (() => void) | undefined;
let emitCursorAlignMultiple: (() => void) | undefined;
let emitCursorAlignLeft: (() => void) | undefined;
let emitCursorAlignCenter: (() => void) | undefined;
let emitCursorAlignRight: (() => void) | undefined;
let emitCursorAlignJustify: (() => void) | undefined;
let emitCursorInTable: ((inTable: boolean) => void) | undefined;
let emitCursorInMultipleCells: ((inMultipleCells: boolean) => void) | undefined;
let emitCursorInMergedCell: ((inMergedCell: boolean) => void) | undefined;
let emitCursorInSingleCell: ((inSingleCell: boolean) => void) | undefined;
let emitCursorInSingleRow: ((inSingleRow: boolean) => void) | undefined;
let emitCursorInBulletedList: ((inBulletedList: boolean) => void) | undefined;
let emitCursorInNumberedList: ((inNumberedList: boolean) => void) | undefined;
let emitCursorInHyperlink: ((inHyperlink: boolean) => void) | undefined;
let emitUndoAvailable: ((undoAvailable: boolean) => void) | undefined;
let emitRedoAvailable: ((redoAvailable: boolean) => void) | undefined;
let emitCursorHasSelection: ((cursorHasSelection: boolean) => void) | undefined;

// ////////////////////////////////////////////////////////////////////////
// Node changed handler, sends information to qt to update the button enabling
// ////////////////////////////////////////////////////////////////////////

// Handles getting the basic font formats and emitting their signals
const handleFontFormats = (editor) => {
  const querySignal = (cmd, emitFn) => emitFn?.(editor.queryCommandState(cmd));
  querySignal('bold', emitCursorIsBold);
  querySignal('italic', emitCursorIsItalic);
  querySignal('underline', emitCursorIsUnderline);
  querySignal('strikethrough', emitCursorIsStrikethrough);
};

// Handle font family and size
const handleFontFamilyAndSize = (editor, element) => {
  const seapinePlugin = editor.plugins.seapine;
  if (seapinePlugin && seapinePlugin.getFontFamilyAndSize) {
    const familyAndSize = editor.plugins.seapine.getFontFamilyAndSize(element);
    const family = familyAndSize.fontFamily;
    if (family === seapinePlugin.FontValues.DefaultFont) {
      emitCursorDefaultFontFamily?.();
    } else if (family === seapinePlugin.FontValues.MultipleFonts) {
      emitCursorFontFamily?.(0);
    } else {
      emitCursorFontFamily?.(family);
    }

    let size = familyAndSize.fontSize;
    if (size !== seapinePlugin.FontValues.MultipleFonts) {
      SupportedFontSizes.find(({ name, ptvalue }) => {
        const found = size === name || size === ptvalue;
        if (found) {
          size = ptvalue.replace(/pt/, '');
        }
        return found;
      });
    }
    if (size === seapinePlugin.FontValues.DefaultFont) {
      emitCursorDefaultFontSize?.();
    } else if (size === seapinePlugin.FontValues.MultipleFonts) {
      emitCursorFontSize?.(0);
    } else {
      emitCursorFontSize?.(size);
    }
  }
};

// Handles whether the selected node is on an image
const handleImage = (element) => {
  const onImage = element.tagName === 'IMG';
  emitCursorOnImage?.(onImage);
  EditorCache.setImage(onImage ? element : null);
  return onImage;
};

// Interface used to describe an alignment queryy
interface IAlignmentQuery {
  isAligned: () => boolean; // The check for the alignment
  alignment: string; // The alignment value if the query result is true
}

// Performs the given queries to determine the alignment information (the last alignment string and the number matched)
const getAlignments = (queries: IAlignmentQuery[]) => {
  const reducer = ([ lastAlignment, count ], query: IAlignmentQuery) => {
    if (query.isAligned()) {
      lastAlignment = query.alignment;
      ++count;
    }
    return [ lastAlignment, count ];
  };
  return queries.reduce(reducer, [ '', 0 ]);
};

// Gets the alignment information for an image
const getImageAlignments = (element) => {
  const $element = $(element);
  const floatValue = $element.css('float');
  return getAlignments([
    { isAligned: () => floatValue === 'left', alignment: 'left' },
    { isAligned: () => floatValue === 'right', alignment: 'right' },
    { isAligned: () => floatValue === 'none' && $element[0].style['margin-left'] === 'auto' && $element[0].style['margin-right'] === 'auto', alignment: 'center' },
  ]);
};

// Get text alignments
const getTextAlignments = (editor) => {
  return getAlignments([
    { isAligned: () => editor.queryCommandState('justifyleft'), alignment: 'left' },
    { isAligned: () => editor.queryCommandState('justifycenter'), alignment: 'center' },
    { isAligned: () => editor.queryCommandState('justifyright'), alignment: 'right' },
    { isAligned: () => editor.queryCommandState('justifyfull'), alignment: 'justify' },
  ]);
};

// Handles determining and signaling the alignment information
const handleAlignment = (editor, element, imageSelected) => {
  const [ lastAlignment, alignmentCount ] = imageSelected ? getImageAlignments(element) : getTextAlignments(editor);
  if (alignmentCount === 0) {
    emitCursorAlignNone?.();
  } else if (alignmentCount > 1) {
    emitCursorAlignMultiple?.();
  } else {
    switch (lastAlignment) {
      case 'left':
        emitCursorAlignLeft?.();
        break;
      case 'center':
        emitCursorAlignCenter?.();
        break;
      case 'right':
        emitCursorAlignRight?.();
        break;
      case 'justify':
        emitCursorAlignJustify?.();
        break;
      default:
        break;
    }
  }
};

// Handles determining and signaling the table information
const handleTable = (editor, element) => {
  // Insert/Edit Table
  const parent = editor.dom.getParent(element, 'td,th,caption');
  let inTable = (!!editor.dom.getParent(editor.selection.getStart(true), 'table') || !!parent);

  // Disable table tools if we are in caption
  if (parent && parent.nodeName === 'CAPTION') {
    inTable = false;
  }
  emitCursorInTable?.(inTable);
  EditorCache.setCellElement(null);
  const selectedCells = editor.dom.select('td[data-mce-selected],th[data-mce-selected]');
  emitCursorInMultipleCells?.(selectedCells.length > 1);

  let singleCell = false, singleRow = false, mergedCell = false, tableCell;
  if (selectedCells.length === 1) { // One cell selected
    tableCell = selectedCells[0];
    singleCell = true;
    singleRow = true;
    mergedCell = tableCell.rowSpan > 1 || tableCell.colSpan > 1;
    EditorCache.setCellElement(tableCell);
  } else if (selectedCells.length > 1) { // Multiple cells selected
    emitCursorInMergedCell?.(false);
    // Check if the parent row of all of the cells is the same
    const rowNode = selectedCells.shift().parentNode;
    singleRow = selectedCells.every((cell) => rowNode.isSameNode(cell.parentNode));
  }

  // If a single cell isn't selected see if the cursor is within a cell
  if (!singleCell && selectedCells.length === 0) {
    tableCell = element.nodeName === 'TD' ? element : editor.dom.getParent(element, 'td');
    if (tableCell) { // If the cursor is within a cell a single cell, a single row is selected inherently
      singleCell = true;
      singleRow = true;
      mergedCell = tableCell.rowSpan > 1 || tableCell.colSpan > 1;
      EditorCache.setCellElement(tableCell);
    }
  }

  // Fire the signals with the information
  emitCursorInMergedCell?.(mergedCell);
  emitCursorInSingleCell?.(singleCell);
  emitCursorInSingleRow?.(singleRow);
};

// Handles determining and signaling the list and link information
const handleListsAndLinks = (editor, element) => {
  const listNode = editor.dom.getParent(element, 'ul,ol');
  // Bullet (Unordered) List
  emitCursorInBulletedList?.(!!listNode && listNode.nodeName === 'UL');
  // Numbered (Ordered) List
  emitCursorInNumberedList?.(!!listNode && listNode.nodeName === 'OL');
  // In a link
  emitCursorInHyperlink?.(!!editor.dom.getParent(element, 'a'));
};

// Handles determining and signaling undo/redo and selection information
const handleUndoRedoSelection = (editor) => {
  emitUndoAvailable?.(editor.undoManager.hasUndo());
  emitRedoAvailable?.(editor.undoManager.hasRedo());
  emitCursorHasSelection?.(editor.selection.getContent().length > 0);
};

// Callback for when the node changes
export const nodeChanged = (editor, element) => {
  handleFontFormats(editor);
  handleFontFamilyAndSize(editor, element);
  const imageSelected = handleImage(element);
  handleAlignment(editor, element, imageSelected);
  handleTable(editor, element);
  handleListsAndLinks(editor, element);
  handleUndoRedoSelection(editor);
};

/**
 * Configures the host interface object for the nodeChanged related actions.
 *
 * @param hostInterface - The host interface
 */
export const configureHostInterfaceForNodeChanged = (hostInterface: QtHostInterface) => {
  emitCursorIsBold = hostInterface.registerEventEmitter('CursorIsBold');
  emitCursorIsItalic = hostInterface.registerEventEmitter('CursorIsItalic');
  emitCursorIsUnderline = hostInterface.registerEventEmitter('CursorIsUnderline');
  emitCursorIsStrikethrough = hostInterface.registerEventEmitter('CursorIsStrikethrough');
  emitCursorDefaultFontFamily = hostInterface.registerEventEmitter('CursorDefaultFontFamily');
  emitCursorFontFamily = hostInterface.registerEventEmitter('CursorFontFamily');
  emitCursorDefaultFontSize = hostInterface.registerEventEmitter('CursorDefaultFontSize');
  emitCursorFontSize = hostInterface.registerEventEmitter('CursorFontSize');
  emitCursorOnImage = hostInterface.registerEventEmitter('CursorOnImage');
  emitCursorAlignNone = hostInterface.registerEventEmitter('CursorAlignNone');
  emitCursorAlignMultiple = hostInterface.registerEventEmitter('CursorAlignMultiple');
  emitCursorAlignLeft = hostInterface.registerEventEmitter('CursorAlignLeft');
  emitCursorAlignCenter = hostInterface.registerEventEmitter('CursorAlignCenter');
  emitCursorAlignRight = hostInterface.registerEventEmitter('CursorAlignRight');
  emitCursorAlignJustify = hostInterface.registerEventEmitter('CursorAlignJustify');
  emitCursorInTable = hostInterface.registerEventEmitter('CursorInTable');
  emitCursorInMultipleCells = hostInterface.registerEventEmitter('CursorInMultipleCells');
  emitCursorInMergedCell = hostInterface.registerEventEmitter('CursorInMergedCell');
  emitCursorInSingleCell = hostInterface.registerEventEmitter('CursorInSingleCell');
  emitCursorInSingleRow = hostInterface.registerEventEmitter('CursorInSingleRow');
  emitCursorInBulletedList = hostInterface.registerEventEmitter('CursorInBulletedList');
  emitCursorInNumberedList = hostInterface.registerEventEmitter('CursorInNumberedList');
  emitCursorInHyperlink = hostInterface.registerEventEmitter('CursorInHyperlink');
  emitUndoAvailable = hostInterface.registerEventEmitter('UndoAvailable');
  emitRedoAvailable = hostInterface.registerEventEmitter('RedoAvailable');
  emitCursorHasSelection = hostInterface.registerEventEmitter('CursorHasSelection');
};
