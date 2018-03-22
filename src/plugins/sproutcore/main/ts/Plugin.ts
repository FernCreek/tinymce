/**
 * @file Plugin.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

import PluginManager from 'tinymce/core/api/PluginManager';
import WindowManager from './core/WindowManager';
import Commands from './api/Commands';

PluginManager.add('sproutcore', function (editor) {
  // Create the Sproutcore window manager
  WindowManager.createWindowManager();
  // Register the Sproutcore plugin commands
  Commands.register(editor);
  // Expose open and close dialog methods
  return { openDialog: Commands.openDialog, closeDialog: Commands.closeDialog };
});

export default function () { }