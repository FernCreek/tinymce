/**
 * @file Image.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {SPTinyMCEInterface} from 'shims/sptinymceinterface';
import {EditorCache} from './Cache';

//////////////////////////////////////////////////////////////////////////
// Image handling
//////////////////////////////////////////////////////////////////////////

// Inserts an image into the editor
const insertImage = (editor, imgSrc) => editor.execCommand('mceInsertContent', false, imgSrc);
// Gets the current image from cache and invokes the given function with it if present
const withCachedImage = (fn) => {
  const cachedImage = EditorCache.getImage();
  if (cachedImage) {
    fn(cachedImage);
  }
};
// Emits a signal containing the information about the currently selected image to edit or resize
const requestEditImage = (bForResize) => {
  withCachedImage((cachedImage) => {
    const json = {
      src: cachedImage.getAttribute('src'),
      width: cachedImage.width,
      height: cachedImage.height
    };
    bForResize ? SPTinyMCEInterface.signalResponseEditImageSize(json) : SPTinyMCEInterface.signalResponseEditImage(json);
  });
};
// Sets the size of the selected image in the editor
const setEditImageSize = (editor, width, height) => {
  withCachedImage((cachedImage) => {
    cachedImage.width = width;
    cachedImage.height = height;
    editor.execCommand('mceRepaint');
    editor.undoManager.add(); // Manually add an undo event for the resize
  });
};
// Changes the selected image in the editor to be the provided new image
const setEditImage = (editor, src, width, height) => {
  withCachedImage((cachedImage) => {
    cachedImage.src = src;
    cachedImage.setAttribute('data-mce-src', src);
    cachedImage.width = width;
    cachedImage.height = height;
    editor.execCommand('mceRepaint');
    editor.undoManager.add(); // Manually add an undo event for the new image
  });
};

export {insertImage, requestEditImage, setEditImageSize, setEditImage};