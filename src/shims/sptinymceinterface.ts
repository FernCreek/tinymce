/**
 * @file sptinymceinterface.ts
 * The shim for SPTinyMCEInterface, so that our code knows we have the SPTinyMCEInterface global
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
let SPTinyMCEInterface; // This is used by our our native qt interfaces
function get() {
  SPTinyMCEInterface = (window as any).SPTinyMCEInterface;
}
const getJQueryBody = () => $('#content_ifr').contents().find('.tinymce-native');
export { SPTinyMCEInterface, get, getJQueryBody };