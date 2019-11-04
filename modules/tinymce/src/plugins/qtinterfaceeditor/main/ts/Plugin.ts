/**
 * @file Plugin.ts
 * Plugin for interacting with the Qt interface used by native clients when editing.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import PluginManager from 'tinymce/core/api/PluginManager';
import {get} from 'shims/sptinymceinterface';
import * as Links from './core/Link';
import * as Misc from './core/Misc';
import * as Table from './core/Table';
import * as Image from './core/Image';
import * as Content from './core/Content';
import * as Formatting from './core/Format';
import {nodeChanged} from './core/NodeChanged';

PluginManager.add('qtinterfaceeditor', function (editor) {
  // Expose the global SPTinyMCEInterface object after the editor has been initialized
  editor.on('init', () => get());
  const applyEditorArg = (fn) => (...args) => fn(editor, ...args);
  const applyEditorArgToObj = (obj) => Object.keys(obj).reduce((objApp, key) => Object.assign(objApp, ({[key]: applyEditorArg(obj[key])})), {});
  // Link handlers
  const links = applyEditorArgToObj(Links);
  // Small misc handlers, not really specific
  const misc = applyEditorArgToObj(Object.assign({}, Misc, {nodeChanged}));
  // Table handlers
  const table = applyEditorArgToObj(Table);
  // Image handlers
  const image = Object.assign({}, applyEditorArgToObj(Image), {requestEditImage: Image.requestEditImage});
  // Content manipulation handlers
  const content =  applyEditorArgToObj(Content);
  // Formatting handlers
  const formatting = Object.assign({}, applyEditorArgToObj(Formatting), {loadDefaultFont: Formatting.loadDefaultFont});
  return Object.assign({}, links, misc, table, image, content, formatting);
});

export default function () { }