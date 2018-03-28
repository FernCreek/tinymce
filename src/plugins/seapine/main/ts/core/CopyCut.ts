/**
 * @file CopyCut.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

import DOMUtils from 'tinymce/core/api/dom/DOMUtils';
import Env from 'tinymce/core/api/Env';

// Update cached styles on the selection, this way if the user then pastes into an editor all styles will be pasted
const updateCachedStyles = (editor) => DOMUtils.DOM.updateCachedStylesOnElements(editor.selection.getSelectedBlocks());

// Copy handler
const onCopy = (evt, editor): boolean => {
  let allowDefault = true;
  updateCachedStyles(editor);
  // On WebKit depending on the selection the cached style attribute doesn't get copied to the clipboard
  // Forcibly set the clipboard content so it is always correct
  if (Env.webkit && evt && evt.clipboardData && evt.clipboardData.setData && evt.clipboardData.clearData) {
    evt.preventDefault();
    allowDefault = false;
    evt.clipboardData.clearData();
    evt.clipboardData.setData('text/html', editor.selection.getSelectionWithFormatting({keepCachedStyles: true}));
    evt.clipboardData.setData('text/plain', editor.selection.getContent({format: 'text'}));
  }
  return allowDefault;
};

// Cut handler
const onCut = (evt, editor): boolean => {
  updateCachedStyles(editor);
  return true;
};

// Registers our specific copy cut handling on the editor
const register = function (editor) {
  editor.on('init', () => {
    editor.on('copy', (evt) => onCopy(evt, editor));
    editor.on('cut', (evt) => onCut(evt, editor));
  });
};

export default { register };