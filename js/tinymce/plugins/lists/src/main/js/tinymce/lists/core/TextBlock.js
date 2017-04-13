/**
 * TextBlock.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

define("tinymce.lists.core.TextBlock", [
	"global!tinymce.dom.DOMUtils.DOM",
	"global!tinymce.Env",
	"tinymce.lists.core.Utils"
], function (DOM, Env, Utils) {
	var createNewTextBlock = function (editor, contentNode, blockName, liStyle) {
		var node, textBlock, fragment = DOM.createFragment(), hasContentNode, tagName, forcedRootBlock;
		var blockElements = editor.schema.getBlockElements();

		if (editor.settings.forced_root_block) {
			blockName = blockName || editor.settings.forced_root_block;
		}

		if (blockName) {
			textBlock = DOM.create(blockName);

			tagName = textBlock.tagName ? textBlock.tagName.toLowerCase() : textBlock.tagName;
			forcedRootBlock = editor.settings.forced_root_block ?
				editor.settings.forced_root_block.toLowerCase() : editor.settings.forced_root_block;
			if (tagName === forcedRootBlock) {
				DOM.setAttribs(textBlock, editor.settings.forced_root_block_attrs);
			}

			// If the text block to generate is a li, and styles were passed in, add the styles to the text block
			if (textBlock.nodeName === 'LI' && liStyle) {
				textBlock.setAttribute('style', liStyle);
			}

			fragment.appendChild(textBlock);
		}

		if (contentNode) {
			while ((node = contentNode.firstChild)) {
				var nodeName = node.nodeName;

				if (!hasContentNode && (nodeName !== 'SPAN' || node.getAttribute('data-mce-type') !== 'bookmark')) {
					hasContentNode = true;
				}

				if (blockElements[nodeName]) {
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
				textBlock.appendChild(DOM.create('br', {'data-mce-bogus': '1'}));
			}
		}

		return fragment;
	};

	return {
		createNewTextBlock: createNewTextBlock
	};
});
