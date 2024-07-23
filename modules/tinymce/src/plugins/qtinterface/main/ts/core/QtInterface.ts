/**
 * @file QtInterface.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import { getJQueryBody, findClosestAnchorNode, findChildAnchorNode } from 'shims/sptinymceinterface';

// The margin on the body element of the iframe. Should match WysiwygUtils::kBodyMargin
const BodyMargin = '8px';

// Utility function to apply css to the editor body
const applyCSS = (cssPairs) => {
  const $editorBody = getJQueryBody();
  cssPairs.forEach(([ key, value ]) => $editorBody.css(key, value));
};

// Editor configuration settings

// Whether the editor is in readonly mode
let bReadOnly;
// Palette color settings
let textEditColor = '', textReadOnlyColor = '';
let windowEditColor = '', windowReadOnlyColor = '';

// Applies the current palette
const applyPalette = () => {
  const [ textColor, windowColor ] = bReadOnly ? [ textReadOnlyColor, windowReadOnlyColor ] : [ textEditColor, windowEditColor ];
  if (textColor && windowColor) {
    applyCSS([
      [ 'color', textColor ],
      [ 'background-color', windowColor ]
    ]);
    document.body.style.backgroundColor = windowColor;
  }
};

// Editor initial load handlers

// Loads the default font settings
const loadDefaultFont = (fontJSON) => {
  const { family, ptSize } = fontJSON;
  applyCSS([
    [ 'font-family', family ],
    [ 'font-size', `${ptSize}pt` ]
  ]);
};
// Loads the palette settings
const loadPalette = (windowEdit, windowReadOnly, textEdit, textReadOnly) => {
  windowEditColor = windowEdit;
  textReadOnlyColor = textReadOnly;
  textEditColor = textEdit;
  windowReadOnlyColor = windowReadOnly;
  applyPalette();
  applyCSS([[ 'margin', BodyMargin ]]);
};

// Editor configuration change handlers

// Applies readonly mode to the editor
const applyReadOnlyMode = (editor) => {
  editor.mode.set('readonly');
  editor.settings.object_resizing = false;
};
// Applies edit mode to the editor
const applyEditMode = (editor) => {
  editor.mode.set('design');
  editor.settings.object_resizing = true;
};
// Sets the editor to be readonly or edit mode
const setReadOnly = (editor, readOnly) => {
  if (readOnly !== bReadOnly) {
    bReadOnly = readOnly;
    bReadOnly ? applyReadOnlyMode(editor) : applyEditMode(editor);
    applyPalette();
  }
};
// Prevent drag events from being handled natively
const disableOnDragStart = () => getJQueryBody().attr('ondragstart', 'return false;');

// Helper function to escape a regular expression
const escapeRegEg = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
// Applies the given fn to each image found in the editor
const forEachImage = (fn) => getJQueryBody().find('img').each(fn);
// Reloads a provided image in the editor by cachebustering the image
const reloadImage = (editor, imgSrc) => {
  forEachImage((i, img) => {
    const $img = $(img), src = $img.attr('src');
    const idx = src.indexOf(imgSrc);
    if (idx !== -1 && src.substr(idx) === imgSrc) {
      $img.attr('src', `${src}?1`);
      $img.attr('data-mce-src', `${src}?1`);
    }
  });
  editor.execCommand('mceRepaint');
};

export {
  loadDefaultFont, loadPalette, disableOnDragStart,
  findClosestAnchorNode, findChildAnchorNode,
  escapeRegEg, reloadImage,
  setReadOnly
};
