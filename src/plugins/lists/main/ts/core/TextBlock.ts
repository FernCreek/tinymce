/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import Env from 'tinymce/core/api/Env';
import NodeType from './NodeType';
import Utils from '../api/Utils';
import { DocumentFragment, Node } from '@ephox/dom-globals';
import { Editor } from 'tinymce/core/api/Editor';

const createTextBlock = (editor: Editor, contentNode: Node, blockName?, liStyle?): DocumentFragment => {
  const dom = editor.dom;
  const blockElements = editor.schema.getBlockElements();
  const fragment = dom.createFragment();
  let node, textBlock, hasContentNode;

  if (editor.settings.forced_root_block) {
    blockName = blockName || editor.settings.forced_root_block;
  }

  if (blockName) {
    textBlock = dom.create(blockName);

    const tagName = textBlock.tagName ? textBlock.tagName.toLowerCase() : textBlock.tagName;
    const forcedRootBlock = editor.settings.forced_root_block ?
      editor.settings.forced_root_block.toLowerCase() : editor.settings.forced_root_block;
    if (tagName === forcedRootBlock) {
      dom.setAttribs(textBlock, editor.settings.forced_root_block_attrs);
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
            textBlock = dom.create(blockName);
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
    fragment.appendChild(dom.create('br'));
  } else {
    // BR is needed in empty blocks on non IE browsers
    if (!hasContentNode && (!Env.ie || Env.ie > 10)) {
      textBlock.appendChild(dom.create('br', { 'data-mce-bogus': '1' }));
    }
  }

  return fragment;
};

export {
  createTextBlock
};