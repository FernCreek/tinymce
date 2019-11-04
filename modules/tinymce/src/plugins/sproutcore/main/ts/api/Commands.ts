/**
 * @file Commands.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

import {TinySC} from 'shims/tinysc';
import Settings from './Settings';
import Tools from 'tinymce/core/api/util/Tools';

/**
 * Helper function to test if the value is a string
 * @param val - the value to test
 */
const isString = (val) => Tools.is(val, 'string');

/**
 * Opens a dialog according to the app specified method. Falls back to doing view.append.
 * @param {tinymce.Editor} editor - the editor
 * @param view - the dialog instance
 */
const openDialog = (editor, view) => openCloseDialog(editor, view, Settings.getSCDialogOpen(editor), true);
/**
 * Closes a dialog according to the app specified method. Falls back to doing view.remove.
 * @param {tinymce.Editor} editor - the editor
 * @param view - the dialog instance
 */
const closeDialog = (editor, view) => openCloseDialog(editor, view, Settings.getSCDialogClose(editor), false);
/**
 * Opens or closes the given dialog view
 * @param {tinymce.Editor} editor - the editor
 * @param view - the dialog view
 * @param openCloseSetting - the open or close setting
 * @param bOpen - whether we're opening or closing a dialog
 */
const openCloseDialog = (editor, view, openCloseSetting, bOpen) => {
  let app, dialogFn;
  const appNameSpace = Settings.getSCAppNamespace(editor);
  const fallbackFn = bOpen ? view.append.bind(view) : view.remove.bind(view);
  if (isString(appNameSpace)) {
    app = window[appNameSpace];
  }
  if (app && isString(openCloseSetting)) {
    dialogFn = app[openCloseSetting];
  }
  TinySC.ngFocusChange(editor, bOpen);
  editor.settings.scDialogActive = bOpen;
  editor.execCommand('scHideContextToolbars');
  app && dialogFn ? dialogFn.call(app, view) : fallbackFn();
};

/**
 * Opens the expanded editor
 * @param {tinymce.Editor} editor - the editor
 */
const openExpandedEditor = (editor) => {
  const owner = TinySC.Utils.getOwnerView(editor);
  if (owner && !owner.get('isExpanded')) {
    const expandedView = TinySC.ExpandedEditorPane.create({owner});
    if (expandedView) {
      openDialog(editor, expandedView);
      expandedView.load();
    }
  }
};

/**
 * Create and opens the dialog for the given view class
 * @param {tinymce.Editor} editor - the editor
 * @param viewClass - the view class of the dialog to create and open
 */
const createAndOpenDialog = (editor, viewClass) => {
  const owner = TinySC.Utils.getOwnerView(editor);
  if (owner && !!viewClass.create) {
    const view = viewClass.create({owner});
    if (view) {
      openDialog(editor, view);
    }
  }
};
/**
 * Opens the insert/edit link dialog
 * @param {tinymce.Editor} editor - the editor
 */
const openLinkDialog = (editor) => {
  const viewClass = editor.windowManager.setupLinkPropertiesDialog();
  createAndOpenDialog(editor, viewClass);
};

/**
 * Opens the insert image dialog
 * @param {tinymce.Editor} editor - the editor
 */
const openInsertImageDialog = (editor) => {
  editor.windowManager.setupImagePropertiesDialog();
  TinySC.displayNgInsertImageDialog(editor);
};

/**
 * Opens the edit image dialog
 * @param {tinymce.Editor} editor - the editor
 */
const openEditImageDialog = (editor) => {
  editor.windowManager.setupImagePropertiesDialog();
  TinySC.displayNgEditImageDialog(editor);
};

/**
 * Opens the edit image size dialog
 * @param {tinymce.Editor} editor - the editor
 */
const openEditImageSizeDialog = (editor) => {
  editor.windowManager.setupImagePropertiesDialog();
  TinySC.displayNgEditImageSizeDialog(editor);
};

/**
 * Add paste post processing
 * @param {tinymce.Editor} editor - the editor
 * @param evt - the paste event
 */
const pastePostProcess = (editor, evt) => {
  const view = TinySC.Utils.getOwnerView(editor);
  if (view && !!view.onPaste) {
    view.onPaste(editor, evt.node);
  }
};

/**
 * Stores the current selection
 * @param {tinymce.Editor} editor - the editor
 */
const storeSelection = (editor) => {
  if (editor.selection && !editor.settings.bookmark) { // Only store the selection if we don't already have one
    editor.settings.bookmark = editor.selection.getBookmark(2);
  }
};
/**
 * Restores the previously saved selection
 * @param {tinymce.Editor} editor - the editor
 */
const restoreSelection = (editor) => {
  if (editor.settings.bookmark) {
    editor.selection.moveToBookmark(editor.settings.bookmark);
  }
  editor.settings.bookmark = null; // After we restore the selection, remove the bookmark
};

/**
 * Registers the sproutcore plugin commands on the editor
 * @param {tinymce.Editor} editor - the editor
 */
const register = function (editor) {
  editor.addCommand('scOpenExpandedEditor', () => openExpandedEditor(editor));
  editor.addCommand('mceLink', () => openLinkDialog(editor));
  editor.addCommand('mceImage', () => openInsertImageDialog(editor));
  editor.addCommand('mceEditImage', () => openEditImageDialog(editor));
  editor.addCommand('mceEditImageSize', () => openEditImageSizeDialog(editor));
  editor.addButton('expanded_editor', {
    title: 'sproutcore.expanded_editor_desc',
    cmd: 'scOpenExpandedEditor',
    ui: true
  });
  editor.on('PastePostProcess', (evt) => pastePostProcess(editor, evt));
  editor.addCommand('storeSelection', () => storeSelection(editor));
  editor.addCommand('restoreSelection', () => restoreSelection(editor));
};

export default {
  register,
  openDialog,
  closeDialog
};
