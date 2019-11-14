/**
 * @file WindowManager.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {TinySC} from 'shims/tinysc';
import DialogSetup from './DialogSetup';
import Tools from 'tinymce/core/api/util/Tools';
import WindowManager from 'tinymce/core/api/WindowManager';

/**
 * Creates the Sproutcore window manager
 */
const createWindowManager = () => {
  Tools.create('tinymce.SproutCoreWindowManager:tinymce.WindowManager', {
    /**
     * Constructs a new window manager instance.
     * @param {tinymce.Editor} editor - Editor instance that the windows are bound to.
     * @constructor
     */
    SproutCoreWindowManager(editor) {
      this.editor = editor;
      WindowManager.call(this, editor);
      // Override the open command so we can replace the default dialogs with SproutCore based dialogs.
      this.open = this.openOverride;
    },
    /**
     * Override for opening particular dialogs
     * @param {any} openArgs - arguments to use when opening the dialog
     */
    openOverride(openArgs) {
      if (openArgs && openArgs.title) {
        const title = openArgs.title;
        let viewClass;

        switch (title) {
          case 'Table Properties': // Insert Table
            viewClass = this.setupTablePropertiesDialog(openArgs.onsubmit);
            break;
          case 'Cell Properties': // Cell Properties
            viewClass = this.setupCellPropertiesDialog();
            break;
          case 'Row Properties': // Row Properties
            viewClass = this.setupRowPropertiesDialog();
            break;
          case 'Source Code': // HTML editor, used in debug
            viewClass = this.setupSourceEditorDialog();
            break;
          case 'Merge Cells':
          default:
            break; // no-op
        }
        if (viewClass) {
          // We implemented this window, its been setup, now open it.
          this.openDialog(viewClass, TinySC.Utils.getOwnerView(this.editor), openArgs);
        }
      }
    },

    // Add the dialog setup methods to the window manager so they can be called easily externally
    setupTablePropertiesDialog(submit) { return DialogSetup.setupTablePropertiesDialog(this.editor, submit); },
    setupCellPropertiesDialog() { return DialogSetup.setupCellPropertiesDialog(this.editor); },
    setupRowPropertiesDialog() { return DialogSetup.setupRowPropertiesDialog(this.editor); },
    setupImagePropertiesDialog() { return DialogSetup.setupImagePropertiesDialog(this.editor, TinySC.Utils.getOwnerView(this.editor)); },
    setupLinkPropertiesDialog() { return DialogSetup.setupLinkPropertiesDialog(this.editor); },
    setupColorPicker() { return DialogSetup.setupColorPicker(); },
    setupSourceEditorDialog() { return DialogSetup.setupSourceEditorDialog(); },

    /**
     * Creates the view from the class and makes call to opens the given dialog
     * @param viewClass - the SC view class to create the view from
     * @param owner - the owner of the dialog
     * @param args - the args to use when creating the dialog view
     */
    openDialog(viewClass, owner, args) {
      if (viewClass && !!viewClass.create && this.editor.plugins.sproutcore) {
        const view = viewClass.create(Object.assign({owner}, args));
        this.editor.plugins.sproutcore.openDialog(this.editor, view);
      }
    }
  }, undefined);
};

export default {
  createWindowManager
};
