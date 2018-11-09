/**
 * @file Link.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {SPTinyMCEInterface, findClosestAnchorNode, findChildAnchorNode} from 'shims/sptinymceinterface';

//////////////////////////////////////////////////////////////////////////
// Hyperlink handling
//////////////////////////////////////////////////////////////////////////

// Finds the closest link from the selection
const findClosestLinkFromSelection = (editor) => findClosestAnchorNode($(editor.selection.getNode()));
// Tells the editor to unlink the current link
const unlink = (editor) => editor.execCommand('unlink', true);
// Tells the editor to select the current link
const selectLink = (editor) => {
  const anchorNode = findClosestLinkFromSelection(editor);
  if (anchorNode) {
    editor.selection.select(anchorNode);
  }
};
// Determines the URL and emits a signal to the interface so the client can open the current link.
const requestOpenLink = (editor) => {
  const anchorNode = findClosestLinkFromSelection(editor);
  if (anchorNode) {
    SPTinyMCEInterface.signalResponseOpenHyperlink(anchorNode.href);
  }
};
// Determines the information for inserting or editing a link for the current location
const requestInsertEditLink = (editor) => {
  let anchorNode = findClosestLinkFromSelection(editor);
  const tmpDiv = document.createElement('div');
  tmpDiv.innerHTML = editor.selection.getContent({format: 'html'});
  const insertMode = !anchorNode;
  anchorNode ?
    editor.selection.select(anchorNode) : // Select the anchor node, in case it was a parent of the actual selection.
    anchorNode = findChildAnchorNode($(tmpDiv)); // Find a child anchor node, so we can populate the dialog with its href.

  const displayText = editor.selection.getContent({format: 'text'});
  const displayTextEditable = $(tmpDiv).find('*').addBack().contents().filter(function () {
    return this.nodeType !== Node.TEXT_NODE && (this as any).tagName !== 'A';
  }).length === 0;

  insertMode ?
    SPTinyMCEInterface.signalResponseInsertHyperlink(displayText, displayTextEditable) :
    SPTinyMCEInterface.signalResponseEditHyperlink(anchorNode ? anchorNode.getAttribute('href') : '', displayText, displayTextEditable);
};

// If the URL starts with %, it is for a field code
const isFieldCodeLink = (url) => url.indexOf('%') === 0;

// Add the http protocol if no supported protocol is present
// If the URL starts with %, it is for a field code do not add the http protocol
const addProtocolIfNeeded = (editor, url) =>
  editor.plugins.autolink && editor.plugins.autolink.addProtocolIfNeeded && !isFieldCodeLink(url) ?
    editor.plugins.autolink.addProtocolIfNeeded(url) : url;

// Inserts a link in the editor with the provided information
const insertLink = (editor, url, displayText) => {
  const insertContent = (content) => editor.execCommand('mceInsertContent', false, content, {skip_focus: true});

  if (url.length === 0) {
    insertContent(displayText);
  } else {
    url  = addProtocolIfNeeded(editor, url);
    const htmlArgs = Object.assign({},  {
      href: url.replace(' ', '%20'),
      title: 'Open ' + url,
      id: 'tinysc-link'
    }, !isFieldCodeLink(url) ? {target: '_blank'} : {});
    const linkHTML = editor.dom.createHTML('a', htmlArgs, editor.dom.encode(displayText));
    insertContent(linkHTML);
    const $link = $(editor.dom.select('#tinysc-link'));
    if ($link.length === 1) {
      editor.selection.setCursorLocation($link[0], 1);
    }
    $link.removeAttr('id');
  }
  editor.execCommand('mceAddUndoLevel');
};

export {unlink, selectLink, requestOpenLink, requestInsertEditLink, insertLink};