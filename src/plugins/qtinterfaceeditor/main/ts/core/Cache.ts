/**
 * @file Cache.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

//////////////////////////////////////////////////////////////////////////
// Contains various cached elements qt to interact with
//////////////////////////////////////////////////////////////////////////

// The private cache object
const privateCache = {
  TableElement: null,
  RowElement: null,
  CellElement: null,
  Image: null,
  BookmarkDragStart: null,
  EditorHeight: '',
  // TODO_FUTURE Improved font family/size handling
  // These should be changed to properly determine if the font size or family in a span is actually
  // our CSS default so that the family and size menus can be set more accurately.
  QtDefaultFontFamily: '',
  QtDefaultFontSize: 0,
};

// Makes a getter and setter for the given key to manipulate the cache
const mkGetterSetter = (key) => ({[`get${key}`]: () => privateCache[key], [`set${key}`]: (val) => privateCache[key] = val});

// The exposed cache is a an object of setters and getters for the private cache.
const EditorCache: any = Object.keys(privateCache).reduce((exCache, key) => Object.assign(exCache, mkGetterSetter(key)), {});

export {EditorCache};