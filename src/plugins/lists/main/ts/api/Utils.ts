/**
 * @file Holder for some utility functions to help with styling on lists.
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */
import DOMUtils from 'tinymce/core/api/dom/DOMUtils';
import Tools from 'tinymce/core/api/util/Tools';

const DOM = DOMUtils.DOM;

/**
 * Returns true if the given node has children.
 * @returns {boolean} see desc
 */
const hasChildren = function (node) {
  return node && node.children && node.children.length > 0;
};

/**
 * Corrects the style of the given list and its children. Only used if a li has style applied directly to it
 * @param liStyle - the list item style
 * @param node - the node
 */
const correctLiStyle = function (liStyle, node) {
  if (liStyle && node) {
    if (node.nodeName === 'LI') {
      node.setAttribute('style', liStyle);
    }
    if (hasChildren(node)) {
      Tools.each(node.children, correctLiStyle.bind(null, liStyle));
    }
  }
};

/**
 * Gets styles off of the closest li ancestor with styles, or the current node, if it has styles and is a li.
 * @param node - the node
 * @returns {string} the li style
 */
const getLiStyle = function (node) {
  let currentNode = node, liStyle;
  while (!liStyle && currentNode) {
    if (currentNode.nodeName === 'LI') {
      liStyle = currentNode.getAttribute('data-mce-style') || currentNode.getAttribute('style');
    }
    currentNode = currentNode.parentNode;
  }
  return liStyle;
};

/**
 * Returns true if the given node has the same styles as the style parameter.
 * @param node - the node
 * @param style - the style to check the nodes style against
 * @returns {boolean} if the node has the same style
 */
const nodeHasSameStyle = function (node, style) {
  let hasSameStyle = false;
  if (node && node.nodeName === 'SPAN' && style) {
    const nodeStyle = node.getAttribute('data-mce-style') || node.getAttribute('style');
    hasSameStyle = nodeStyle === style;
  }
  return hasSameStyle;
};

/**
 * Returns true if the only style specified is the list-style-type.
 * @returns {boolean} see desc.
 */
const onlyListStyleType = function (liStyle) {
  const itemTypeStyleRegex = new RegExp(/list-style-type:[^;]+;/gi);
  return liStyle.replace(itemTypeStyleRegex, '') === '';
};

/**
 * Adds a child to a parent, taking into account any styles that may be on the child's old parent li.
 * This should only happen if the HTML got into an odd state and styling ended up on a li.
 * @param newParent - the new parent
 * @param child - the child
 * @param liStyle - the list item style
 */
const addChildWithStyle = function (newParent, child, liStyle) {
  const liStyles = getLiStyle(child) || liStyle;
  if (newParent && child) {
    if (liStyles && !nodeHasSameStyle(child, liStyles) && !onlyListStyleType(liStyles)) {
      const styleSpan = DOM.create('span');
      styleSpan.setAttribute('style', liStyles);
      styleSpan.appendChild(child);
      newParent.appendChild(styleSpan);
    } else {
      newParent.appendChild(child);
    }
  }
};

export default {
  hasChildren,
  correctLiStyle,
  getLiStyle,
  nodeHasSameStyle,
  addChildWithStyle
};