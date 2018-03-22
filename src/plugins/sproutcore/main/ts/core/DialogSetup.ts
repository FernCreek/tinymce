/**
 * @file DialogSetup.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import TinySC from 'shims/tinysc';

/**
 * Sets up the color picker
 * @returns {any}
 */
const setupColorPicker = () => TinySC.get().PopupColorPicker;
/**
 * Sets up the source editor dialog
 * @returns {any}
 */
const setupSourceEditorDialog = () => TinySC.get().SourceEditorPane;
/**
 * Sets up the link properties dialog
 * @param {tinymce.Editor} editor - the editor
 * @returns {any}
 */
const setupLinkPropertiesDialog = (editor) => {
  // Finds the anchor node based on the selected node
  const findAnchorNode = (selectedNode) => {
    let anchorNode = TinySC.get().Utils.findClosestAnchorNode($(selectedNode));
    if (!anchorNode) {
      // There is an edge case on IE and Edge (pun intended) where the selection node is the entire editor body.
      // If there is a link at the start of the editor, check the start of the selection as well.
      selectedNode = editor.selection.getStart();
      anchorNode = TinySC.get().Utils.findClosestAnchorNode($(selectedNode));
    }
    return [anchorNode, selectedNode];
  };
  // Determines if the text should be editable.
  const editableText = (div) => { // Look to see if the selection contains anything other than anchor and text nodes.
    const $q = $(div).find('*').addBack().contents().filter(function () {
      return this.nodeType !== Node.TEXT_NODE && this.tagName !== 'A';
    });
    return $q.length === 0;
  };

  const controller = TinySC.get().insertLinkController;
  let selectedNode, anchorNode;
  selectedNode = editor.selection.getNode();
  [anchorNode, selectedNode] = findAnchorNode(selectedNode);

  const tmpDiv = document.createElement('div');
  tmpDiv.innerHTML = editor.selection.getContent({format: 'html'});

  controller.set('insertMode', !!anchorNode);
  anchorNode ?
    editor.selection.select(anchorNode) : // Select the anchor node, in case it was a parent of the actual selection.
    anchorNode = TinySC.get().Utils.findChildAnchorNode($(tmpDiv)); // Find a child anchor node, so we can populate the dialog with its href.

  if (anchorNode) { // Populate based on our found anchor node
    controller.set('selectedUrlType', controller.getUrlType(anchorNode.href));
    controller.set('url', anchorNode.getAttribute('href'));
  }
  controller.set('displayText', editor.selection.getContent({format: 'text'}));
  controller.set('displayTextEditable', editableText(tmpDiv));

  return TinySC.get().InsertLinkPane;
};
/**
 * Sets up the image properties dialog
 */
const setupImagePropertiesDialog = (e, o) => {};

/**
 * Sets up the table properties dialog
 */
const setupTablePropertiesDialog = (e, s) => {};
/**
 * Sets up the row properties dialog
 */
const setupRowPropertiesDialog = (e) => {};
/**
 * Sets up the cell properties dialog
 */
const setupCellPropertiesDialog = (e) => {};

export default {
  setupTablePropertiesDialog,
  setupRowPropertiesDialog,
  setupCellPropertiesDialog,
  setupImagePropertiesDialog,
  setupLinkPropertiesDialog,
  setupColorPicker,
  setupSourceEditorDialog
};