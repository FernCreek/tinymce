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
  // @ts-ignore
  SPTinyMCEInterface = (window as any).SPTinyMCEInterface;
}
// Common function used by the qtinterface and qtinterface editor
const getJQueryBody = () => $('#content_ifr').contents().find('.tinymce-native');

//////////////////////////////////////////////////////////////////////////
// Common link handlers used by qtinterface and qtinterface editor
//////////////////////////////////////////////////////////////////////////

// Finds the closest parent anchor node of the element, which could be the element itself.
const findClosestAnchorNode = ($el) => {
  const q = $el.closest('a');
  return q && q.length ? q[0] : null;
};
// Finds an anchor node that is a child of the element.
const findChildAnchorNode = ($el) => {
  const childAnchors = $el.find('a');
  return childAnchors && childAnchors.length ? childAnchors[0] : null;
};

export { SPTinyMCEInterface, get, getJQueryBody, findClosestAnchorNode, findChildAnchorNode };
