/**
 * @file Plugin.ts
 * The Sproutcore plugin which creates our custom window manager and handles opening dialogs.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import PluginManager from 'tinymce/core/api/PluginManager';
import WindowManager from './core/WindowManager';
import Commands from './api/Commands';
import {get} from 'shims/tinysc';

PluginManager.add('sproutcore', function (editor) {
  // Expose the global TinySC object after the editor has been initialized
  editor.on('init', () => get());
  // Create the Sproutcore window manager
  WindowManager.createWindowManager();
  // Register the Sproutcore plugin commands
  Commands.register(editor);
  // Expose open and close dialog methods
  return { openDialog: Commands.openDialog, closeDialog: Commands.closeDialog };
});

export default function () { }