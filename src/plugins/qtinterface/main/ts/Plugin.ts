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
import {
  activateLink, clearFixedWidthEditor, detectImagesLoaded,
  disableOnDragStart, escapeRegEg, findChildAnchorNode, findClosestAnchorNode, loadDefaultFont,
  loadPalette, reloadImage, setFixedWidthEditor, setReadOnly
} from './core/QtInterface';

PluginManager.add('qtinterface', function (editor) {
  // Expose the global SPTinyMCEInterface object after the editor has been initialized
  editor.on('init', () => get());
  // Apply the editor as an argument to the functions that need it
  const applyReadOnly = (readOnly) => setReadOnly(editor, readOnly);
  const detectImages = () => detectImagesLoaded(editor);
  return {
    loadDefaultFont,
    loadPalette,
    disableOnDragStart,
    findClosestAnchorNode,
    findChildAnchorNode,
    activateLink,
    escapeRegEg,
    reloadImage,
    detectImagesLoaded: detectImages,
    setFixedWidthEditor,
    clearFixedWidthEditor,
    setReadOnly: applyReadOnly
  };
});

export default function () { }