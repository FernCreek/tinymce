/**
 * @file DialogSetup.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {TinySC} from 'shims/tinysc';
import TableRowCell from './TableRowCell';
/**
 * Sets up the color picker
 * @returns {any}
 */
const setupColorPicker = () => TinySC.PopupColorPicker;
/**
 * Sets up the source editor dialog
 * @returns {any}
 */
const setupSourceEditorDialog = () => TinySC.SourceEditorPane;

/**
 * Sets up the link properties dialog
 * @param {tinymce.Editor} editor - the editor
 * @returns the view class for the dialog
 */
const setupLinkPropertiesDialog = (editor) => {
  // Finds the anchor node based on the selected node
  const findAnchorNode = (selectedNode) => {
    let anchorNode = TinySC.Utils.findClosestAnchorNode($(selectedNode));
    if (!anchorNode) {
      // There is an edge case on IE and Edge (pun intended) where the selection node is the entire editor body.
      // If there is a link at the start of the editor, check the start of the selection as well.
      selectedNode = editor.selection.getStart();
      anchorNode = TinySC.Utils.findClosestAnchorNode($(selectedNode));
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

  const controller = TinySC.insertLinkController;
  let selectedNode, anchorNode;
  selectedNode = editor.selection.getNode();
  [anchorNode, selectedNode] = findAnchorNode(selectedNode);

  const tmpDiv = document.createElement('div');
  tmpDiv.innerHTML = editor.selection.getContent({format: 'html'});

  controller.set('insertMode', !anchorNode);
  anchorNode ?
    editor.selection.select(anchorNode) : // Select the anchor node, in case it was a parent of the actual selection.
    anchorNode = TinySC.Utils.findChildAnchorNode($(tmpDiv)); // Find a child anchor node, so we can populate the dialog with its href.

  if (anchorNode) { // Populate based on our found anchor node
    controller.set('selectedUrlType', controller.getUrlType(anchorNode.href));
    controller.set('url', anchorNode.getAttribute('href'));
  }
  controller.set('displayText', editor.selection.getContent({format: 'text'}));
  controller.set('displayTextEditable', editableText(tmpDiv));

  return TinySC.InsertLinkPane;
};

/**
 * Sets up the image properties dialog
 * @param {tinymce.Editor} editor - the editor
 * @param owner - the sc view that owns the editor
 * @returns the view class for the dialog
 */
const setupImagePropertiesDialog = (editor, owner) => {
  const selectedNode = editor.selection.getNode(), controller = TinySC.insertImageController;
  // Sets edit specific information on the controller
  const setupImageControllerForEdit = () => {
    // Set this false to so the controller does not update width/height properties while we are setting them.
    controller.set('maintainAspectRatio', false);
    controller.beginPropertyChanges().set('fileSelected', true).set('node', selectedNode).set('insertMode', false);
    const propertyAttributes = [
      {prop: 'originalWidth', attr: 'data-mce-tinysc-original-width'},
      {prop: 'originalHeight', attr: 'data-mce-tinysc-original-height'},
      {prop: 'scaledPixelWidth', attr: 'width'},
      {prop: 'scaledPixelHeight', attr: 'height'},
      {prop: 'fileName', attr: 'data-mce-tinysc-file-name'},
      {prop: 'serverFileID', attr: 'data-mce-tinysc-server-file-id'},
      {prop: 'fileSize', attr: 'data-mce-tinysc-file-size'},
      {prop: 'imageType', attr: 'data-mce-tinysc-image-type'},
    ];
    propertyAttributes.forEach(({prop, attr}) => {
      controller.set(prop, selectedNode.getAttribute(attr));
    });
    controller.endPropertyChanges();
    // Controller has calculated the %width/%height, check if we should maintain ratio
    controller.set('maintainAspectRatio', controller.get('scaledPercentWidth') === controller.get('scaledPercentHeight'));
  };

  selectedNode.tagName === 'IMG' ? setupImageControllerForEdit() : controller.set('insertMode', true);

  const delegate = controller.get('delegate');
  if (delegate) {
    const delSettings = ['entityType', 'entityID', 'subtypeID', 'reportedBy', 'fieldID'];
    delSettings.forEach((setting) => delegate.set(setting, owner.get(setting)));
  }

  return TinySC.InsertImagePane;
};

/**
 * Sets up the table properties dialog
 * @param {tinymce.Editor} editor - the editor
 * @param onSubmit - the on submit property to set
 * @returns the view class for the dialog
 */
const setupTablePropertiesDialog = (editor, onSubmit) => {
  TableRowCell.setupTableProperties(editor, onSubmit);
  return TinySC.TablePropertiesPane;
};
/**
 * Sets up the row properties dialog
 * @param {tinymce.Editor} editor - the editor
 * @returns the view class for the dialog
 */
const setupRowPropertiesDialog = (editor) => {
  TableRowCell.setupRowCellProperties(editor, false);
  return TinySC.TableRowPropertiesPane;
};
/**
 * Sets up the cell properties dialog
 * @param {tinymce.Editor} editor - the editor
 * @returns the view class for the dialog
 */
const setupCellPropertiesDialog = (editor) => {
  TableRowCell.setupRowCellProperties(editor, true);
  return TinySC.TableCellPropertiesPane;
};

export default {
  setupTablePropertiesDialog,
  setupRowPropertiesDialog,
  setupCellPropertiesDialog,
  setupImagePropertiesDialog,
  setupLinkPropertiesDialog,
  setupColorPicker,
  setupSourceEditorDialog
};