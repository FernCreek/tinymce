/**
 * Newlines.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import Tools from 'tinymce/core/api/util/Tools';
import Entities from 'tinymce/core/api/html/Entities';

export interface RootAttrs {[key: string]: string; }

/**
 * Newlines class contains utilities to convert newlines (\n or \r\n) tp BRs or to a combination of the specified block element and BRs
 *
 * @class tinymce.Newlines
 * @private
 */

const isPlainText = function (text: string) {
  // so basically any tag that is not one of the "p, div, span, br", or is one of them, but is followed
  // by some additional characters qualifies the text as not a plain text (having some HTML tags)
  // <span style="white-space:pre"> and <br /> are added as separate exceptions to the rule
  return !/<(?:\/?(?!(?:div|p|br|span)>)\w+|(?:(?!(?:span style="white-space:\s?pre;?">)|br\s?\/>))\w+\s[^>]+)>/i.test(text);
};

const toBRs = function (text: string) {
  return text.replace(/\r?\n/g, '<br>');
};

const openContainer = function (rootTag: string, rootAttrs: RootAttrs) {
  let key;
  const attrs = [];
  let tag = '<' + rootTag;

  if (typeof rootAttrs === 'object') {
    for (key in rootAttrs) {
      if (rootAttrs.hasOwnProperty(key)) {
        attrs.push(key + '="' + Entities.encodeAllRaw(rootAttrs[key]) + '"');
      }
    }

    if (attrs.length) {
      tag += ' ' + attrs.join(' ');
    }
  }
  return tag + '>';
};

const toBlockElements = function (text: string, rootTag: string, rootAttrs: RootAttrs) {
  const blocks = text.split(/\n\n/);
  const tagOpen = openContainer(rootTag, rootAttrs);
  const tagClose = '</' + rootTag + '>';

  const paragraphs = Tools.map(blocks, function (p) {
    return p.split(/\n/).join('<br />');
  });

  const stitch = function (p) {
    return tagOpen + p + tagClose;
  };

  return paragraphs.length === 1 ? paragraphs[0] : Tools.map(paragraphs, stitch).join('<br />');
};

const convert = function (text: string, rootTag: string, rootAttrs: RootAttrs) {
  return rootTag ? toBlockElements(text, rootTag, rootAttrs) : toBRs(text);
};

export default {
  isPlainText,
  convert,
  toBRs,
  toBlockElements
};