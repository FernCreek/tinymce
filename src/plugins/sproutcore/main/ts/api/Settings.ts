/**
 * @file Settings.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

const getSCAppNamespace = (editor) => editor.getParam('sproutcore_app_namespace', null);
const getSCDialogOpen = (editor) => editor.getParam('sproutcore_dialog_open', null);
const getSCDialogClose = (editor) => editor.getParam('sproutcore_dialog_close', null);

export default {
  getSCAppNamespace,
  getSCDialogOpen,
  getSCDialogClose
};