/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import Editor from 'tinymce/core/api/Editor';

const hasProtocolPattern = function () {
  return /^(?:ttstudio|sscm|doors|ftp|http|https|nntp|telnet|file):\/\/|(?:mailto|news):(?!\/)|ftp(?=\.)/i;
};

const getDefaultLinkTarget = function (editor: Editor) {
  return editor.getParam('default_link_target', false);
};

const getDefaultLinkProtocol = (editor: Editor): string => editor.getParam('link_default_protocol', 'http', 'string');

const getEndingPunctuationIgnoreList = () => [ '.', '?', '!', ',', ';', ':' ];

const getGroupingCharactersIgnoreLIst = () => [ '(', ')', '[', ']', '{', '}', '`', '"', '\'' ];

const getAllowedProtocols = () => [ 'http:', 'https:', 'ttstudio:', 'sscm:', 'doors:', 'ftp:', 'mailto:', 'nntp:', 'file:', 'news:' ];

export {
  hasProtocolPattern,
  getDefaultLinkTarget,
  getDefaultLinkProtocol,
  getEndingPunctuationIgnoreList,
  getGroupingCharactersIgnoreLIst,
  getAllowedProtocols
};
