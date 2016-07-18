/**
 * TODO_KB Document
 *
 * Copyright 2016, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */

/*global tinymce:true, $, SPTinyMCEInterface */

(function () {
  var defaults, getParam;

  /**
   * Gets the specified parameter, or the plugin defined default value.
   *
   * @param {tinymce.Editor} ed Editor instance.
   * @param {String} name Parameter name.
   */
  getParam = function (ed, name) {
    return ed.getParam(name, defaults[name]);
  };

  /**
   * @class
   *
   * TinyMCE plugin for integration with our Qt interface.
   */
  tinymce.create('tinymce.plugins.QtInterfacePlugin', {

    QtInterfacePlugin: function (ed) {
      // Class Constructor
    },

    /**
     * Initializes the plugin, this will be executed after the plugin has been created.
     * This call is done before the editor instance has finished it's initialization so use the onInit event
     * of the editor instance to intercept that event.
     *
     * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
     */
    init: function (ed) {

      tinymce.extend(ed, {
        // TODO_KB extend here as needed
      });
    },

    /**
     * Callback for when the node changes
     * @param ed
     * @param element
     */
    nodeChanged: function (element) {
      var state = false,
          listNode, parent,
          ed = tinymce.activeEditor;
      if (SPTinyMCEInterface && ed) {
        state = ed.queryCommandState('bold');
        SPTinyMCEInterface.signalCursorIsBold(state);
        state = ed.queryCommandState('italic');
        SPTinyMCEInterface.signalCursorIsItalic(state);
        state = ed.queryCommandState('underline');
        SPTinyMCEInterface.signalCursorIsUnderline(state);
        state = ed.queryCommandState('strikethrough');
        SPTinyMCEInterface.signalCursorIsStrikethrough(state);
        if (ed.queryCommandState('justifyleft')) {
          SPTinyMCEInterface.signalCursorAlignLeft();
        } else if (ed.queryCommandState('justifycenter')) {
          SPTinyMCEInterface.signalCursorAlignCenter();
        } else if (ed.queryCommandState('justifyright')) {
          SPTinyMCEInterface.signalCursorAlignRight();
        } else if (ed.queryCommandState('justifyfull')) {
          SPTinyMCEInterface.signalCursorAlignJustify(state);
        }

        // Insert/Edit Table
        parent = ed.dom.getParent(element, 'td,th,caption');
        state = (element.nodeName === 'TABLE' || !!parent);

        // Disable table tools if we are in caption
        if (parent && parent.nodeName === 'CAPTION') {
          state = false;
        }
        SPTinyMCEInterface.signalCursorInTable(state);

        // Lists
        listNode = ed.dom.getParent(element, 'ul,ol');

        // Bulleted (Unordered) List
        state = (!!listNode) && (listNode.nodeName === 'UL');
        SPTinyMCEInterface.signalCursorInBulletedList(state);

        // Numbered (Ordered) List
        state = (!!listNode) && (listNode.nodeName === 'OL');
        SPTinyMCEInterface.signalCursorInNumberedList(state);

        // Links
        parent = ed.dom.getParent(element, 'a');
        SPTinyMCEInterface.signalCursorInHyperlink(!!parent);
      }
    },

    toggleBold: function (bBold) {
      tinymce.activeEditor.execCommand('bold', bBold);
    },

    toggleItalic: function (bItalic) {
      tinymce.activeEditor.execCommand('italic', bItalic);
    },

    toggleUnderline: function (bULine) {
      tinymce.activeEditor.execCommand('underline', bULine);
    },

    toggleStrikethrough: function (bStriked) {
      tinymce.activeEditor.execCommand('strikethrough', bStriked);
    },

    setAlign: function (alignment) {
      var alignTypes = ['alignleft', 'alignright', 'aligncenter', 'alignfull'];

      // First turn off all alignment styles
      alignTypes.forEach( function (align) {
        tinymce.activeEditor.formatter.remove(align);
      });

      tinymce.activeEditor.execCommand('justify' + alignment);
    },

    decreaseIndent: function () {
      tinymce.activeEditor.execCommand('outdent');
    },

    increaseIndent: function () {
      tinymce.activeEditor.execCommand('indent');
    },

    insertHorizontalRule: function () {
      tinymce.activeEditor.execCommand('InsertHorizontalRule', false, true);
    },

    clearFormatting: function () {
      tinymce.activeEditor.execCommand('RemoveFormat');
    },

    setFontColor: function (color) {
      tinymce.activeEditor.execCommand('ForeColor', false, color);
    },

    setHilightColor: function (color) {
      tinymce.activeEditor.execCommand('HiliteColor', false, color);
    },

    bulletList: function (bInList) {
      tinymce.activeEditor.execCommand('InsertUnorderedList', false, bInList);
    },

    numberList: function (bInList) {
      tinymce.activeEditor.execCommand('InsertOrderedList', false, bInList);
    },

    setFont: function (font) {
      if (font) {
        tinymce.activeEditor.execCommand('FontName', false, font);
      } else {
        // Set default font
        // TODO_KB
      }
    },

    setFontSize: function (size) {
      if (size) {
        tinymce.activeEditor.execCommand('FontSize', false, size + 'pt');
      } else {
        // Set default font size
        // TODO_KB
      }
    },

    insertTable: function (json) {
      console.log('insertTable');

      var spTablePlugin = tinymce.activeEditor.plugins.seapinetable,
          borders = json['borders'],
          topBorder, leftBorder, rightBorder, bottomBorder,
          horizontalBorder, verticalBorder,
          tableBorders, cellMargins;
      if (spTablePlugin) {

        cellMargins = new spTablePlugin.CellMargins(json['cellMargins']['left'], json['cellMargins']['top'],
                                                    json['cellMargins']['right'], json['cellMargins']['bottom']);

        topBorder = new spTablePlugin.Border(borders['top']['width'], borders['top']['color']);
        leftBorder = new spTablePlugin.Border(borders['left']['width'], borders['left']['color']);
        rightBorder = new spTablePlugin.Border(borders['right']['width'], borders['right']['color']);
        bottomBorder = new spTablePlugin.Border(borders['bottom']['width'], borders['bottom']['color']);
        horizontalBorder = new spTablePlugin.Border(borders['horizontal']['width'], borders['horizontal']['color']);
        verticalBorder = new spTablePlugin.Border(borders['vertical']['width'], borders['vertical']['color']);

        tableBorders = new spTablePlugin.TableBorders(leftBorder, topBorder, rightBorder, bottomBorder,
                                                      verticalBorder, horizontalBorder);

        spTablePlugin.insertOrSaveTable(undefined, json['rows'], json['columns'],
                                        parseInt(json['width'], 10),
                                        tableBorders, json['alignment'],
                                        parseInt(json['cellSpacing'], 10),
                                        cellMargins, json['bgColor']);
      }
    },

    requestTableProperties: function () {
      console.log('requestTableProperties');

      var ed = tinymce.activeEditor, spTablePlugin = ed.plugins.seapinetable,
          json = {}, jsonBorders, tableBorders,
          selectedNode, tableElement, $tableElement,
          cellSpacing, alignment, margins, backgroundColor, borderStyle,
          topBorder, leftBorder, bottomBorder, rightBorder, horizontalBorder, verticalBorder;

      selectedNode = ed.selection.getNode();
      tableElement = ed.dom.getParent(selectedNode, 'table');

      if (tableElement && spTablePlugin) {
        $tableElement = $(tableElement);

        json['borders'] = {};
        json['cellMargins'] = {};
        jsonBorders = json['borders'];


        if ($tableElement.css('border-collapse') === 'separate') {
          cellSpacing = isFinite(parseInt(spTablePlugin.getWidthFromPxString($tableElement.css('borderSpacing')), 10) || 0);
        } else {
          cellSpacing = 0;
        }
        json['cellSpacing'] = cellSpacing;

        alignment = tableElement.align || 'left';
        json['alignment'] = alignment;
        backgroundColor = tableElement.bgColor || '#ffffff'; // TODO: RGBtoHex?
        json['bgColor'] = backgroundColor;

        json['rows'] = spTablePlugin.countTableRows($tableElement);
        json['columns'] = spTablePlugin.countTableColumns($tableElement);
        json['width'] = tableElement.offsetWidth;

        topBorder = spTablePlugin.getBorderForTable(ed, $tableElement, 'top');
        jsonBorders['top'] = topBorder;
        leftBorder = spTablePlugin.getBorderForTable(ed, $tableElement, 'left');
        jsonBorders['left'] = leftBorder;
        bottomBorder = spTablePlugin.getBorderForTable(ed, $tableElement, 'bottom');
        jsonBorders['bottom'] = bottomBorder;
        rightBorder = spTablePlugin.getBorderForTable(ed, $tableElement, 'right');
        jsonBorders['right'] = rightBorder;
        horizontalBorder = spTablePlugin.getBorderForTable(ed, $tableElement, 'horizontal');
        jsonBorders['horizontal'] = horizontalBorder;
        verticalBorder = spTablePlugin.getBorderForTable(ed, $tableElement, 'vertical');
        jsonBorders['vertical'] = verticalBorder;

        tableBorders = new spTablePlugin.TableBorders(leftBorder, topBorder, rightBorder, bottomBorder,
                                                      verticalBorder, horizontalBorder);

        margins = spTablePlugin.getMarginsForTable($tableElement);
        json['cellMargins']['top'] = margins[0];
        json['cellMargins']['right'] = margins[1];
        json['cellMargins']['bottom'] = margins[2];
        json['cellMargins']['left'] = margins[3];

        // Determine the current border style based on the borders
        borderStyle = spTablePlugin.getBorderStyleForTable(tableBorders);
        json['borderStyle'] = borderStyle.style;
        if (borderStyle.commonColor) {
          json['borderColor'] = borderStyle.commonColor;
        }
        if (borderStyle.commonWidth) {
          json['borderWidth'] = borderStyle.commonWidth;
        }

        console.log(json);
        SPTinyMCEInterface.signalResponseTableProperties(json);
      }

    },

    fireTableCommand: function (cmd) {
      tinymce.activeEditor.execCommand(cmd);
    },

    /**
     * Returns information about the plugin as a name/value array.
     * The current keys are longname, author, authorurl, infourl and version.
     *
     * @return {Object} Name/value array containing information about the plugin.
     */
    getInfo: function () {
      return {
        longname: 'Qt Integration plugin',
        author: 'Seapine Software Inc',
        authorurl: 'http://www.seapine.com',
        infourl: 'http://www.seapine.com',
        version: '0.1'
      };
    }

  });

  // Register plugin
  tinymce.PluginManager.add('qtinterface', tinymce.plugins.QtInterfacePlugin);
})();
