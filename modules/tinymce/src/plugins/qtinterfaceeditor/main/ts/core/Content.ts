/**
 * @file Content.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

// eslint-disable-next-line notice/notice
import { getJQueryBody } from 'shims/sptinymceinterface';
import { QtHostInterface } from 'sp-qt-web-engine-util';

import RangeUtils from 'tinymce/core/api/dom/RangeUtils';

import { EditorCache } from './Cache';

let emitStartDrag: ((html: string, text: string) => void) | undefined;
let emitCopyToClipboard: ((html: string, text: string) => void) | undefined;

// Handler used to prevent native event handling and propagation
const preventNative = (evt) => {
  evt.preventDefault();
  evt.stopPropagation();
};

// ////////////////////////////////////////////////////////////////////////
// Drag and drop interactions
// ////////////////////////////////////////////////////////////////////////

// Initiates a bypassed drag operation, allowing the host application to handle it instead of the browser
const onDragStart = (editor) => {
  EditorCache.setBookmarkDragStart(editor.selection.getBookmark());
  emitStartDrag?.(
    editor.selection.getSelectionWithFormatting(),
    editor.selection.getContent({ format: 'text' })
  );
  return false;
};
// Handles dropped HTML that was originally dragged from this same editor
const handleInternalDrop = (editor, strHTML, posX, posY) => {
  if (strHTML && posX && posY) {
    const bookmark = EditorCache.getBookmarkDragStart();
    if (bookmark) {
      editor.selection.moveToBookmark(bookmark);
      EditorCache.setBookmarkDragStart(null);
    }
    const rng = RangeUtils.getCaretRangeFromPoint(posX, posY, editor.getDoc());
    if (rng) {
      editor.undoManager.transact(() => {
        editor.execCommand('delete');
        editor.selection.setRng(rng);
        editor.execCommand('mceInsertClipboardContent', false, { content: strHTML });
      });
    }
  }
};
// Modifies the TinyMCE editor's body tag to prevent drag events from being handled natively
const bypassDragEvents = (editor) => {
  getJQueryBody().on('dragstart', (evt) => {
    preventNative(evt);
    onDragStart(editor);
  });
};

// ////////////////////////////////////////////////////////////////////////
// Cut/Copy Handling
// ////////////////////////////////////////////////////////////////////////

// Gets the HTML and text content that is currently selected in the editor
const getContent = (editor) => {
  editor.dom.updateCachedStylesOnElements(editor.selection.getSelectedBlocks());
  const html = editor.selection.getSelectionWithFormatting({ keepCachedStyles: true });
  const text = editor.selection.getContent({ format: 'text' });
  return { html, text };
};
// Initiates a bypassed cut operation, allowing the host application to handle it instead of the browser
const onCut = (editor) => {
  const { html, text } = getContent(editor);
  emitCopyToClipboard?.(html, text);
  if (editor.mode.get() !== 'readonly') {
    editor.execCommand('delete');
  }
  return false; // Always returns false, so the cut event is killed
};
// Initiates a bypassed copy operation, allowing the host application to handle it instead of the browser
const onCopy = (editor) => {
  const { html, text } = getContent(editor);
  emitCopyToClipboard?.(html, text);
  return false; // Always returns false, so the copy event is killed
};
// Modifies the TinyMCE editor's body tag to prevent cut/copy events from being handled natively
const bypassCutCopyEvents = (editor) => {
  const $editorBody = getJQueryBody();
  $editorBody.on('cut', (evt) => {
    preventNative(evt);
    onCut(editor);
  });
  $editorBody.on('copy', (evt) => {
    preventNative(evt);
    onCopy(editor);
  });
};

// ////////////////////////////////////////////////////////////////////////
// Insertion util functions
// ////////////////////////////////////////////////////////////////////////

// Uses the paste plugin util trimHTML function to trim the given HTML if possible
const trimHTML = (editor, strHTML) =>
  editor.plugins.paste && editor.plugins.paste.trimHtml ?
    editor.plugins.paste.trimHtml(strHTML) : strHTML;
// Recursively removes comment nodes from the given node and its children
const removeCommentNodes = (node) => {
  const childNodes = Array.from(node.childNodes);
  if (node.nodeType === Node.COMMENT_NODE) {
    $(node).remove();
  }
  childNodes.forEach((child) => removeCommentNodes(child));
};
// Removes comment nodes from the editors content.
const removeCommentsFromContent = () => Array.from(getJQueryBody().contents()).forEach((content) => removeCommentNodes(content));
// Removes 'Apple-converted-space' class that Qt clipboard inserts
const removeAppleSpace = (editor) => {
  const appleSpaceClass = 'Apple-converted-space';
  const $apples = getJQueryBody().contents().find('.' + appleSpaceClass);
  const emptySpan = { selector: 'span', attributes: [ 'style', 'class' ], remove: 'empty', split: true, expand: false, deep: true };
  if ($apples.length) {
    editor.undoManager.transact(() => {
      $apples.removeClass(appleSpaceClass); // Remove the Apple-converted-space class
      Array.from($apples).forEach((apple) => {
        editor.formatter.register(emptySpan);
        editor.formatter.remove('emptyspan', null, apple);
        editor.formatter.unregister('emptyspan');
      });
    });
  }
};
// Removes any margins that are on images. We do not support margins on images.
// I.E. sometimes applies margins (potentially negative ones) to images as part of their style.
const removeImageMargins = () => getJQueryBody().find('img').css('margin', '');
// Inserts the string into the editor as text or HTML
const putContentInEditor = (editor, str, asHTML, bShouldCollapse) => {
  editor.undoManager.transact(() => {
    if (bShouldCollapse) {
      editor.selection.collapse();
    }
    if (asHTML) {
      editor.execCommand('mceInsertClipboardContent', false, { content: trimHTML(editor, str) });
      removeCommentsFromContent();
      removeAppleSpace(editor);
      removeImageMargins();
    } else {
      editor.execCommand('mceInsertClipboardContent', false, { text: str });
    }
  });
};

// ////////////////////////////////////////////////////////////////////////
// Paste/insertion handling
// ////////////////////////////////////////////////////////////////////////

// Pastes content into the editor (doesn't collapse selection)
const pasteStr = (editor, str, asHTML) => putContentInEditor(editor, str, asHTML, false);
// Pastes the provided string as text into the editor
const pasteText = (editor, strText) => pasteStr(editor, strText, false);
// Pastes the provided HTML string into the editor
const pasteHTML = (editor, strHTML) => pasteStr(editor, strHTML, true);

// Inserts content into the editor (collapses selection)
const insertStr = (editor, str, asHTML) => putContentInEditor(editor, str, asHTML, true);
// Inserts the provided string as text into the editor
const insertText = (editor, strText) => insertStr(editor, strText, false);
// Inserts the provided string as HTML into the editor
const insertHTML = (editor, strHTML) => insertStr(editor, strHTML, true);

/**
 * Returns the content related actions.
 */
export const getContentActions = () => {
  return {
    bypassDragEvents,
    handleInternalDrop,
    bypassCutCopyEvents,
    pasteText,
    pasteHTML,
    insertText,
    insertHTML
  };
};

/**
 * Configures the host interface object for the content related actions.
 *
 * @param hostInterface - The host interface
 */
export const configureHostInterfaceForContentActions = (hostInterface: QtHostInterface) => {
  emitStartDrag = hostInterface.registerEventEmitter('StartDrag');
  emitCopyToClipboard = hostInterface.registerEventEmitter('CopyToClipboard');
};
