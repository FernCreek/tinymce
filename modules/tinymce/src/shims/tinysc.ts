/**
 * @file tinysc.ts
 * The shim for TinySC, so that our code knows we have the TinySC global
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
let TinySC;
function get() {
  // @ts-ignore
  TinySC = (window as any).TinySC;
}
export { TinySC, get };