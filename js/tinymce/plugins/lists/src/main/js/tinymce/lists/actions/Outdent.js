/**
 * Outdent.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define("tinymce.lists.actions.Outdent", [
	"global!tinymce.dom.DOMUtils.DOM",
	"tinymce.lists.core.NodeType",
	"tinymce.lists.core.Bookmark",
	"tinymce.lists.core.Selection",
	"tinymce.lists.core.SplitList",
	"tinymce.lists.core.NormalizeLists",
	"tinymce.lists.core.TextBlock",
	"tinymce.lists.core.Utils"
], function (DOM, NodeType, Bookmark, Selection, SplitList, NormalizeLists, TextBlock, Utils) {
	var removeEmptyLi = function (dom, li) {
		if (NodeType.isEmpty(dom, li)) {
			DOM.remove(li);
		}
	};

	// Inserts a node after a parent node, setting styles on the child node if any were on an ancestor li.
	var insertAfterWithLiStyle = function (node, parentNode) {
		var liStyle;
		if (parentNode && node) {
			liStyle = Utils.getLiStyle(parentNode);
			if (liStyle) {
				node.setAttribute('style', liStyle);
			}
			DOM.insertAfter(node, parentNode);
		}
	};

	// Cleans up the child nodes of a li. Adds styles if needed.
	var cleanupChildNodes = function (node) {
		var child, grandchild, i, j;
		if (node && NodeType.isListNode(node.parentNode) && Utils.hasChildren(node)) {
			for (i = node.children.length - 1; i >= 0; i--) {
				child = node.children[i];
				if (NodeType.isListNode(child) && Utils.hasChildren(child)) {
					for (j = child.children.length - 1; j >= 0; j--) {
						grandchild = child.children[j];
						if (grandchild && grandchild.nodeName === 'LI') {
							insertAfterWithLiStyle(grandchild, node);
						}
					}
					removeEmptyLi(DOM, child);
				}
			}
		}
	};

	var outdent = function (editor, li) {
		var ul = li.parentNode, ulParent, newBlock;

		if (ul) {
			ulParent = ul.parentNode;
		} else {
			removeEmptyLi(editor.dom, li);
			return true;
		}

		if (ul === editor.getBody()) {
			return true;
		}

		if (li.nodeName === 'DD') {
			DOM.rename(li, 'DT');
			return true;
		}

		if (NodeType.isFirstChild(li) && NodeType.isLastChild(li)) {
			if (ulParent.nodeName === "LI") {
				insertAfterWithLiStyle(li, ulParent);
				removeEmptyLi(editor.dom, ulParent);
				DOM.remove(ul);
			} else if (NodeType.isListNode(ulParent)) {
				DOM.remove(ul, true);
			} else {
				Utils.correctLiStyle(Utils.getLiStyle(li), li);
				ulParent.insertBefore(TextBlock.createNewTextBlock(editor, li), ul);
				DOM.remove(ul);
			}

			return true;
		} else if (NodeType.isFirstChild(li)) {
			if (ulParent.nodeName === "LI") {
				insertAfterWithLiStyle(li, ulParent);
				li.appendChild(ul);
				removeEmptyLi(editor.dom, ulParent);
			} else if (NodeType.isListNode(ulParent)) {
				ulParent.insertBefore(li, ul);
			} else {
				cleanupChildNodes(li);
				ulParent.insertBefore(TextBlock.createNewTextBlock(editor, li), ul);
				DOM.remove(li);
			}

			return true;
		} else if (NodeType.isLastChild(li)) {
			if (ulParent.nodeName === "LI") {
				insertAfterWithLiStyle(li, ulParent);
			} else if (NodeType.isListNode(ulParent)) {
				DOM.insertAfter(li, ul);
			} else if (Utils.hasChildren(li)) {
				// If the li has children, then those children should start their own list.
				cleanupChildNodes(li);
				newBlock = TextBlock.createNewTextBlock(editor, li);
				SplitList.splitList(editor, ul, li, newBlock);
				NormalizeLists.normalizeLists(editor.dom, ul.parentNode);
			} else {
				DOM.insertAfter(TextBlock.createNewTextBlock(editor, li), ul);
				DOM.remove(li);
			}

			return true;
		}

		if (ulParent.nodeName === 'LI') {
			ul = ulParent;
			cleanupChildNodes(li);
			newBlock = TextBlock.createNewTextBlock(editor, li, 'LI', Utils.getLiStyle(li));
		} else if (NodeType.isListNode(ulParent)) {
			cleanupChildNodes(li);
			newBlock = TextBlock.createNewTextBlock(editor, li, 'LI', Utils.getLiStyle(li));
		} else {
			cleanupChildNodes(li);
			newBlock = TextBlock.createNewTextBlock(editor, li);
		}

		SplitList.splitList(editor, ul, li, newBlock);
		NormalizeLists.normalizeLists(editor.dom, ul.parentNode);

		return true;
	};

	var outdentSelection = function (editor) {
		var listElements = Selection.getSelectedListItems(editor);

		if (listElements.length) {
			var bookmark = Bookmark.createBookmark(editor.selection.getRng(true));
			var i, y, root = editor.getBody();

			i = listElements.length;
			while (i--) {
				var node = listElements[i].parentNode;

				while (node && node !== root) {
					y = listElements.length;
					while (y--) {
						if (listElements[y] === node) {
							listElements.splice(i, 1);
							break;
						}
					}

					node = node.parentNode;
				}
			}

			for (i = 0; i < listElements.length; i++) {
				if (!outdent(editor, listElements[i]) && i === 0) {
					break;
				}
			}

			editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
			editor.nodeChanged();

			return true;
		}
	};

	return {
		outdent: outdent,
		outdentSelection: outdentSelection
	};
});

