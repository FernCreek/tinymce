/**
 * @file FontUtils.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
/**
 * Constants for font values that aren't a specific value
 * @type {{defaultFont: number; MultipleFonts: number}}
 */
const FontValues = {
  DefaultFont: 0,
  MultipleFonts: 1
};

/**
 * Used to represent font info since it can be a specific string or a FontValue
 */
export type FontInfo = string | number;

/**
 * Interface used to describe a font family and size
 */
export interface IFontFamilyAndSize {
  fontFamily: FontInfo;
  fontSize: FontInfo;
}

/**
 * Interface used to describe the font of children nodes
 */
interface IChildrenFont {
  fontState: FontInfo;
  bDidInherit: boolean;
}

/**
 * Interface used to describe an initial font info guess
 */
interface IInitialFontInfo {
  fontInfo: FontInfo;
  bCameFromElement: boolean;
}

/**
 * Helper function to determine if the given text node only contains whitespace
 * @param {HTMLElement} node The node to check if it is only whitespace
 * @returns {boolean} Whether the node is whitespace
 */
const isTextNodeWS = (node) => !(/[^\t\n\r ]/.test(node.textContent));

/**
 * Given a parent node recursively gets all of the text node children
 * @param {HTMLElement} parent - The node to get the child text nodes from
 * @returns {Array.<HTMLElement>} Array containing the child text nodes of the parent
 */
const getChildTextNodesFromParent = (parent: HTMLElement): HTMLElement[] => {
  let childNodes: HTMLElement[] = [];
  if (parent.childNodes) {
    const reducer = (textNodes: HTMLElement[], child: HTMLElement) => {
      child.nodeType === Node.TEXT_NODE && !isTextNodeWS(child) ?
        textNodes.push(child) : textNodes = textNodes.concat(getChildTextNodesFromParent(child));
      return textNodes;
    };
    childNodes = Array.from(parent.childNodes).reduce(reducer, childNodes);
  }
  return childNodes;
};

/**
 * Whether the element has font family info
 * @param {HTMLElement} element - the element to check for the font family
 * @returns {boolean} see desc
 */
const hasFamilyInfo = (element) => element.style && element.style.fontFamily;
/**
 * Gets the font family info from the element
 * @param {HTMLElement} element - the element to get the font family from
 * @returns {FontInfo} see desc
 */
const getFamilyInfo = (element) => element.style.fontFamily.replace(/["']+/g, '').replace(/, /g, ',').toLowerCase();
/**
 * Whether the element has font size info
 * @param {HTMLElement} element - the element to check for the font size
 * @returns {boolean} see desc
 */
const hasSizeInfo = (element) => element.style && element.style.fontSize;
/**
 * Gets the font size info from the element
 * @param {HTMLElement} element - the element to get the font size from
 * @returns {FontInfo} see desc
 */
const getSizeInfo = (element) => element.style.fontSize;
/**
 * If the element has the info returns the info for the element
 * @param {HTMLElement} element - the element to get the font info from
 * @param {String} defaultInfo - the default to use if the info is not present
 * @param {Function} hasInfoFn - function to check if hte element has the info we're looking for
 * @param {Function} getInfoFn - function that gets the info from the element
 */
const getInfoIfPresent = (element, defaultInfo, hasInfoFn, getInfoFn): FontInfo => {
  return hasInfoFn(element) ? getInfoFn(element) : defaultInfo;
};
type GetInfoIfPresentFn = (element: HTMLElement, defaultInfo: FontInfo) => FontInfo;
const getFamilyInfoIfPresent: GetInfoIfPresentFn =
  (element, defaultInfo) => getInfoIfPresent(element, defaultInfo, hasFamilyInfo, getFamilyInfo);
const getSizeInfoIfPresent: GetInfoIfPresentFn =
  (element, defaultInfo) => getInfoIfPresent(element, defaultInfo, hasSizeInfo, getSizeInfo);

/**
 * Walks up the elements tree looking for a specified piece of font info
 * @param {HTMLElement} maxParent - The max parent to look for a font on
 * @param {HTMLElement} child - The child to determine the effective font for
 * @param hasInfo - function that determines if the parent has the info we're looking for
 * @param getInfo - function that grabs the information off the parent if present
 * @returns {FontInfo} The font info of the child text node, returns empty string if no font is defined
 */
const getTextChildFontInfo = (maxParent, child, hasInfo, getInfo): FontInfo => {
  let found = false, fontInfo: FontInfo = '';
  let parent = child.parentNode;
  while (parent && !found && !$(parent).is(maxParent)) {
    if (hasInfo(parent)) {
      found = true;
      fontInfo = getInfo(parent);
    } else {
      parent = parent.parentNode;
    }
  }
  return fontInfo;
};
type GetTextChildInfoFn = (maxParent: HTMLElement, child: HTMLElement) => FontInfo;
const getTextChildFamilyInfo: GetTextChildInfoFn =
  (maxParent, child) => getTextChildFontInfo(maxParent, child, hasFamilyInfo, getFamilyInfo);
const getTextChildSizeInfo: GetTextChildInfoFn =
  (maxParent, child) => getTextChildFontInfo(maxParent, child, hasSizeInfo, getSizeInfo);

/**
 * Gets the font family or the font size used by a fragment
 * @param {DocumentFragment} fragment - The fragment to analyze
 * @param {boolean} bCanInherit - Whether the children font is allowed to inherit the parent's font
 * @param {GetTextChildInfoFn} getChildInfoFn - The function to use to get the text child info
 * @returns {IChildrenFont} The font used by the fragment
 */
const getChildrenFont = (fragment, bCanInherit, getChildInfoFn: GetTextChildInfoFn): IChildrenFont => {
  let fontState: FontInfo = FontValues.DefaultFont;
  let font: FontInfo = '', bDidInherit = false;
  const textChildren = getChildTextNodesFromParent(fragment);
  if (textChildren.length) {
    font = getChildInfoFn(fragment, textChildren.shift());
    textChildren.find((child) => {
      const tmpFont = getChildInfoFn(fragment, child);
      if (tmpFont !== font) { // Newly found font doesn't match first
        if (!bCanInherit) { // Can't inherit we're at multiple fonts
          fontState = FontValues.MultipleFonts;
        } else if (font === '') { // Current font is inherit, this is specified, grab it
          font = tmpFont;
          bDidInherit = true;
        } else if (tmpFont === '') { // Current font is specified, this is an inherit
          bDidInherit = true;
        } else { // No inherits, just a font mismatch
          fontState = FontValues.MultipleFonts;
        }
      }
      return fontState === FontValues.MultipleFonts;
    });
  }
  if (font !== '' && fontState !== FontValues.MultipleFonts) {
    fontState = font;
  }
  return {fontState, bDidInherit};
};

/**
 * When doing a queryCommandValue on font size or name TinyMCE will return the default's actual font's name or size
 * even when it is not actually set. We need to distinguish if TinyMCE actually found the information or ended up
 * reporting the default.
 * @param {HTMLElement} element - The element to verify the font from
 * @param {GetInfoIfPresentFn} getInfoIfPresentFn - function to get the info from the element if present
 * @param {FontInfo} tinymceGuess - the initial tinymce guess at the font info
 * @returns {FontInfo} the font info that has been adjusted to default if TinyMCE pulled the default
 */
const verifyNotPullingDefault = (element, getInfoIfPresentFn: GetInfoIfPresentFn, tinymceGuess) => {
  let fontInfo = tinymceGuess;
  if (tinymceGuess !== undefined && tinymceGuess !== '' && tinymceGuess !== FontValues.DefaultFont) {
    // TinyMCE reported an actual value make sure it didn't pull the default
    fontInfo = getInfoFromParent(element, getInfoIfPresentFn)  === FontValues.DefaultFont ?
      FontValues.DefaultFont : fontInfo;
  }
  return fontInfo;
};

/**
 * Adjusts the TinyMCE guess if it is needed, there are two times when we need to do this.
 * 1 - There is exactly one child and it has the font specified, we need to respect that
 * 2 - TinyMCE finds no font but then reports the default font for the editor see: verifyNotPullingDefault
 * @param {DocumentFragment} fragment - The selection fragment
 * @param {HTMLElement} element - The element to verify the font from
 * @param {FontInfo} tinymceGuess - the original TinyMCE guess
 * @param bForFamily - whether we're adjusting for a font family or font size
 * @returns {FontInfo} the adjusted font info
 */
const adjustTinyMCEGuessIfNeeded = (fragment, element, tinymceGuess, bForFamily) => {
  let fontInfo: FontInfo = tinymceGuess;
  const hasInfoFn = bForFamily ? hasFamilyInfo : hasSizeInfo;
  // If the selection only has one node make sure we are not using the common ancestor
  if (fragment && fragment.childNodes.length === 1 && hasInfoFn(fragment.childNodes[0])) {
    // If there is only one child node in the fragments use the font off of that instead of the current node.
    fontInfo = bForFamily ? getFamilyInfo(fragment.childNodes[0]) : getSizeInfo(fragment.childNodes[0]);
  } else {
    const getIfPresentFn = bForFamily ? getFamilyInfoIfPresent : getSizeInfoIfPresent;
    fontInfo = verifyNotPullingDefault(element, getIfPresentFn, fontInfo);
  }
  return fontInfo;
};

/**
 * Initial determination of the font family
 * @param {tinymce.Editor} editor - the editor
 * @param {DocumentFragment} fragment - The selection fragment
 * @returns {IInitialFontInfo} the initial font family info
 */
const initialFontFamily = (editor, fragment, element): IInitialFontInfo => {
  // Start with what TinyMCE thinks to be the current font family
  const fontInfo: FontInfo = adjustTinyMCEGuessIfNeeded(fragment, element, editor.queryCommandValue('fontname'), true);
  return {fontInfo, bCameFromElement: false};
};

/**
 * Initial determination of the font size
 * @param {tinymce.Editor} editor - the editor
 * @param {DocumentFragment} fragment - The selection fragment
 * @param {HTMLElement} element - The element to get the initial font size for
 * @returns {IInitialFontInfo} the initial font size info
 */
const initialFontSize = (editor, fragment, element): IInitialFontInfo => {
  // Start with what TinyMCE thinks to be the current font size
  let fontInfo: FontInfo = editor.queryCommandValue('fontsize');
  let bCameFromElement = false;
  // Sometimes after applying styles our selection isn't perfect so queryCommandValue doesn't
  // work as expected. Check to see if this is a <span> and try to get the font size there.
  // http://www.tinymce.com/develop/bugtracker_view.php?id=6017
  // If the TinyMCE bug is ever fixed, we can probably remove this block
  if (element && $(element).is('span') && hasSizeInfo(element)) {
    fontInfo = getSizeInfo(element);
    bCameFromElement = true;
  } else {
    fontInfo = adjustTinyMCEGuessIfNeeded(fragment, element, fontInfo, false);
  }
  return {fontInfo, bCameFromElement};
};

/**
 * Determines the font info for the element from its parents
 * @param {HTMLElement} element - the element to get the font info from
 * @param {GetInfoIfPresentFn} getInfoIfPresentFn - function to get the info from the element if present
 * @returns {FontInfo} the font info
 */
const getInfoFromParent = (element, getInfoIfPresentFn: GetInfoIfPresentFn) => {
  let fontInfo: FontInfo = FontValues.DefaultFont;
  if (element) { // Info not on this node, walk up parent nodes until we get to <body>
    let parent = element;
    while (parent && fontInfo === FontValues.DefaultFont && !$(parent).is('body')) {
      fontInfo = getInfoIfPresentFn(parent, fontInfo);
      parent = parent.parentNode;
    }
  }
  return fontInfo;
};

/**
 * Verifies the font info is consistent with the children, returns FontValues.Multiple fonts if this isn't the case
 * @param {DocumentFragment} fragment - The selection fragment
 * @param {FontInfo} infoToVerify - The info given to verify
 * @param {boolean} bCameFromElement - Whether the info came from the element
 * @param {GetTextChildInfoFn} getChildInfoFn - The function to use to get the childrens font
 * @returns {FontInfo} - The verified font info
 */
const verifyWithChildren = (fragment, infoToVerify, bCameFromElement, getChildInfoFn: GetTextChildInfoFn) => {
  let verifiedInfo = infoToVerify;
  if (fragment && fragment.childNodes && fragment.childNodes.length > 0) {
    const getChildrenFontInfo = (bCanInherit): IChildrenFont => getChildrenFont(fragment, bCanInherit, getChildInfoFn);
    if (infoToVerify === FontValues.DefaultFont || bCameFromElement) {
      // The parent is not specified (default) the children can not mix inherit and specified
      const childrenFont: IChildrenFont = getChildrenFontInfo(false);
      if (childrenFont.fontState !== FontValues.DefaultFont) {
        verifiedInfo = childrenFont.fontState;
      }
    } else {
      // The parent is specified the children can mix inherit and specified as long as the specified is the same
      const childrenFont: IChildrenFont = getChildrenFontInfo(true);
      if (childrenFont.fontState === FontValues.MultipleFonts) {
        // TinyMCE found a font size but the children are not all using it
        verifiedInfo = FontValues.MultipleFonts;
      } else if (childrenFont.fontState !== FontValues.DefaultFont && childrenFont.fontState !== infoToVerify) {
        // Children match a specified font and it disagrees with the parent font
        verifiedInfo = childrenFont.bDidInherit ?  FontValues.MultipleFonts : childrenFont.fontState;
      }
    }
  }
  return verifiedInfo;
};

/**
 * Determines the font family or size
 * @param {IInitialFontInfo} initialInfo - the initial guess information
 * @param fragment - the fragment
 * @param element - the HTML element
 * @param {GetInfoIfPresentFn} getInfoIfPresentFn - function to get the family or size off the element if present
 * @param {GetTextChildInfoFn} getTextChildInfoFn - function to get the text child info
 * @returns {FontInfo} the font family or size info
 */
const getFontInfo = (initialInfo: IInitialFontInfo, fragment, element,
                     getInfoIfPresentFn: GetInfoIfPresentFn,
                     getTextChildInfoFn: GetTextChildInfoFn): FontInfo => {
  let fontInfo: FontInfo = initialInfo.fontInfo;
  if (fontInfo === 0 || fontInfo === undefined || fontInfo === '') { // No info, attempt to grab from parent
    fontInfo = getInfoFromParent(element, getInfoIfPresentFn);
  }
  return verifyWithChildren(fragment, fontInfo, initialInfo.bCameFromElement, getTextChildInfoFn);
};

/**
 * Determines the font family and size information
 * @param {tinymce.Editor} editor - the editor
 * @param {HTMLElement} element - the element to get the family and size information for
 * @returns {IFontFamilyAndSize}
 */
const getFontFamilyAndSize = (editor, element): IFontFamilyAndSize => {
  const fragment = editor.selection.getRng().cloneContents();
  const getInfo = (guess: IInitialFontInfo, getInfoIfPresentFn: GetInfoIfPresentFn, getTextChildInfoFn: GetTextChildInfoFn) =>
    getFontInfo(guess, fragment, element, getInfoIfPresentFn, getTextChildInfoFn);
  const fontFamily = getInfo(initialFontFamily(editor, fragment, element), getFamilyInfoIfPresent, getTextChildFamilyInfo);
  const fontSize = getInfo(initialFontSize(editor, fragment, element), getSizeInfoIfPresent, getTextChildSizeInfo);
  return {fontFamily, fontSize};
};

export default {
  getFontFamilyAndSize,
  FontValues
};
