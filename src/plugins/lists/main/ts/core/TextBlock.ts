/**
 * TextBlock.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import DOMUtils from 'tinymce/core/api/dom/DOMUtils';
import Env from 'tinymce/core/api/Env';
import NodeType from './NodeType';
import Utils from '../api/Utils';
import { DocumentFragment } from '@ephox/dom-globals';

const DOM = DOMUtils.DOM;

const createNewTextBlock = function (editor, contentNode, blockName?, liStyle?): DocumentFragment {
  let node, textBlock;
  const fragment = DOM.createFragment();
  let hasContentNode;
  const blockElements = editor.schema.getBlockElements();

  if (editor.settings.forced_root_block) {
    blockName = blockName || editor.settings.forced_root_block;
  }

  if (blockName) {
    textBlock = DOM.create(blockName);

    const tagName = textBlock.tagName ? textBlock.tagName.toLowerCase() : textBlock.tagName;
    const forcedRootBlock = editor.settings.forced_root_block ?
      editor.settings.forced_root_block.toLowerCase() : editor.settings.forced_root_block;
    if (tagName === forcedRootBlock) {
      DOM.setAttribs(textBlock, editor.settings.forced_root_block_attrs);
    }

    if (textBlock.nodeName === 'LI' && liStyle) {
      textBlock.setAttribute('stylye', liStyle);
    }

    if (!NodeType.isBlock(contentNode.firstChild, blockElements)) {
      fragment.appendChild(textBlock);
    }
  }

  if (contentNode) {
    while ((node = contentNode.firstChild)) {
      const nodeName = node.nodeName;

      if (!hasContentNode && (nodeName !== 'SPAN' || node.getAttribute('data-mce-type') !== 'bookmark')) {
        hasContentNode = true;
      }

      if (NodeType.isBlock(node, blockElements)) {
        fragment.appendChild(node);
        textBlock = null;
      } else {
        if (blockName) {
          if (!textBlock) {
            textBlock = DOM.create(blockName);
            fragment.appendChild(textBlock);
          }
          Utils.addChildWithStyle(textBlock, node, liStyle);
        } else {
          Utils.addChildWithStyle(fragment, node, liStyle);
        }
      }
    }
  }

  if (!editor.settings.forced_root_block) {
    fragment.appendChild(DOM.create('br'));
  } else {
    // BR is needed in empty blocks on non IE browsers
    if (!hasContentNode && (!Env.ie || Env.ie > 10)) {
      textBlock.appendChild(DOM.create('br', { 'data-mce-bogus': '1' }));
    }
  }

  return fragment;
};

export default {
  createNewTextBlock
};