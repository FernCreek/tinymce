/**
 * @file NodeChanged.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {SPTinyMCEInterface} from 'shims/sptinymceinterface';
import {SupportedFontSizes} from './Constants';
import {EditorCache} from './Cache';
import {editorResized} from './Misc';

//////////////////////////////////////////////////////////////////////////
// Node changed handler, sends information to qt to update the button enabling
//////////////////////////////////////////////////////////////////////////

// Handles getting the basic font formats and emitting their signals
const handleFontFormats = (editor) => {
  const querySignal = (cmd, signal) => signal(editor.queryCommandState(cmd));
  querySignal('bold', SPTinyMCEInterface.signalCursorIsBold);
  querySignal('italic', SPTinyMCEInterface.signalCursorIsItalic);
  querySignal('underline', SPTinyMCEInterface.signalCursorIsUnderline);
  querySignal('strikethrough', SPTinyMCEInterface.signalCursorIsStrikethrough);
};

// Handle font family and size
const handleFontFamilyAndSize = (editor, element) => {
  const seapinePlugin = editor.plugins.seapine;
  if (seapinePlugin && seapinePlugin.getFontFamilyAndSize) {
    const familyAndSize = editor.plugins.seapine.getFontFamilyAndSize(element);
    const family = familyAndSize.fontFamily;
    if (family === seapinePlugin.FontValues.DefaultFont) {
      SPTinyMCEInterface.signalCursorDefaultFontFamily();
    } else if (family === seapinePlugin.FontValues.MultipleFonts) {
      SPTinyMCEInterface.signalCursorFontFamily(0);
    } else {
      SPTinyMCEInterface.signalCursorFontFamily(family);
    }

    let size = familyAndSize.fontSize;
    if (size !== seapinePlugin.FontValues.MultipleFonts) {
      SupportedFontSizes.find(({name, ptvalue}) => {
        const found = size === name || size === ptvalue;
        if (found) {
          size = ptvalue.replace(/pt/, '');
        }
        return found;
      });
    }
    if (size === seapinePlugin.FontValues.DefaultFont) {
      SPTinyMCEInterface.signalCursorDefaultFontSize();
    } else if (size === seapinePlugin.FontValues.MultipleFonts) {
      SPTinyMCEInterface.signalCursorFontSize(0);
    } else {
      SPTinyMCEInterface.signalCursorFontSize(size);
    }
  }
};

// Handles whether the selected node is on an image
const handleImage = (element) => {
  const onImage = element.tagName === 'IMG';
  SPTinyMCEInterface.signalCursorOnImage(onImage);
  EditorCache.setImage(onImage ? element : null);
  return onImage;
};

// Interface used to describe an alignment queryy
interface IAlignmentQuery  {
  isAligned: () => boolean; // The check for the alignment
  alignment: string; // The alignment value if the query result is true
}

// Performs the given queries to determine the alignment information (the last alignment string and the number matched)
const getAlignments = (queries: IAlignmentQuery[]) => {
  const reducer = ([lastAlignment, count], query: IAlignmentQuery) => {
    if (query.isAligned()) {
      lastAlignment = query.alignment;
      ++count;
    }
    return [lastAlignment, count];
  };
  return queries.reduce(reducer, ['', 0]);
};

// Gets the alignment information for an image
const getImageAlignments = (element) => {
  const $element = $(element);
  const floatValue = $element.css('float');
  return getAlignments([
    { isAligned: () => floatValue === 'left', alignment: 'left'},
    { isAligned: () => floatValue === 'right', alignment: 'right'},
    { isAligned: () =>
        floatValue === 'none' && $element[0].style['margin-left'] === 'auto' && $element[0].style['margin-right'] === 'auto',
      alignment: 'center'},
  ]);
};

// Get text alignments
const getTextAlignments = (editor) => {
  return getAlignments([
    { isAligned: () => editor.queryCommandState('justifyleft'), alignment: 'left'},
    { isAligned: () => editor.queryCommandState('justifycenter'), alignment: 'center'},
    { isAligned: () => editor.queryCommandState('justifyright'), alignment: 'right'},
    { isAligned: () => editor.queryCommandState('justifyfull'), alignment: 'justify'},
  ]);
};

// Handles determining and signaling the alignment information
const handleAlignment = (editor, element, imageSelected) => {
  const [lastAlignment, alignmentCount] = imageSelected ? getImageAlignments(element) : getTextAlignments(editor);
  if (alignmentCount === 0) {
    SPTinyMCEInterface.signalCursorAlignNone();
  } else if (alignmentCount > 1) {
    SPTinyMCEInterface.signalCursorAlignMultiple();
  } else {
    switch (lastAlignment) {
      case 'left':
        SPTinyMCEInterface.signalCursorAlignLeft();
        break;
      case 'center':
        SPTinyMCEInterface.signalCursorAlignCenter();
        break;
      case 'right':
        SPTinyMCEInterface.signalCursorAlignRight();
        break;
      case 'justify':
        SPTinyMCEInterface.signalCursorAlignJustify();
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
  let inTable = (editor.dom.getParent(editor.selection.getStart(true), 'table') || !!parent);

  // Disable table tools if we are in caption
  if (parent && parent.nodeName === 'CAPTION') {
    inTable = false;
  }
  SPTinyMCEInterface.signalCursorInTable(inTable);
  EditorCache.setCellElement(null);
  const selectedCells = editor.dom.select('td[data-mce-selected],th[data-mce-selected]');
  SPTinyMCEInterface.signalCursorInMultipleCells(selectedCells.length > 1);

  let singleCell = false, singleRow = false, mergedCell = false, tableCell;
  if (selectedCells.length === 1) { // One cell selected
    tableCell = selectedCells[0];
    singleCell = true;
    singleRow = true;
    mergedCell = tableCell.rowSpan > 1 || tableCell.colSpan > 1;
    EditorCache.setCellElement(tableCell);
  } else if (selectedCells.length > 1) { // Multiple cells selected
    SPTinyMCEInterface.signalCursorInMergedCell(false);
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
  SPTinyMCEInterface.signalCursorInMergedCell(mergedCell);
  SPTinyMCEInterface.signalCursorInSingleCell(singleCell);
  SPTinyMCEInterface.signalCursorInSingleRow(singleRow);
};

// Handles determining and signaling the list and link information
const handleListsAndLinks = (editor, element) => {
  const listNode = editor.dom.getParent(element, 'ul,ol');
  // Bullet (Unordered) List
  SPTinyMCEInterface.signalCursorInBulletedList(!!listNode && listNode.nodeName === 'UL');
  // Numbered (Ordered) List
  SPTinyMCEInterface.signalCursorInNumberedList(!!listNode && listNode.nodeName === 'OL');
  // In a link
  SPTinyMCEInterface.signalCursorInHyperlink(!!editor.dom.getParent(element, 'a'));
};

// Handles determining and signaling undo/redo and selection information
const handleUndoRedoSelection = (editor) => {
  SPTinyMCEInterface.signalUndoAvailable(editor.undoManager.hasUndo());
  SPTinyMCEInterface.signalRedoAvailable(editor.undoManager.hasRedo());
  SPTinyMCEInterface.signalCursorHasSelection(editor.selection.getContent().length > 0);
};

// Callback for when the node changes
const nodeChanged = (editor, element) => {
 if (SPTinyMCEInterface) {
   handleFontFormats(editor);
   handleFontFamilyAndSize(editor, element);
   const imageSelected = handleImage(element);
   handleAlignment(editor, element, imageSelected);
   handleTable(editor, element);
   handleListsAndLinks(editor, element);
   editorResized(editor);
   handleUndoRedoSelection(editor);
 }
};

export {nodeChanged};