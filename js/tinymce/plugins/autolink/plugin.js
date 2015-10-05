/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */

tinymce.PluginManager.add('autolink', function(editor) {
	var AutoUrlDetectState,
	AutoLinkPattern = /\b(?:(?:ttstudio|sscm|ftp|http|https|nntp|telnet|file|doors):\/\/|(?:mailto|news):(?!\/)|www[0-9]?(?=\.)|ftp(?=\.))(?:[$_.+!*(),;\/\\?:@&~=-](?=[A-Za-z0-9%])|[A-Za-z0-9%*])(?:[A-Za-z0-9)]|[$_.+!*(,;\/\\?:@&~=-](?!\s|$)|%[A-Fa-f0-9]{2})*(?:#[\/a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;\/\\?:@&~=%-]*)?/i,
	hasProtocol = /^(?:ttstudio|sscm|doors|ftp|http|https|nntp|telnet|file):\/\/|(?:mailto|news):(?!\/)|ftp(?=\.)/i,
	endsWithParen = /\b.*\)[,.!?'":;]?$/;

	if (editor.settings.autolink_pattern) {
		AutoLinkPattern = editor.settings.autolink_pattern;
	}

	editor.on("keydown", function(e) {
		if (e.keyCode == 13) {
			return handleEnter(editor);
		}
	});

	// Internet Explorer has built-in automatic linking for most cases
	if (tinymce.Env.ie) {
		editor.on("focus", function() {
			if (!AutoUrlDetectState) {
				AutoUrlDetectState = true;

				try {
					editor.execCommand('AutoUrlDetect', false, true);
				} catch (ex) {
					// Ignore
				}
			}
		});

		return;
	}

	editor.on("keyup", function(e) {
		if (e.keyCode == 32) {
			return handleSpacebar(editor);
		}
	});

	function handleSpacebar(editor) {
		parseCurrentLine(editor, 0, '', true);
	}

	function handleEnter(editor) {
		parseCurrentLine(editor, -1, '', false);
	}

	function parseCurrentLine(editor, end_offset, delimiter) {
		var rng, end, start, endContainer, bookmark, text, matches, prev, len, rngText, linkText, idx;

		function scopeIndex(container, index) {
			if (index < 0) {
				index = 0;
			}

			if (container.nodeType == 3) {
				var len = container.data.length;

				if (index > len) {
					index = len;
				}
			}

			return index;
		}

		function setStart(container, offset) {
			if (container.nodeType != 1 || container.hasChildNodes()) {
				rng.setStart(container, scopeIndex(container, offset));
			} else {
				rng.setStartBefore(container);
			}
		}

		function setEnd(container, offset) {
			if (container.nodeType != 1 || container.hasChildNodes()) {
				rng.setEnd(container, scopeIndex(container, offset));
			} else {
				rng.setEndAfter(container);
			}
		}

		// Never create a link when we are inside a link
		if (editor.selection.getNode().tagName == 'A') {
			return;
		}

		// We need at least five characters to form a URL,
		// hence, at minimum, five characters from the beginning of the line.
		rng = editor.selection.getRng(true).cloneRange();
		if (rng.startOffset < 5) {
			// During testing, the caret is placed between two text nodes.
			// The previous text node contains the URL.
			prev = rng.endContainer.previousSibling;
			if (!prev) {
				if (!rng.endContainer.firstChild || !rng.endContainer.firstChild.nextSibling) {
					return;
				}

				prev = rng.endContainer.firstChild.nextSibling;
			}

			len = prev.length;
			setStart(prev, len);
			setEnd(prev, len);

			if (rng.endOffset < 5) {
				return;
			}

			end = rng.endOffset;
			endContainer = prev;
		} else {
			endContainer = rng.endContainer;

			// Get a text node
			if (endContainer.nodeType != 3 && endContainer.firstChild) {
				while (endContainer.nodeType != 3 && endContainer.firstChild) {
					endContainer = endContainer.firstChild;
				}

				// Move range to text node
				if (endContainer.nodeType == 3) {
					setStart(endContainer, 0);
					setEnd(endContainer, endContainer.nodeValue.length);
				}
			}

			if (rng.endOffset == 1) {
				end = 2;
			} else {
				end = rng.endOffset - 1 - end_offset;
			}
		}

		start = end;

		do {
			// Move the selection one character backwards.
			setStart(endContainer, end >= 2 ? end - 2 : 0);
			setEnd(endContainer, end >= 1 ? end - 1 : 0);
			end -= 1;
			rngText = rng.toString();

			// Loop until one of the following is found: a blank space, &nbsp;, delimiter, (end-2) >= 0
		} while (rngText != ' ' && rngText !== '' && rngText.charCodeAt(0) != 160 && (end - 2) >= 0 && rngText != delimiter);

		if (rng.toString() == delimiter || rng.toString().charCodeAt(0) == 160) {
			setStart(endContainer, end);
			setEnd(endContainer, start);
			end += 1;
		} else if (rng.startOffset === 0) {
			setStart(endContainer, 0);
			setEnd(endContainer, start);
		} else {
			setStart(endContainer, end);
			setEnd(endContainer, start);
		}

		text = rng.toString();
		matches = text.match(AutoLinkPattern);

		if (matches) {
			// there is a URL in the text
			linkText = matches[0];

			// check if our link ends with a closing parenthesis, in which case remove unless there is an opening one in the
			// link, this makes for a nicer user experience
			if (endsWithParen.test(linkText)) {
				// handle paren being both the last & second last character to match our native implementation
				if (linkText.charAt(linkText.length - 2) === ')') {
					if (linkText.indexOf('(') !== -1) {
						linkText = linkText.substr(0, linkText.length - 1);
					} else {
						linkText = linkText.substr(0, linkText.length - 2);
					}
				} else if (text.charAt(text.length - 1 === ')')) {
					if (linkText.indexOf('(') === -1) {
						linkText = linkText.substr(0, linkText.length - 1);
					}
				}
			}

			if (linkText.length !== text.length) {
				// not all of our text is a valid link, modify the range to only include the link text
				idx = text.indexOf(linkText);

				if (idx > 0) {
					setStart(endContainer, idx);
					text = rng.toString();
				}

				if (linkText.length !== text.length) {
					setEnd(endContainer, linkText.length + rng.startOffset);
				}
			}

			// if there isn't a protocol then assume http
			if (!hasProtocol.test(linkText)) {
				linkText = 'http://' + linkText;
			}

			bookmark = editor.selection.getBookmark();

			editor.selection.setRng(rng);
			editor.execCommand('createlink', false, linkText);

			if (editor.settings.default_link_target) {
				editor.dom.setAttrib(editor.selection.getNode(), 'target', editor.settings.default_link_target);
			}

			editor.selection.moveToBookmark(bookmark);
			editor.nodeChanged();
		}
	}
});
