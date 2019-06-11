/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Arr } from '@ephox/katamari';
import { PlatformDetection } from '@ephox/sand';
import { Element, Node, Css, Traverse } from '@ephox/sugar';

const browser = PlatformDetection.detect().browser;

const firstElement = function (nodes) {
  return Arr.find(nodes, Node.isElement);
};

// Firefox has a bug where caption height is not included correctly in offset calculations of tables
// this tries to compensate for that by detecting if that offsets are incorrect and then remove the height
const getTableCaptionDeltaY = function (elm) {
  if (browser.isFirefox() && Node.name(elm) === 'table') {
    return firstElement(Traverse.children(elm)).filter(function (elm) {
      return Node.name(elm) === 'caption';
    }).bind(function (caption) {
      return firstElement(Traverse.nextSiblings(caption)).map(function (body) {
        const bodyTop = body.dom().offsetTop;
        const captionTop = caption.dom().offsetTop;
        const captionHeight = caption.dom().offsetHeight;
        return bodyTop <= captionTop ? -captionHeight : 0;
      });
    }).getOr(0);
  } else {
    return 0;
  }
};

const getPos = function (body, elm, rootElm) {
  let x = 0, y = 0, offsetParent;
  let pos;

  rootElm = rootElm ? rootElm : body;

  if (elm) {
    // Use getBoundingClientRect if it exists since it's faster than looping offset nodes
    // Fallback to offsetParent calculations if the body isn't static better since it stops at the body root
    if (rootElm === body && elm.getBoundingClientRect && Css.get(Element.fromDom(body), 'position') === 'static') {
      pos = elm.getBoundingClientRect();
      return {x: pos.left, y: pos.top};
    }

    offsetParent = elm;
    while (offsetParent && offsetParent !== rootElm && offsetParent.nodeType) {
      x += offsetParent.offsetLeft || 0;
      y += offsetParent.offsetTop || 0;
      offsetParent = offsetParent.offsetParent;
    }

    offsetParent = elm.parentNode;
    while (offsetParent && offsetParent !== rootElm && offsetParent.nodeType) {
      x -= offsetParent.scrollLeft || 0;
      y -= offsetParent.scrollTop || 0;
      offsetParent = offsetParent.parentNode;
    }

    y += getTableCaptionDeltaY(Element.fromDom(elm));
  }

  return { x, y };
};

export default {
  getPos
};