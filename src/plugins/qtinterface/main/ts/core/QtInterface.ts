/**
 * @file QtInterface.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {getJQueryBody, SPTinyMCEInterface, findClosestAnchorNode, findChildAnchorNode} from 'shims/sptinymceinterface';

//////////////////////////////////////////////////////////////////////////
// Editor configuration settings
//////////////////////////////////////////////////////////////////////////

// Whether the editor is in readonly mode
let bReadOnly;
// Palette color settings
let textEditColor: string = '', textReadOnlyColor: string = '';
let windowEditColor: string = '', windowReadOnlyColor: string = '';
// Width setting
let widthSetting = -1;

// Applies the current palette
const applyPalette = () => {
  const [textColor, windowColor] = bReadOnly ? [textReadOnlyColor, windowReadOnlyColor] : [textEditColor, windowEditColor];
  if (textColor && windowColor) {
    const $editorBody = getJQueryBody();
    $editorBody.css('color', textColor);
    $editorBody.css('background-color', windowColor);
  }
};

// Applies the width and overflow to the editor
const applyWidth = (widthStr, overflowStr) => {
  const $editorBody = getJQueryBody();
  $editorBody.css('width', widthStr);
  $editorBody.css('overflow', overflowStr);
};

//////////////////////////////////////////////////////////////////////////
// Editor initial load handlers
//////////////////////////////////////////////////////////////////////////

// Loads the default font settings
const loadDefaultFont = (fontJSON) => {
  const {family, ptSize} = fontJSON;
  const $editorBody = getJQueryBody();
  $editorBody.css('font-family', family);
  $editorBody.css('font-size', `${ptSize}pt`);
};
// Loads the palette settings
const loadPalette = (windowEdit, windowReadOnly, textEdit, textReadOnly) => {
  windowEditColor = textEdit;
  textReadOnlyColor = textReadOnly;
  textEditColor = windowEdit;
  windowReadOnlyColor = windowReadOnly;
  applyPalette();
};

//////////////////////////////////////////////////////////////////////////
// Editor configuration change handlers
//////////////////////////////////////////////////////////////////////////

// Applies readonly mode to the editor
const applyReadOnlyMode = (editor) => {
  editor.setMode('readonly');
  editor.settings.object_resizing = false;
  // In setMode, TinyMCE creates a '_clickBlocker' object, that does exactly what you'd expect for anchor tags.
  // Since in the native client, we still want the user to be able to click hyperlinks, we need to unbind this.
  if (editor._clickBlocker) {
    editor._clickBlocker.unbind();
    editor._clickBlocker = null;
  }
};
// Applies edit mode to the editor
const applyEditMode = (editor) => {
  editor.setMode('design');
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
// Handles setting the editor to be a fixed width
const setFixedWidthEditor = (width) => {
  if (widthSetting !== width) {
    applyWidth(`${width}px`, 'hidden');
    widthSetting = width;
  }
};
// Handles setting the editor to be a variable width again
const clearFixedWidthEditor = () => {
  if (widthSetting !== -1) {
    applyWidth('', '');
    widthSetting = -1;
  }
};

//////////////////////////////////////////////////////////////////////////
// Hyperlink interaction handlers
//////////////////////////////////////////////////////////////////////////

// Callback for when the editor is clicked or double clicked
const activateLink = (target) => {
  const $el = findClosestAnchorNode($(target));
  if ($el) {
    SPTinyMCEInterface.signalResponseOpenHyperlink($el.href);
  }
};

//////////////////////////////////////////////////////////////////////////
// Image interaction handlers
//////////////////////////////////////////////////////////////////////////

// Helper function to escape a regular expression
const escapeRegEg = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
// Reloads a provided image in the editor by cachebustering the image
const reloadImage = (editor, imgSrc) => {
  getJQueryBody().find('img').each((i, img) => {
    const $img = $(img), src = $img.attr('src');
    const idx = src.indexOf(imgSrc);
    if (idx !== -1 && src.substr(idx) === imgSrc) {
      $img.attr('src', `${src}?1`);
      $img.attr('data-mce-src', `${src}?1`);
    }
  });
  editor.execCommand('mceRepaint');
};
// Function that sets up callbacks so a signal is emitted to the interface when an image is successfully loaded
const detectImagesLoaded = (editor) => {
  const waitImgDone = (loadedImg, bWasError) => {
    editor.execCommand('mceRepaint');
    if (!bWasError) {
      SPTinyMCEInterface.signalImageLoadedInBrowser(loadedImg.src);
    }
  };

  getJQueryBody().find('img').each((i, img) => {
    const tmpImg = new Image();
    tmpImg.onload = () => waitImgDone(tmpImg, false);
    tmpImg.onerror = () => waitImgDone(tmpImg, true);
    tmpImg.src = $(img).attr('src');
  });
};

export {
  loadDefaultFont, loadPalette, disableOnDragStart,
  findClosestAnchorNode, findChildAnchorNode, activateLink,
  escapeRegEg, reloadImage, detectImagesLoaded,
  setFixedWidthEditor, clearFixedWidthEditor,
  setReadOnly
};