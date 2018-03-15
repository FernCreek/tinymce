/**
 * Settings.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2017 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

const getAutoLinkPattern = function (editor) {
  return editor.getParam('autolink_pattern', /\b(?:(?:ttstudio|sscm|ftp|http|https|nntp|telnet|file|doors):\/\/|(?:mailto|news):(?!\/)|www[0-9]?(?=\.)|ftp(?=\.))(?:[$_.+!*(),;\/\\?:@&~=-](?=[A-Za-z0-9%])|[A-Za-z0-9%*])(?:[A-Za-z0-9)]|[$_.+!*(,;\/\\?:@&~=-](?!\s|$)|%[A-Fa-f0-9]{2})*(?:#[\/a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;\/\\?:@&~=%-]*)?/i);
};

const hasProtocolPattern = function () {
  return /^(?:ttstudio|sscm|doors|ftp|http|https|nntp|telnet|file):\/\/|(?:mailto|news):(?!\/)|ftp(?=\.)/i;
};

const getDefaultLinkTarget = function (editor) {
  return editor.getParam('default_link_target', '');
};

export default {
  getAutoLinkPattern,
  hasProtocolPattern,
  getDefaultLinkTarget
};