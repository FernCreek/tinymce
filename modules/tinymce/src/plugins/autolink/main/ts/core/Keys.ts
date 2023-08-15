/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import Editor from 'tinymce/core/api/Editor';
import Env from 'tinymce/core/api/Env';

import * as Settings from '../api/Settings';

const rangeEqualsDelimiterOrSpace = function (rangeString, delimiter) {
  return rangeString === delimiter || rangeString === ' ' || rangeString.charCodeAt(0) === 160;
};

const isTextNode = (node: Node): node is Text =>
  node.nodeType === 3;

const isElement = (node: Node): node is Element =>
  node.nodeType === 1;

const handleBracket = (editor: Editor): void =>
  parseCurrentLine(editor, -1);

const handleSpacebar = (editor: Editor): void =>
  parseCurrentLine(editor, 0);

const handleEnter = (editor: Editor): void =>
  parseCurrentLine(editor, -1);

const scopeIndex = (container: Node, index: number): number => {
  if (index < 0) {
    index = 0;
  }

  if (isTextNode(container)) {
    const len = container.data.length;

    if (index > len) {
      index = len;
    }
  }

  return index;
};

const setStart = (rng: Range, container: Node, offset: number): void => {
  if (!isElement(container) || container.hasChildNodes()) {
    rng.setStart(container, scopeIndex(container, offset));
  } else {
    rng.setStartBefore(container);
  }
};

const setEnd = (rng: Range, container: Node, offset: number): void => {
  if (!isElement(container) || container.hasChildNodes()) {
    rng.setEnd(container, scopeIndex(container, offset));
  } else {
    rng.setEndAfter(container);
  }
};

const addProtocolIfNeeded = function (link) {
  // If there isn't a protocol and the url isn't a field code, assume http
  return !Settings.hasProtocolPattern().test(link) && (link.indexOf('%') !== 0) ? 'http://' + link : link;
};

const parseCurrentLine = function (editor, endOffset, delimiter) {
  let end, endContainer, bookmark, text, prev, len, rngText;
  const defaultLinkTarget = Settings.getDefaultLinkTarget(editor);

  // Never create a link when we are inside a link
  if (editor.dom.getParent(editor.selection.getNode(), 'a[href]') !== null) {
    return;
  }

  // We need at least five characters to form a URL,
  // hence, at minimum, five characters from the beginning of the line.
  const rng = editor.selection.getRng().cloneRange();
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
    setStart(rng, prev, len);
    setEnd(rng, prev, len);

    if (rng.endOffset < 5) {
      return;
    }

    end = rng.endOffset;
    endContainer = prev;
  } else {
    endContainer = rng.endContainer;

    // Get a text node
    if (!isTextNode(endContainer) && endContainer.firstChild) {
      while (!isTextNode(endContainer) && endContainer.firstChild) {
        endContainer = endContainer.firstChild;
      }

      // Move range to text node
      if (isTextNode(endContainer)) {
        setStart(rng, endContainer, 0);
        setEnd(rng, endContainer, endContainer.nodeValue.length);
      }
    }

    if (rng.endOffset === 1) {
      end = 2;
    } else {
      end = rng.endOffset - 1 - endOffset;
    }
  }

  let start = end;

  do {
    // Move the selection one character backwards.
    setStart(rng, endContainer, end >= 2 ? end - 2 : 0);
    setEnd(rng, endContainer, end >= 1 ? end - 1 : 0);
    end -= 1;
    rngText = rng.toString();

    // Loop until one of the following is found: a blank space, &nbsp;, delimiter, (end-2) >= 0
  } while (rngText !== ' ' && rngText !== '' && rngText.charCodeAt(0) !== 160 && (end - 2) >= 0 && rngText !== delimiter);

  if (rangeEqualsDelimiterOrSpace(rng.toString(), delimiter)) {
    setStart(rng, endContainer, end);
    setEnd(rng, endContainer, start);
    end += 1;
  } else if (rng.startOffset === 0) {
    setStart(rng, endContainer, 0);
    setEnd(rng, endContainer, start);
  } else {
    setStart(rng, endContainer, end);
    setEnd(rng, endContainer, start);
  }
  // The while loop above ensures that the beginning of the range doesn't include whitespace. However, we could have
  // trailing whitespace at the end of the range. Account for that now before excluding trailing characters.

  const rawText = rng.toString();
  text = rawText.trim();

  if (rawText.length > text.length) {
    let change = rawText.length - text.length;

    // In normal usage I think trim would only have removed whitespace at the end due to how the above loop works.
    // However, there is a unit test with a BOM character at the beginning of the text. I'm not sure if it was added
    // on purpose, but I'm going to handle it just to be safe.
    const startIndex = rawText.indexOf(text);
    if (startIndex > 0) {
      change -= startIndex;
    }

    if (change > 0) {
      start -= change;
      setEnd(rng, endContainer, start);
    }
  }

  // Now that we have the text, process it before trying to validate it

  // First, we want to ignore any trailing punctuation, for example: www.example.com.
  if (Settings.getEndingPunctuationIgnoreList().indexOf(text.charAt(text.length - 1)) !== -1) {
    setEnd(rng, endContainer, --start); // Modify the start index in case we also fall into the next block
    text = rng.toString().trim();
  }

  // Second, ignore any closing grouping type characters to allow for (www.example.com) or "www.example.com"
  if (Settings.getGroupingCharactersIgnoreLIst().indexOf(text.charAt(text.length - 1)) !== -1) {
    setEnd(rng, endContainer, start - 1);
    text = rng.toString().trim();
  }

  // Third, ignore any staring grouping type characters to allow for (www.example.com or "www.example.com"
  if (Settings.getGroupingCharactersIgnoreLIst().indexOf(text.charAt(0)) !== -1) {
    // If we "ended" at the end of the line or a whitespace character end is currently the index before that.
    // So this will always remove a leading grouping character before the URL
    setStart(rng, endContainer, end);
    text = rng.toString().trim();
  }

  // Last, if the text begins with www. prepend our default protocol
  if (text.startsWith('www.')) {
    text = `http://${text}`;
  }

  let validURL: URL | null = null;
  try {
    validURL = new URL(text);
  } catch (e) { /* The URL constructor will throw when passed an invalid URL */ }

  if (validURL && Settings.getAllowedProtocols().indexOf(validURL.protocol) !== -1) {
    bookmark = editor.selection.getBookmark();

    editor.selection.setRng(rng);
    editor.execCommand('createlink', false, validURL.href);

    if (defaultLinkTarget) {
      editor.dom.setAttrib(editor.selection.getNode(), 'target', defaultLinkTarget);
    }

    editor.selection.moveToBookmark(bookmark);
    editor.nodeChanged();
  }
};

const setup = (editor: Editor): void => {
  let autoUrlDetectState: boolean | undefined;

  editor.on('keydown', (e) => {
    if (e.keyCode === 13) {
      return handleEnter(editor);
    }
  });

  // Internet Explorer has built-in automatic linking for most cases
  if (Env.browser.isIE()) {
    editor.on('focus', () => {
      if (!autoUrlDetectState) {
        autoUrlDetectState = true;

        try {
          editor.execCommand('AutoUrlDetect', false, true);
        } catch (ex) {
          // Ignore
        }
      }
    });

    return;
  }

  editor.on('keyup', (e) => {
    if (e.keyCode === 32) {
      return handleSpacebar(editor);
    }
  });
};

export {
  setup,
  addProtocolIfNeeded
};
