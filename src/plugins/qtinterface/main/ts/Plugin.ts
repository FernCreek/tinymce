/**
 * @file Plugin.ts
 * Plugin for interacting with the Qt interface used by native clients.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import PluginManager from 'tinymce/core/api/PluginManager';
import {get} from 'shims/sptinymceinterface';
import * as QtInterface from './core/QtInterface';

PluginManager.add('qtinterface', function (editor) {
  // Expose the global SPTinyMCEInterface object after the editor has been initialized
  editor.on('init', () => get());
  const applyEditorArg = (fn) => (...args) => fn(editor, ...args); // Apply the editor as an argument
  // These methods need to have the editor object applied
  const editorFns = {
    detectImagesLoaded: applyEditorArg(QtInterface.detectImagesLoaded),
    setReadOnly: applyEditorArg(QtInterface.setReadOnly),
    reloadImage: applyEditorArg(QtInterface.reloadImage)
  };
  return Object.assign({}, QtInterface, editorFns);
});

export default function () { }