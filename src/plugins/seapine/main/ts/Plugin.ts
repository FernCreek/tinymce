/**
 * @file Plugin.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

import PluginManager from 'tinymce/core/api/PluginManager';
import Formats from './api/Formats';
import Commands from './api/Commands';
import FontUtils from './core/FontUtils';

PluginManager.add('seapine', function (editor) {
  Formats.register(editor);
  Commands.register(editor);
  // Make font values constants available
  return {FontValues: FontUtils.FontValues};
});

export default function () { }
