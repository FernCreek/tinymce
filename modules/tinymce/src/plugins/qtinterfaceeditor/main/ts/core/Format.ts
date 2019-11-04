/**
 * @file Format.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {EditorCache} from './Cache';

//////////////////////////////////////////////////////////////////////////
// Formatting interactions
//////////////////////////////////////////////////////////////////////////

// Toggles bold on the editor
const toggleBold = (editor, bBold) => editor.execCommand('bold', bBold);
// Toggles italic on the editor
const toggleItalic = (editor, bItalic) => editor.execCommand('italic', bItalic);
// Toggles underline on the editor
const toggleUnderline = (editor, bULine) => editor.execCommand('underline', bULine);
// Toggles strikethough on the editor
const toggleStrikethrough = (editor, bStrike) => editor.execCommand('strikethrough', bStrike);
// Sets the current alignment on the editor
const setAlign = (editor, alignment) => {
  editor.undoManager.transact(() => {
    // Clear out any alignments that have been set with justify none command
    editor.execCommand('justifynone');
    editor.formatter.apply('align' + alignment);
  });
};
// Decreases the current indent level
const decreaseIndent = (editor) => editor.execCommand('outdent');
// Increases the current indent level
const increaseIndent = (editor) => editor.execCommand('indent');
// Clears the formatting of the current selection
const clearFormatting = (editor) => {
  editor.undoManager.transact(() => {
    editor.execCommand('RemoveFormat');
    editor.execCommand('justifynone');
  });
};
// Removes the given format from the current selection
const removeFormat = (editor, format) => {
  editor.undoManager.transact(function () {
    editor.focus();
    editor.formatter.remove(format, {value: null}, null, true);
    editor.nodeChanged();
  });
};
// Applies the given color format to the current selection
const applyFormat = (editor, format, value) => {
  editor.undoManager.transact(function () {
    editor.focus();
    editor.formatter.remove(format, {value: null}, null, true);
    editor.formatter.apply(format, {value});
    editor.nodeChanged();
  });
};

//////////////////////////////////////////////////////////////////////////
// Font formatting (color, family, size)
//////////////////////////////////////////////////////////////////////////

// Function to set either the font or background color
const setColor = (editor, color, bForFont) => {
  const styleColorStr = bForFont ? 'forecolor' : 'hilitecolor';
  color === '' ? removeFormat(editor, styleColorStr) : applyFormat(editor, styleColorStr, color);
};
// Sets the font color to the given font color
const setFontColor = (editor, color) => setColor(editor, color, true);
// Sets the hilite color to the given color
const setHilightColor = (editor, color) => setColor(editor, color, false);
// Applies the font family
const applyFontFamily = (editor, family) => {
  editor.formatter.remove('removefontname', {value: null}, null, true);
  if (family) {
    editor.execCommand('FontName', false, family);
  }
};
// Sets the font family (application wrapped in an undo)
const setFontFamily = (editor, family) => editor.undoManager.transact(() => applyFontFamily(editor, family));
// Applies the font size
const applyFontSize = (editor, size) => {
  editor.formatter.remove('removefontsize', {value: null}, null, true);
  if (size) {
    editor.execCommand('FontSize', false, `${size}pt`);
  }
};
// Sets the font size (applicaiton wrapped in an undo)
const setFontSize = (editor, size) => editor.undoManager.transact(() => applyFontSize(editor, size));
// Loads the default font settings (QtInterface plugin sets them on the jquery body)
const loadDefaultFont = (fontJSON) => {
  EditorCache.setQtDefaultFontFamily(fontJSON.family);
  EditorCache.setQtDefaultFontSize(fontJSON.ptSize);
};
// Sets the font
const setFont = (editor, fontJSON) => {
  const queryAndSet = (cmd, value) => {
    if (editor.queryCommandState(cmd) !== value) {
      editor.execCommand(cmd, value);
    }
  };
  editor.undoManager.transact(() => {
    applyFontFamily(editor, fontJSON.family);
    applyFontSize(editor, fontJSON.ptSize);
    queryAndSet('bold', fontJSON.bold);
    queryAndSet('italic', fontJSON.italic);
    queryAndSet('underline', fontJSON.underline);
    queryAndSet('strikethrough', fontJSON.strikethrough);
  });
};

export {
  toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough,
  decreaseIndent, increaseIndent, clearFormatting,
  setFontColor, setHilightColor , setFont, setFontFamily, setFontSize, setAlign,
  loadDefaultFont
};