/**
 * @file sptinymceinterface.ts
 * The shim for SPTinyMCEInterface, so that our code knows we have the SPTinyMCEInterface global
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

// Common Hyperlink util functions

/**
 * Returns if the hyperlink url is a field code. This is primarily used to detect hyperlinks added for the matrix report.
 *
 * @param url - The url to check
 * @returns See description
 */
export const isFieldCodeHyperlink = (url: string) => url.indexOf('%') === 0;

/**
 * Returns the tooltip to use for the provided hyperlink
 *
 * @param url - The hyperlink url
 * @returns See description
 */
export const buildHyperlinkTooltip = (url: string) => `${url}\nDouble-click to open the link`;

/**
 * Adds tooltips to hyperlinks.
 *
 * @param editor - The editor
 */
export const addTooltipsToHyperlinks = (editor) => { // eslint-disable-line notice/notice
  const body = editor.getBody();
  if (body) {
    $(body).find('a').attr('title', function () {
      let title = '';
      // Get the raw href value before it was resolved by the browser so we can correctly identify field code hyperlinks
      const rawHref = this.getAttribute('data-mce-href');
      if (rawHref && !isFieldCodeHyperlink(rawHref)) {
        title = buildHyperlinkTooltip(this.href);
      }
      return title;
    });
  }
};

/**
 * Removes tooltips from hyperlinks
 *
 * @param editor - The editor
 */
export const removeTooltipsFromHyperlinks = (editor) => {
  const body = editor.getBody();
  if (body) {
    $(body).find('a').removeAttr('title');
  }
};

// Common function used by the qtinterface and qtinterface editor
const getJQueryBody = () => $('#content_ifr').contents().find('.tinymce-native');

// ////////////////////////////////////////////////////////////////////////
// Common link handlers used by qtinterface and qtinterface editor
// ////////////////////////////////////////////////////////////////////////

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

export { getJQueryBody, findClosestAnchorNode, findChildAnchorNode };
