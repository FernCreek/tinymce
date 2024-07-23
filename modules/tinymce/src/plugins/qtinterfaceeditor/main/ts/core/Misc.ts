/**
 * @file Misc.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

// Inserts a horizontal rule
const insertHorizontalRule = (editor) => editor.execCommand('InsertHorizontalRule', false, true); // eslint-disable-line notice/notice
// Toggles a bullet list on/off
const bulletList = (editor, bInList) => editor.execCommand('InsertUnorderedList', false, bInList);
// Toggles a numbered list on/off
const numberList = (editor, bInList) => editor.execCommand('InsertOrderedList', false, bInList);
// Tells the editor to undo
const undo = (editor) => editor.execCommand('Undo');
// Tells the editor to redo
const redo = (editor) => editor.execCommand('Redo');
// Tells the editor to select all of its contents
const selectAll = (editor) => editor.execCommand('selectAll');
// Tells the editor to delete the current selection
const deleteSelection = (editor) => editor.execCommand('delete');

export { insertHorizontalRule, bulletList, numberList, undo, redo, selectAll, deleteSelection };
