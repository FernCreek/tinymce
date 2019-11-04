/**
 * @file Commands.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

/**
 * Whether the TinyMCE instance is set to read only.
 * @type {boolean}
 */
let readOnlyState = false;

/**
 * Makes the editor readonly.
 * @param {tinymce.Editor} editor - the editor to make readonly
 * @param {boolean} readOnly - whether to make the editor read only
 */
const makeReadOnly = (editor, readOnly) => {
  const bReadOnly = !!readOnly;
  if (bReadOnly !== readOnlyState) {
    readOnlyState = bReadOnly;
    const body = editor.getBody();
    if (body) {
      body.contentEditable = !bReadOnly;
      $(body).toggleClass('mceReadOnly', bReadOnly);
    }
  }
};

/**
 * Applies or removes the blocking div from the editor.
 * @param {tinymce.Editor} editor - the editor to make readonly
 * @param {boolean} applyDiv - Whether to apply the blocking div. If not
 * specified, the default is false and if there was a blocking div, it is
 * removed.
 */
const applyBlockingDiv = (editor, applyDiv) => {
  if (editor.getBody() && editor.initialized) {
    const blockingDivElements = editor.dom.select('div#' + editor.id + '-blocker', editor.getContainer());
    const hasBlockingDivApplied = ($.isArray(blockingDivElements) && (blockingDivElements.length > 0));

    if (applyDiv) {
      if (!hasBlockingDivApplied) { // Apply if not already there.
        editor.dom.add(editor.getContainer(), 'div', {
          id: editor.id + '-blocker',
          style: 'background: black; position: absolute; left: 0; top: 0; height: 100%; width: 100%; opacity: 0.3'
        });
      }
    } else if (hasBlockingDivApplied) { // Only remove it if the div is there.
      editor.dom.remove(blockingDivElements);
    }
  }
};

/**
 * Registers commands on the editor
 * @param {tinymce.Editor} editor - the editor
 */
const register = function (editor) {
  editor.addCommand('MakeReadOnly', (readonly) => makeReadOnly(editor, readonly));
  editor.addCommand('ApplyBlockingDiv', (applyDiv) => applyBlockingDiv(editor, applyDiv));
  editor.addQueryValueHandler('GetReadOnly', () => readOnlyState);
};

export default {
  register
};