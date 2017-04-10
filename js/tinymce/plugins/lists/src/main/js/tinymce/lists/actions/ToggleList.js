/**
 * ToggleList.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define("tinymce.lists.actions.ToggleList", [
	"global!tinymce.util.Tools",
	"global!tinymce.dom.BookmarkManager",
	"tinymce.lists.core.Selection",
	"tinymce.lists.core.NodeType",
	"tinymce.lists.core.Bookmark",
	"tinymce.lists.core.SplitList",
	"tinymce.lists.core.NormalizeLists",
	"tinymce.lists.actions.Outdent",
	"tinymce.lists.core.Utils"
], function (Tools, BookmarkManager, Selection, NodeType, Bookmark, SplitList, NormalizeLists, Outdent, Utils) {
	var updateListStyle = function (dom, el, detail) {
		var type = detail['list-style-type'] ? detail['list-style-type'] : null;
		dom.setStyle(el, 'list-style-type', type);
	};

	var setAttribs = function (elm, attrs) {
		Tools.each(attrs, function (value, key) {
			elm.setAttribute(key, value);
		});
	};

	var updateListAttrs = function (dom, el, detail) {
		setAttribs(el, detail['list-attributes']);
		Tools.each(dom.select('li', el), function (li) {
			setAttribs(li, detail['list-item-attributes']);
		});
	};

	var updateListWithDetails = function (dom, el, detail) {
		updateListStyle(dom, el, detail);
		updateListAttrs(dom, el, detail);
	};

	var getEndPointNode = function (editor, rng, start) {
		var container, offset, root = editor.getBody();

		container = rng[start ? 'startContainer' : 'endContainer'];
		offset = rng[start ? 'startOffset' : 'endOffset'];

		// Resolve node index
		if (container.nodeType === 1) {
			container = container.childNodes[Math.min(offset, container.childNodes.length - 1)] || container;
		}

		while (container.parentNode !== root) {
			if (NodeType.isTextBlock(editor, container)) {
				return container;
			}

			if (/^(TD|TH)$/.test(container.parentNode.nodeName)) {
				return container;
			}

			container = container.parentNode;
		}

		return container;
	};

	var getSelectedTextBlocks = function (editor, rng) {
		var textBlocks = [], root = editor.getBody(), dom = editor.dom;

		var startNode = getEndPointNode(editor, rng, true);
		var endNode = getEndPointNode(editor, rng, false);
		var block, siblings = [];

		for (var node = startNode; node; node = node.nextSibling) {
			siblings.push(node);

			if (node === endNode) {
				break;
			}
		}

		Tools.each(siblings, function (node) {
			if (NodeType.isTextBlock(editor, node)) {
				textBlocks.push(node);
				block = null;
				return;
			}

			if (dom.isBlock(node) || NodeType.isBr(node)) {
				if (NodeType.isBr(node)) {
					dom.remove(node);
				}

				block = null;
				return;
			}

			var nextSibling = node.nextSibling;
			if (BookmarkManager.isBookmarkNode(node)) {
				if (NodeType.isTextBlock(editor, nextSibling) || (!nextSibling && node.parentNode === root)) {
					block = null;
					return;
				}
			}

			if (!block) {
				block = dom.create('p');
				node.parentNode.insertBefore(block, node);
				textBlocks.push(block);
			}

			block.appendChild(node);
		});

		return textBlocks;
	};

	var applyList = function (editor, listName, detail) {
		var rng = editor.selection.getRng(true), bookmark, listItemName = 'LI';
		var dom = editor.dom;

		detail = detail ? detail : {};

		if (dom.getContentEditable(editor.selection.getNode()) === "false") {
			return;
		}

		listName = listName.toUpperCase();

		if (listName === 'DL') {
			listItemName = 'DT';
		}

		bookmark = Bookmark.createBookmark(rng);

		Tools.each(getSelectedTextBlocks(editor, rng), function (block) {
			var listBlock, sibling, liStyle;

			var hasCompatibleStyle = function (sib) {
				var sibStyle = dom.getStyle(sib, 'list-style-type');
				var detailStyle = detail ? detail['list-style-type'] : '';

				detailStyle = detailStyle === null ? '' : detailStyle;

				return sibStyle === detailStyle;
			};

			sibling = block.previousSibling;
			if (sibling && NodeType.isListNode(sibling) && sibling.nodeName === listName && hasCompatibleStyle(sibling)) {
				listBlock = sibling;
				block = dom.rename(block, listItemName);

				// If the target li that the current block will be appended to has styles, they need to be captured.
				if (sibling.lastChild && sibling.lastChild.nodeName === 'LI') {
					liStyle = sibling.lastChild.getAttribute('data-mce-style') || sibling.lastChild.getAttribute('style');
				}
				// Now apply any captured styles to the current block to match any li styling on siblings.
				if (liStyle) {
					block.setAttribute('style', liStyle);
				}
				sibling.appendChild(block);
			} else {
				listBlock = dom.create(listName);
				block.parentNode.insertBefore(listBlock, block);
				listBlock.appendChild(block);
				block = dom.rename(block, listItemName);
			}

			updateListWithDetails(dom, listBlock, detail);
			mergeWithAdjacentLists(editor.dom, listBlock);
		});

		editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
	};

	var removeList = function (editor) {
		var lastFoundLiStyle = null;
		var bookmark = Bookmark.createBookmark(editor.selection.getRng(true)), root = editor.getBody();
		var listItems = Selection.getSelectedListItems(editor);
		var emptyListItems = Tools.grep(listItems, function (li) {
			return editor.dom.isEmpty(li);
		});

		listItems = Tools.grep(listItems, function (li) {
			return !editor.dom.isEmpty(li);
		});

		Tools.each(emptyListItems, function (li) {
			if (NodeType.isEmpty(editor.dom, li)) {
				Outdent.outdent(editor, li);
				return;
			}
		});

		Tools.each(listItems, function (li) {
			var node, rootList;

			if (li.parentNode === editor.getBody()) {
				return;
			}

			for (node = li; node && node !== root; node = node.parentNode) {
				if (NodeType.isListNode(node)) {
					rootList = node;
				}
			}

			lastFoundLiStyle = Utils.getLiStyle(li) || lastFoundLiStyle;
			if (NodeType.isFirstChild(li)) {
				Utils.correctLiStyle(lastFoundLiStyle, li);
			}
			SplitList.splitList(editor, rootList, li, null, lastFoundLiStyle);
			NormalizeLists.normalizeLists(editor.dom, rootList.parentNode);
		});

		editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
	};

	var isValidLists = function (list1, list2) {
		return list1 && list2 && NodeType.isListNode(list1) && list1.nodeName === list2.nodeName;
	};

	var hasSameListStyle = function (dom, list1, list2) {
		var targetStyle = dom.getStyle(list1, 'list-style-type', true);
		var style = dom.getStyle(list2, 'list-style-type', true);
		return targetStyle === style;
	};

	var hasSameClasses = function (elm1, elm2) {
		return elm1.className === elm2.className;
	};

	var shouldMerge = function (dom, list1, list2) {
		return isValidLists(list1, list2) && hasSameListStyle(dom, list1, list2) && hasSameClasses(list1, list2);
	};

	var mergeWithAdjacentLists = function (dom, listBlock) {
		var sibling, node, liStyle;

		sibling = listBlock.nextSibling;
		if (shouldMerge(dom, listBlock, sibling)) {
			while ((node = sibling.firstChild)) {
				listBlock.appendChild(node);
				// Attempt to get styles off of any li nodes.
				if (!liStyle && node && node.nodeName === 'LI') {
					liStyle = node.getAttribute('data-mce-style') || node.getAttribute('style');
				}
			}
			// If styles were retrieved set them on all of the li's.
			if (liStyle) {
				Utils.correctLiStyle(liStyle, listBlock);
			}
			dom.remove(sibling);
		}

		sibling = listBlock.previousSibling;
		if (shouldMerge(dom, listBlock, sibling)) {
			while ((node = sibling.lastChild)) {
				listBlock.insertBefore(node, listBlock.firstChild);
			}

			dom.remove(sibling);
		}
	};

	var toggleList = function (editor, listName, detail) {
		var parentList = editor.dom.getParent(editor.selection.getStart(), 'OL,UL,DL');

		detail = detail ? detail : {};

		if (parentList === editor.getBody()) {
			return;
		}

		if (parentList) {
			if (parentList.nodeName === listName) {
				removeList(editor, listName);
			} else {
				var bookmark = Bookmark.createBookmark(editor.selection.getRng(true));
				updateListWithDetails(editor.dom, parentList, detail);
				mergeWithAdjacentLists(editor.dom, editor.dom.rename(parentList, listName));
				editor.selection.setRng(Bookmark.resolveBookmark(bookmark));
			}
		} else {
			applyList(editor, listName, detail);
		}
	};

	return {
		toggleList: toggleList,
		removeList: removeList,
		mergeWithAdjacentLists: mergeWithAdjacentLists
	};
});

