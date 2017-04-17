/**
 * Utils.js
 * Holder for some utility functions to help with styling on lists.
 *
 * Copyright 2017, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */
define("tinymce.lists.core.Utils", [
	"global!tinymce.util.Tools",
	"global!tinymce.dom.DOMUtils.DOM"
], function (Tools, DOM) {

	/**
	 * Returns true if the given node has children.
	 */
	var hasChildren = function (node) {
		return node && node.children && node.children.length > 0;
	};

	/**
	 * Corrects the style of the given list and its children. Only used if a li has style applied directly to it
	 */
	var correctLiStyle = function (liStyle, node) {
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
	 */
	var getLiStyle = function (node) {
		var currentNode = node, liStyle = null;
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
	 */
	var nodeHasSameStyle = function (node, style) {
		var nodeStyle, hasSameStyle = false;
		if (node && node.nodeName === 'SPAN' && style) {
			nodeStyle = node.getAttribute('data-mce-style') || node.getAttribute('style');
			hasSameStyle = nodeStyle === style;
		}
		return hasSameStyle;
	};

	/**
	 * Returns true if the only style specified is the list-style-type.
	 */
	var onlyListStyleType = function (liStyle) {
		var itemTypeStyleRegex = new RegExp(/list-style-type:[^;]+;/gi);
		return liStyle.replace(itemTypeStyleRegex, '') === '';
	};

	/**
	 * Adds a child to a parent, taking into account any styles that may be on the child's old parent li.
	 * This should only happen if the HTML got into an odd state and styling ended up on a li.
	 */
	var addChildWithStyle = function (newParent, child, liStyle) {
		var liStyles = getLiStyle(child) || liStyle, styleSpan;
		if (newParent && child) {
			if (liStyles && !nodeHasSameStyle(child, liStyles) && !onlyListStyleType(liStyles)) {
				styleSpan = DOM.create('span');
				styleSpan.setAttribute('style', liStyles);
				styleSpan.appendChild(child);
				newParent.appendChild(styleSpan);
			} else {
				newParent.appendChild(child);
			}
		}
	};

	return {
		hasChildren: hasChildren,
		correctLiStyle: correctLiStyle,
		getLiStyle: getLiStyle,
		nodeHasSameStyle: nodeHasSameStyle,
		addChildWithStyle: addChildWithStyle
	};
});
