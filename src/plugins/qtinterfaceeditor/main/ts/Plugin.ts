/**
 * @file Plugin.ts
 * Plugin for interacting with the Qt interface used by native clients when editing.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import PluginManager from 'tinymce/core/api/PluginManager';
import {get} from 'shims/sptinymceinterface';
import {unlink, selectLink, requestOpenLink, requestInsertEditLink, insertLink} from './core/Link';
import {
  insertHorizontalRule, bulletList, numberList, undo, redo, selectAll, deleteSelection,
  editorResized
} from './core/Misc';
import {fireTableCommand, insertOrSaveTable, requestTableProperties, requestRowProperties, setRowProperties, requestCellProperties, setCellProperties} from './core/Table';
import {insertImage, requestEditImage, setEditImage, setEditImageSize} from './core/Image';
import {bypassCutCopyEvents, bypassDragEvents, handleInternalDrop, insertHTML, insertText, pasteHTML, pasteText} from './core/Content';
import {
  clearFormatting,
  decreaseIndent, increaseIndent, loadDefaultFont, setAlign, setFont, setFontColor, setFontFamily, setFontSize,
  setHilightColor,
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleUnderline
} from './core/Format';
import {nodeChanged} from './core/NodeChanged';

PluginManager.add('qtinterfaceeditor', function (editor) {
  // Expose the global SPTinyMCEInterface object after the editor has been initialized
  editor.on('init', () => get());
  const applyEditorArg = (fn) => (...args) => fn(editor, ...args);
  const applyEditorArgToObj = (obj) => Object.keys(obj).reduce((objApp, key) => Object.assign(objApp, ({[key]: applyEditorArg(obj[key])})), {});
  // Link handlers
  const links = applyEditorArgToObj({
    unlink,
    selectLink,
    requestOpenLink,
    requestInsertEditLink,
    insertLink
  });
  // Small misc handlers, not really specific
  const misc = applyEditorArgToObj({
    insertHorizontalRule,
    bulletList,
    numberList,
    undo,
    redo,
    selectAll,
    deleteSelection,
    editorResized,
    nodeChanged
  });
  // Table handlers
  const table = applyEditorArgToObj({
    fireTableCommand,
    insertOrSaveTable,
    requestTableProperties,
    requestRowProperties,
    setRowProperties,
    requestCellProperties,
    setCellProperties
  });
  // Image handlers
  const image = Object.assign(applyEditorArgToObj({
    insertImage, requestEditImage, setEditImage
  }), {setEditImageSize});
  // Content manipulation handlers
  const content =  applyEditorArgToObj({
    bypassDragEvents,
    handleInternalDrop,
    bypassCutCopyEvents,
    pasteText,
    pasteHTML,
    insertText,
    insertHTML
  });
  // Formatting handlers
  const formatting = Object.assign(applyEditorArgToObj({
    toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough,
    decreaseIndent, increaseIndent, clearFormatting,
    setFontColor, setHilightColor , setFont, setFontFamily, setFontSize, setAlign
  }), {loadDefaultFont});
  return Object.assign({}, links, misc, table, image, content, formatting);
});

export default function () { }