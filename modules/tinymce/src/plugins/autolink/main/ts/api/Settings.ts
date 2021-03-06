/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import Editor from 'tinymce/core/api/Editor';

const getAutoLinkPattern = function (editor: Editor) {
  return editor.getParam('autolink_pattern', /\b(?:(?:ttstudio|sscm|ftp|http|https|nntp|telnet|file|doors):\/\/|(?:mailto|news):(?!\/)|www[0-9]?(?=\.)|ftp(?=\.))(?:[$_.+!*(),;\/\\?:@&~=-](?=[A-Za-z0-9%])|[A-Za-z0-9%*])(?:[A-Za-z0-9)]|[$_.+!*(,;\/\\?:@&~=-](?!\s|$)|%[A-Fa-f0-9]{2})*(?:#[\/a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;\/\\?:@&~=%-]*)?/i);
};

const hasProtocolPattern = function () {
  return /^(?:ttstudio|sscm|doors|ftp|http|https|nntp|telnet|file):\/\/|(?:mailto|news):(?!\/)|ftp(?=\.)/i;
};

const getDefaultLinkTarget = function (editor: Editor) {
  return editor.getParam('default_link_target', false);
};

const getDefaultLinkProtocol = (editor: Editor): string => editor.getParam('link_default_protocol', 'http', 'string');

export {
  getAutoLinkPattern,
  hasProtocolPattern,
  getDefaultLinkTarget,
  getDefaultLinkProtocol
};
