/**
 * @file Plugin.ts
 * Plugin for handing extended custom table logic.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

import PluginManager from 'tinymce/core/api/PluginManager';
import * as Utils from './core/Utils';
import * as Borders from './core/Borders';
import * as Margins from './core/Margins';
import * as Savers from './core/SaveProperties';

PluginManager.add('seapinetable', function (editor) {
  const applyEditorArg = (fn) => (...args) => fn(editor, ...args); // Apply the editor as an argument
  const applyEditorArgToObj = (obj) => Object.keys(obj).reduce((objApp, key) => Object.assign(objApp, ({[key]: applyEditorArg(obj[key])})), {});
  // Add commands for saving/applying properties
  const savers = applyEditorArgToObj(Savers);
  return Object.assign({}, Utils, Borders, Margins, savers);
});

export default function () { }