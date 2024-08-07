/**
 * @file Plugin.ts
 * Plugin for adding specific commands and formatters.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

// eslint-disable-next-line notice/notice
import { addTooltipsToHyperlinks, removeTooltipsFromHyperlinks } from 'shims/sptinymceinterface';

import PluginManager from 'tinymce/core/api/PluginManager';

import Commands from './api/Commands';
import Formats from './api/Formats';
import CopyCut from './core/CopyCut';
import FontUtils from './core/FontUtils';

export default () => {
  PluginManager.add('seapine', (editor) => {
    Formats.register(editor);
    Commands.register(editor);
    CopyCut.register(editor);
    return {
      // Make font values constants available
      FontValues: FontUtils.FontValues,
      getFontFamilyAndSize: (element) => FontUtils.getFontFamilyAndSize(editor, element),

      // Add Hyperlink actions
      addTooltipsToHyperlinks: () => addTooltipsToHyperlinks(editor),
      removeTooltipsFromHyperlinks: () => removeTooltipsFromHyperlinks(editor)
    };
  });
};
