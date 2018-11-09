/**
 * Outdent.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import DOMUtils from 'tinymce/core/api/dom/DOMUtils';
import Bookmark from '../core/Bookmark';
import NodeType from '../core/NodeType';
import NormalizeLists from '../core/NormalizeLists';
import Selection from '../core/Selection';
import SplitList from '../core/SplitList';
import TextBlock from '../core/TextBlock';
import Utils from '../api/Utils';
import { Editor } from 'tinymce/core/api/Editor';
import { HTMLLIElement } from '@ephox/dom-globals';

const DOM = DOMUtils.DOM;

const removeEmptyLi = function (dom: DOMUtils, li: HTMLLIElement) {
  if (NodeType.isEmpty(dom, li)) {
    DOM.remove(li);
  }
};

// Inserts a node after a parent node, setting styles on the child node if any were on an ancestor li.
const insertAfterWithLiStyle = function (node, parentNode) {
  if (parentNode && node) {
    const liStyle = Utils.getLiStyle(parentNode);
    if (liStyle) {
      node.setAttribute('style', liStyle);
    }
    DOM.insertAfter(node, parentNode);
  }
};

// Cleans up the child nodes of a li. Adds styles if needed.
const cleanupChildNodes = function (editor, node: HTMLLIElement) {
  if (node && NodeType.isListNode(node.parentNode) && Utils.hasChildren(node)) {
    const mkArrayRevFromNode = (node: HTMLLIElement) => Array.from(node.children).reverse();
    mkArrayRevFromNode(node).forEach((child) => {
      if (NodeType.isListNode(child) && Utils.hasChildren(child)) {
        const liChild = child as HTMLLIElement;
        mkArrayRevFromNode(liChild).forEach((grandChild) => {
          if (grandChild && grandChild.nodeName === 'LI') {
            insertAfterWithLiStyle(grandChild, node);
          }
        });
        removeEmptyLi(editor.DOM, liChild);
      }
    });
  }
};

const outdent = function (editor: Editor, li: HTMLLIElement) {
  let ul = li.parentNode;
  let ulParent, newBlock;

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
    if (ulParent.nodeName === 'LI') {
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
    if (ulParent.nodeName === 'LI') {
      insertAfterWithLiStyle(li, ulParent);
      li.appendChild(ul);
      removeEmptyLi(editor.dom, ulParent);
    } else if (NodeType.isListNode(ulParent)) {
      ulParent.insertBefore(li, ul);
    } else {
      cleanupChildNodes(editor, li);
      ulParent.insertBefore(TextBlock.createNewTextBlock(editor, li), ul);
      DOM.remove(li);
    }

    return true;
  } else if (NodeType.isLastChild(li)) {
    if (ulParent.nodeName === 'LI') {
      insertAfterWithLiStyle(li, ulParent);
    } else if (NodeType.isListNode(ulParent)) {
      DOM.insertAfter(li, ul);
    } else if (Utils.hasChildren(li)) {
      // If the li has children, then those children should start their own list.
      cleanupChildNodes(editor, li);
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
    cleanupChildNodes(editor, li);
    newBlock = TextBlock.createNewTextBlock(editor, li, 'LI', Utils.getLiStyle(li));
  } else if (NodeType.isListNode(ulParent)) {
    cleanupChildNodes(editor, li);
    newBlock = TextBlock.createNewTextBlock(editor, li, 'LI', Utils.getLiStyle(li));
  } else {
    cleanupChildNodes(editor, li);
    newBlock = TextBlock.createNewTextBlock(editor, li);
  }

  SplitList.splitList(editor, ul, li, newBlock);
  NormalizeLists.normalizeLists(editor.dom, ul.parentNode);

  return true;
};

const outdentSelection = function (editor: Editor) {
  const listElements = Selection.getSelectedListItems(editor);

  if (listElements.length) {
    const bookmark = Bookmark.createBookmark(editor.selection.getRng());
    let i, y;
    const root = Selection.getClosestListRootElm(editor, editor.selection.getStart(true));

    i = listElements.length;
    while (i--) {
      let node = listElements[i].parentNode;

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

export default {
  outdent,
  outdentSelection
};