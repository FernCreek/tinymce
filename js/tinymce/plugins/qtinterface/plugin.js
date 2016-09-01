/**
 * plugin.js
 * Plugin to interface with the TestTrack native client's Qt interface.
 *
 * Copyright 2016, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */

/*global tinymce, $, SPTinyMCEInterface */

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

    _editor: null,

    _cachedTableElement: null,

    _cachedRowElement: null,

    _cachedCellElement: null,

    _cachedSelectedImage: null,

    _cachedFontFamily: null,

    _cachedFontSize: null,

    // TODO_KB Potentially implement custom bookmarking
    // _bookmark: null,
    // setBookmark: function (bm) { this._bookmark = bm; },
    // getBookmark: function () { return this._bookmark; },

    // These defaults are invalid. They are the default used when with tinyMCE we can not find an specified font size
    // or family we will just allow the one assigned in the CSS to be used
    _defaultFontValue: '',

    _defaultFontSize: 0,

    // TODO_KB Improved font family/size handling
    // These will be changed to properly determine if the font size or family in a spawn is actually
    // our CSS default so that the family and size menus can be set correctly
    _qtDefaultFontFamily: '',

    _qtDefaultFontSize: 0,

    _supportedFontSizes:  [
      // { name: '', ptvalue: '' },
      { name: 'xx-small', ptvalue: '8pt'  },
      { name: undefined, ptvalue: '9pt' },
      { name: 'x-small', ptvalue: '10pt' },
      { name: undefined, ptvalue: '11pt' },
      { name: 'small', ptvalue: '12pt' },
      { name: 'medium', ptvalue: '14pt' },
      { name: undefined, ptvalue: '16pt' },
      { name: 'large', ptvalue: '18pt' },
      { name: undefined, ptvalue: '20pt' },
      { name: undefined, ptvalue: '22pt' },
      { name: 'x-large', ptvalue: '24pt' },
      { name: undefined, ptvalue: '26pt' },
      { name: undefined, ptvalue: '28pt' },
      { name: 'xx-large', ptvalue: '36pt' },
      { name: undefined, ptvalue: '48pt' },
      { name: undefined, ptvalue: '72pt' }
    ],

    QtInterfacePlugin: function (ed) {
      // Class Constructor
      this._editor = ed;
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
        /**
         * Stores the editor's current selection.
         */
        storeSelection: function () {
          var curBookmark = this.plugins.qtinterface.getBookmark();

          // Only store the selection if we don't already have one
          if (this.selection && !curBookmark) {
            this.plugins.qtinterface.setBookmark(this.selection.getBookmark(2));
          }
        },

        /**
         * Restores the previously saved editor selection.
         */
        restoreSelection: function () {
          var bm = this.plugins.qtinterface.getBookmark();

          if (bm) {
            this.selection.moveToBookmark(bm);
          }

          // After we restore the selection, remove the bookmark
          this.plugins.qtinterface.setBookmark(null);
        }

      });
    },

    /**
     * Callback for when the editor is clicked or double clicked
     * @param {Event.target} target
     */
    activateLink: function (target) {
      var ed = this._editor,
          $el = this.findClosestAnchorNode($(target));

      if ($el && ed) {
        SPTinyMCEInterface.signalResponseOpenHyperlink($el.href);
      }
    },

    /**
     * Callback for when the node changes
     * @param element
     */
    nodeChanged: function (element) {
      var state = false, foundIt = false,
          listNode, parent, fontFamily, sizeName,
          supFontSizes = this._supportedFontSizes,
          i, tableCell, ed = this._editor;

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
          SPTinyMCEInterface.signalCursorAlignJustify();
        }

        // Font family
        state = ed.queryCommandValue('fontname');
        if (state === 0 || state === undefined) {
          state = this._defaultFontValue;
        } else if (state === '' && element) {
          // FontFamily not on this node, recurse the parent nodes for a style. If we get to the <body>, end it
          parent = element.parentNode;
          while (parent && !foundIt && !$(parent).is('body')) {
            if (parent.style && parent.style.fontFamily) {
              // Font family is a string something like 'font name', 'font name2', 'font name3'. The first
              // replace will strip the single quotes, the second replace will remove the space after the
              // comma so that the final string matches the values stored in our dropdown
              fontFamily = parent.style.fontFamily;
              state = fontFamily.replace(/["']+/g, '').replace(/, /g, ',').toLowerCase();
              foundIt = true;
            } else {
              parent = parent.parentNode;
            }
          }
        }

        if (state === this._defaultFontValue) {
          // If there is a selection where part of it specifies a font family set to not supported
          if (ed.selection.getContent().indexOf('font-family:') !== -1) {
            SPTinyMCEInterface.signalCursorFontFamily(0);
          } else {
            SPTinyMCEInterface.signalCursorDefaultFontFamily();
          }
        } else {
          SPTinyMCEInterface.signalCursorFontFamily(state);
          this._cachedFontFamily = state;
        }

        // Font size
        foundIt = false;
        state = this._defaultFontSize;
        sizeName = ed.queryCommandValue('fontsize');

        // Sometimes after applying styles our selection isn't perfect so queryCommandValue doesn't
        // work as expected. Check to see if this is a <span> and try to get the font size there.
        // http://www.tinymce.com/develop/bugtracker_view.php?id=6017
        // If the TinyMCE bug is ever fixed, we can probably remove this block
        if ($(element).is('span') && element.style && element.style.fontSize) {
          sizeName = element.style.fontSize;
        }

        // If we have no value for sizeName...
        if ((sizeName === '' || sizeName === 0) && element) {
          // FontSize not on this node, check the parentNode for a style. If we get to the <body>, end it
          parent = element.parentNode;
          while (parent && !foundIt && !$(parent).is('body')) {
            if (parent.style && parent.style.fontSize) {
              // Get font pt size from parent node
              sizeName = parent.style.fontSize;
              foundIt = true;
            } else {
              parent = parent.parentNode;
            }
          }
        }

        foundIt = false;
        for (i = 0; i < supFontSizes.length && !foundIt; ++i) {
          if (sizeName === supFontSizes[i].name || sizeName === supFontSizes[i].ptvalue) {
            state = supFontSizes[i].ptvalue.replace(/pt/, '');
            foundIt = true;
          }
        }

        // console.log('Size: ' + state + ' sizeName: ' + sizeName + ' foundIt: ' + foundIt);
        if (!foundIt) {
          if (state === this._defaultFontSize && (sizeName === this._defaultFontSize || sizeName === '')) {
            // If there is a selection where part of it specifies a font size set to not supported
            if (ed.selection.getContent().indexOf('font-size:') !== -1) {
              SPTinyMCEInterface.signalCursorFontSize(0);
            } else {
              // The default font size is being used, no other size is specified
              SPTinyMCEInterface.signalCursorDefaultFontSize();
              this._cachedFontSize = null;
            }
          } else {
            // There was a valid font size, it is just not supported by us
            SPTinyMCEInterface.signalCursorFontSize(sizeName);
          }
        } else {
          // A valid font size was found
          SPTinyMCEInterface.signalCursorFontSize(state);
          this._cachedFontSize = state;
        }

        // Images
        state = element.tagName === 'IMG';
        SPTinyMCEInterface.signalCursorOnImage(state);
        this._cachedSelectedImage = state ? element : null;

        // Insert/Edit Table
        parent = ed.dom.getParent(element, 'td,th,caption');
        state = (element.nodeName === 'TABLE' || !!parent);

        // Disable table tools if we are in caption
        if (parent && parent.nodeName === 'CAPTION') {
          state = false;
        }
        SPTinyMCEInterface.signalCursorInTable(state);

        state = ed.dom.select('td[data-mce-selected],th[data-mce-selected]');
        SPTinyMCEInterface.signalCursorInMultipleCells(state.length > 1);
        if (state.length === 1) {
          tableCell = state[0];
          SPTinyMCEInterface.signalCursorInMergedCell(tableCell.rowSpan > 1 || tableCell.colSpan > 1);
        } else {
          // Not in a single cell, we can't be in a merged cell
          SPTinyMCEInterface.signalCursorInMergedCell(false);
        }

        SPTinyMCEInterface.signalHasRowToPaste(this._hasRowToPaste);

        // Lists
        listNode = ed.dom.getParent(element, 'ul,ol');

        // Bulleted (Unordered) List
        state = !!listNode && listNode.nodeName === 'UL';
        SPTinyMCEInterface.signalCursorInBulletedList(state);

        // Numbered (Ordered) List
        state = !!listNode && listNode.nodeName === 'OL';
        SPTinyMCEInterface.signalCursorInNumberedList(state);

        // Links
        parent = ed.dom.getParent(element, 'a');
        SPTinyMCEInterface.signalCursorInHyperlink(!!parent);

        this.editorResized();

        SPTinyMCEInterface.signalUndoAvailable(ed.undoManager.hasUndo());
        SPTinyMCEInterface.signalRedoAvailable(ed.undoManager.hasRedo());
        SPTinyMCEInterface.signalCursorHasSelection(ed.selection.getContent().length > 0);
        // console.log('UndoManager HasUndo: ' + ed.undoManager.hasUndo());
        // console.log('UndoManager HasRedo: ' + ed.undoManager.hasRedo());
        // console.log('Selection: ' + ed.selection.getContent());
      }
    },

    //////////////////////////////////////////////////////////////////////////
    // Wysiwyg toolbar button interactions
    //////////////////////////////////////////////////////////////////////////
    toggleBold: function (bBold) {
      this._editor.execCommand('bold', bBold);
    },

    toggleItalic: function (bItalic) {
      this._editor.execCommand('italic', bItalic);
    },

    toggleUnderline: function (bULine) {
      this._editor.execCommand('underline', bULine);
    },

    toggleStrikethrough: function (bStriked) {
      this._editor.execCommand('strikethrough', bStriked);
    },

    setAlign: function (alignment) {
      var ed = this._editor,
          alignTypes = ['alignleft', 'alignright', 'aligncenter', 'alignfull'];

      // First turn off all alignment styles
      alignTypes.forEach( function (align) {
        ed.formatter.remove(align);
      });

      this._editor.execCommand('justify' + alignment);
    },

    decreaseIndent: function () {
      this._editor.execCommand('outdent');
    },

    increaseIndent: function () {
      this._editor.execCommand('indent');
    },

    insertHorizontalRule: function () {
      this._editor.execCommand('InsertHorizontalRule', false, true);
    },

    clearFormatting: function () {
      this._editor.execCommand('RemoveFormat');
    },

    setFontColor: function (color) {
      if (color === '') {
        this._editor.formatter.remove('forecolor');
      } else {
        this._editor.execCommand('ForeColor', false, color);
      }
    },

    setHilightColor: function (color) {
      if (color === '') {
        this._editor.formatter.remove('hilitecolor');
      } else {
        this._editor.execCommand('HiliteColor', false, color);
      }
    },

    bulletList: function (bInList) {
      this._editor.execCommand('InsertUnorderedList', false, bInList);
    },

    numberList: function (bInList) {
      this._editor.execCommand('InsertOrderedList', false, bInList);
    },

    setFont: function (font) {
      if (font) {
        this._editor.execCommand('FontName', false, font);
      } else {
        if (this._cachedFontFamily) {
          this._editor.execCommand('FontName', false, this._cachedFontFamily);
        }
        this._cachedFontFamily = null;
      }
    },

    setFontSize: function (size) {
      if (size) {
        this._editor.execCommand('FontSize', false, size + 'pt');
      } else {
        if (this._cachedFontSize) {
          this._editor.execCommand('FontSize', false, this._cachedFontSize + 'pt');
        }
        this._cachedFontSize = null;
      }
    },

    loadDefaultFont: function (fontJSON) {
      var family = fontJSON['family'], ptSize = fontJSON['ptSize'],
          bodyClass = '.tinymce-native', $editorBody;
      // Save off these defaults for span comparison when text is copy/pasted with default font settings
      this._qtDefaultFontFamily = family;
      this._qtDefaultFontSize = ptSize;

      // console.log('family: ' + family + ' ptSize: ' + ptSize);

      $editorBody = $('#content_ifr').contents().find(bodyClass);
      if ($editorBody && $editorBody.length) {
        $editorBody.css('font-family', family);
        $editorBody.css('font-size', ptSize + 'pt');
      }
    },

    _windowReadOnlyColor: '',
    _windowEditColor: '',
    _textEditColor: '',
    _textReadOnlyColor: '',

    loadPalette: function (windowEdit, windowReadOnly, textEdit, textReadOnly) {
      var bodyClass = '.tinymce-native', $editorBody;
      console.log('Loading palette');
      this._windowEditColor = windowEdit;
      this._windowReadOnlyColor = windowReadOnly;
      this._textEditColor = textEdit;
      this._textReadOnlyColor = textReadOnly;
      $editorBody = $('#content_ifr').contents().find(bodyClass);
      if (this._cachedReadOnly) {
        // Go ahead and apply the readonly styles to the body
        $editorBody.css('color', textReadOnly);
        $editorBody.css('background-color', windowReadOnly);
      } else {
        // Go ahead and apply the editable styles to the body
        $editorBody.css('color', textEdit);
        $editorBody.css('background-color', windowEdit);
      }
    },

    //////////////////////////////////////////////////////////////////////////
    // Wysiwyg table interactions
    //////////////////////////////////////////////////////////////////////////

    _hasRowToPaste: false,

    fireTableCommand: function (cmd) {
      this._editor.execCommand(cmd);
      switch (cmd) {
        case 'mceTableCutRow':
        case 'mceTableCopyRow':
          this._hasRowToPaste = true;
          break;
        case 'mceTablePasteRowBefore':
        case 'mceTablePasteRowAfter':
          this._hasRowToPaste = false;
          break;
        default:
          break;
      }
    },

    getBorderFromJSON: function (jsonBorder) {
      var border, spTablePlugin = this._editor.plugins.seapinetable;
      if (jsonBorder) {
        border = new spTablePlugin.Border(jsonBorder['width'], jsonBorder['color']);
      } else {
        border = new spTablePlugin.Border(0);
      }
      return border;
    },

    insertOrSaveTable: function (json, insertTable) {

      var ed = this._editor,
          spTablePlugin = ed.plugins.seapinetable,
          borders = json['borders'],
          topBorder, leftBorder, rightBorder, bottomBorder,
          horizontalBorder, verticalBorder,
          tableBorders, cellMargins, table;
      if (spTablePlugin) {

        if (insertTable) {
          table = undefined;
        } else {
          table = this._cachedTableElement;
        }

        cellMargins = new spTablePlugin.CellMargins(json['cellMargins']['left'], json['cellMargins']['top'],
                                                    json['cellMargins']['right'], json['cellMargins']['bottom']);

        topBorder = this.getBorderFromJSON(borders['top']);
        leftBorder = this.getBorderFromJSON(borders['left']);
        rightBorder = this.getBorderFromJSON(borders['right']);
        bottomBorder = this.getBorderFromJSON(borders['bottom']);
        horizontalBorder = this.getBorderFromJSON(borders['horizontal']);
        verticalBorder = this.getBorderFromJSON(borders['vertical']);

        tableBorders = new spTablePlugin.TableBorders(leftBorder, topBorder, rightBorder, bottomBorder,
                                                      verticalBorder, horizontalBorder);

        spTablePlugin.insertOrSaveTable(table, json['rows'], json['columns'],
                                        parseInt(json['width'], 10),
                                        tableBorders, json['alignment'],
                                        parseInt(json['cellSpacing'], 10),
                                        cellMargins, json['bgColor']);
      }
    },

    setRowProperties: function (json) {
      // console.log('setRowProperties: ' + JSON.stringify(json));
      var ed = this._editor,
          spTablePlugin = ed.plugins.seapinetable,
          borders = json['borders'],
          topBorder, leftBorder, rightBorder, bottomBorder,
          verticalBorder, rowBorders, cellMargins, alignment;

      if (spTablePlugin && this._cachedRowElement) {
        cellMargins = new spTablePlugin.CellMargins(json['cellMargins']['left'], json['cellMargins']['top'],
                                                    json['cellMargins']['right'], json['cellMargins']['bottom']);

        topBorder = this.getBorderFromJSON(borders['top']);
        leftBorder = this.getBorderFromJSON(borders['left']);
        rightBorder = this.getBorderFromJSON(borders['right']);
        bottomBorder = this.getBorderFromJSON(borders['bottom']);
        verticalBorder = this.getBorderFromJSON(borders['vertical']);

        rowBorders = new spTablePlugin.RowBorders(leftBorder, topBorder, rightBorder, bottomBorder, verticalBorder);
        alignment = new spTablePlugin.Alignment(json['alignment'], json['alignmentV']);

        spTablePlugin.saveRowProperties(this._cachedRowElement, rowBorders, cellMargins, alignment, json['bgColor']);
      }

    },

    setCellProperties: function (json) {
      // console.log('setCellProperties: ' + JSON.stringify(json));
      var ed = this._editor,
          spTablePlugin = ed.plugins.seapinetable,
          borders = json['borders'],
          topBorder, leftBorder, rightBorder, bottomBorder,
          rowBorders, cellMargins, alignment;

      if (spTablePlugin && this._cachedCellElement) {
        cellMargins = new spTablePlugin.CellMargins(json['cellMargins']['left'], json['cellMargins']['top'],
                                                    json['cellMargins']['right'], json['cellMargins']['bottom']);

        topBorder = this.getBorderFromJSON(borders['top']);
        leftBorder = this.getBorderFromJSON(borders['left']);
        rightBorder = this.getBorderFromJSON(borders['right']);
        bottomBorder = this.getBorderFromJSON(borders['bottom']);

        rowBorders = new spTablePlugin.CellBorders(leftBorder, topBorder, rightBorder, bottomBorder);
        alignment = new spTablePlugin.Alignment(json['alignment'], json['alignmentV']);

        spTablePlugin.saveCellProperties(this._cachedRowElement, rowBorders, cellMargins, alignment, json['bgColor']);
      }

    },


    requestTableProperties: function () {

      var ed = this._editor, spTablePlugin = ed.plugins.seapinetable,
          json = {}, jsonBorders, tableBorders,
          selectedNode, tableElement, $tableElement,
          cellSpacing, alignment, margins, backgroundColor, borderStyle,
          topBorder, leftBorder, bottomBorder, rightBorder, horizontalBorder, verticalBorder;

      selectedNode = ed.selection.getNode();
      tableElement = ed.dom.getParent(selectedNode, 'table');
      this._cachedTableElement = tableElement;

      if (tableElement && spTablePlugin) {
        $tableElement = $(tableElement);

        json['borders'] = {};
        json['cellMargins'] = {};
        jsonBorders = json['borders'];


        if ($tableElement.css('border-collapse') === 'separate') {
          cellSpacing = spTablePlugin.getWidthFromPxString($tableElement.css('borderSpacing'));
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

        // console.log('Requested table properties: ' + JSON.stringify(json));
        SPTinyMCEInterface.signalResponseTableProperties(json);
      }
    },

    requestRowProperties: function () {

      // console.log('requestRowProperties');

      var ed = this._editor, spTablePlugin = ed.plugins.seapinetable,
          json = {}, jsonBorders, rowBorders,
          selectedNode, rowElement, $rowElement,
          cellSpacing, margins, borderStyle,
          topBorder, leftBorder, bottomBorder, rightBorder, verticalBorder;

      selectedNode = ed.selection.getNode();
      rowElement = ed.dom.getParent(selectedNode, 'tr');
      this._cachedRowElement = rowElement;

      if (rowElement && spTablePlugin) {
        $rowElement = $(rowElement);

        json['borders'] = {};
        json['cellMargins'] = {};
        jsonBorders = json['borders'];

        json['alignment'] = rowElement.align || 'left';
        json['alignmentV'] = rowElement.vAlign || 'middle';
        json['bgColor'] = rowElement.bgColor || '#ffffff'; // TODO: RGBtoHex?

        topBorder = spTablePlugin.getBorderForRow(ed, $rowElement, 'top');
        jsonBorders['top'] = topBorder;
        leftBorder = spTablePlugin.getBorderForRow(ed, $rowElement, 'left');
        jsonBorders['left'] = leftBorder;
        bottomBorder = spTablePlugin.getBorderForRow(ed, $rowElement, 'bottom');
        jsonBorders['bottom'] = bottomBorder;
        rightBorder = spTablePlugin.getBorderForRow(ed, $rowElement, 'right');
        jsonBorders['right'] = rightBorder;
        verticalBorder = spTablePlugin.getBorderForRow(ed, $rowElement, 'vertical');
        jsonBorders['vertical'] = verticalBorder;

        rowBorders = new spTablePlugin.RowBorders(leftBorder, topBorder, rightBorder, bottomBorder, verticalBorder);

        margins = spTablePlugin.getMarginsForRow($rowElement);
        json['cellMargins']['top'] = margins[0];
        json['cellMargins']['right'] = margins[1];
        json['cellMargins']['bottom'] = margins[2];
        json['cellMargins']['left'] = margins[3];

        // Determine the current border style based on the borders
        borderStyle = spTablePlugin.getBorderStyleForRow(rowBorders);
        json['borderStyle'] = borderStyle.style;
        if (borderStyle.commonColor) {
          json['borderColor'] = borderStyle.commonColor;
        }
        if (borderStyle.commonWidth) {
          json['borderWidth'] = borderStyle.commonWidth;
        }

        // console.log('Requested row properties: ' + JSON.stringify(json));
        SPTinyMCEInterface.signalResponseTableRowProperties(json);
      }

    },

    requestCellProperties: function () {

      console.log('requestCellProperties');

      var ed = this._editor, spTablePlugin = ed.plugins.seapinetable,
          json = {}, jsonBorders, cellBorders,
          selectedNode, cellElement, $cellElement,
          cellSpacing, margins, borderStyle,
          topBorder, leftBorder, bottomBorder, rightBorder;

      selectedNode = ed.selection.getNode();
      cellElement = ed.dom.getParent(selectedNode, 'td');
      this._cachedCellElement = cellElement;

      if (cellElement && spTablePlugin) {
        $cellElement = $(cellElement);

        json['borders'] = {};
        json['cellMargins'] = {};
        jsonBorders = json['borders'];

        json['alignment'] = cellElement.align || 'left';
        json['alignmentV'] = cellElement.vAlign || 'middle';
        json['bgColor'] = cellElement.bgColor || '#ffffff'; // TODO: RGBtoHex?;

        topBorder = spTablePlugin.getBorderForCell(ed, $cellElement, 'top');
        jsonBorders['top'] = topBorder;
        leftBorder = spTablePlugin.getBorderForCell(ed, $cellElement, 'left');
        jsonBorders['left'] = leftBorder;
        bottomBorder = spTablePlugin.getBorderForCell(ed, $cellElement, 'bottom');
        jsonBorders['bottom'] = bottomBorder;
        rightBorder = spTablePlugin.getBorderForCell(ed, $cellElement, 'right');
        jsonBorders['right'] = rightBorder;

        cellBorders = new spTablePlugin.RowBorders(leftBorder, topBorder, rightBorder, bottomBorder);

        margins = spTablePlugin.getMarginsForCell($cellElement);
        json['cellMargins']['top'] = margins[0];
        json['cellMargins']['right'] = margins[1];
        json['cellMargins']['bottom'] = margins[2];
        json['cellMargins']['left'] = margins[3];

        // Determine the current border style based on the borders
        borderStyle = spTablePlugin.getBorderStyleForCell(cellBorders);
        json['borderStyle'] = borderStyle.style;
        if (borderStyle.commonColor) {
          json['borderColor'] = borderStyle.commonColor;
        }
        if (borderStyle.commonWidth) {
          json['borderWidth'] = borderStyle.commonWidth;
        }

        // console.log('Requested cell properties: ' + JSON.stringify(json));
        SPTinyMCEInterface.signalResponseTableCellProperties(json);
      }
    },

    //////////////////////////////////////////////////////////////////////////
    // Wysiwyg context menu/event handling interactions
    /////////////////////////////////////////////////////////////////////////
    undo: function () {
      this._editor.execCommand('Undo');
    },

    redo: function () {
      this._editor.execCommand('Redo');
    },

    selectAll: function () {
      this._editor.execCommand('selectAll');
    },

    //////////////////////////////////////////////////////////////////////////
    // Hyperlink handling interactions
    /////////////////////////////////////////////////////////////////////////

    /**
     * Finds the closest parent anchor node of the element,
     * which could be the element itself.
     *
     * @param {jQuery} $el Element to begin search at.
     * @returns {DOMElement} Closest anchor node, or null if none found.
     */
    findClosestAnchorNode: function ($el) {
      var q = $el.closest('a');
      return (q && q.length) ? q[0] : null;
    },

    /**
     * Finds an anchor node that is a child of the element.
     *
     * @param {jQuery} $el Element to begin search at.
     * @returns {DOMElement} Child anchor node, or null if none found.
     */
    findChildAnchorNode: function ($el) {
      var childAnchors = $el.find('a'),
        foundAnchor = null;

      if (childAnchors && childAnchors.length) {
        foundAnchor = childAnchors[0];
      }

      return foundAnchor;
    },

    unlink: function () {
      this._editor.execCommand('unlink', true);
    },

    selectLink: function () {
      var ed = this._editor,
          selectedNode, anchorNode;

      selectedNode = ed.selection.getNode();
      anchorNode = this.findClosestAnchorNode($(selectedNode));

      if (anchorNode) {
        ed.selection.select(anchorNode);
      }
    },

    requestOpenLink: function () {
      var ed = this._editor,
          url, selectedNode, anchorNode;

      selectedNode = ed.selection.getNode();
      anchorNode = this.findClosestAnchorNode($(selectedNode));

      if (anchorNode) {
        url = anchorNode.href;
        SPTinyMCEInterface.signalResponseOpenHyperlink(url);
      }
    },

    requestInsertEditLink: function () {
      var ed = this._editor,
          selectedNode, anchorNode,
          tmpDiv, $nonAnchorTextQuery,
          url, displayText, displayTextEditable = true, insertMode = true;

      selectedNode = ed.selection.getNode();
      anchorNode = this.findClosestAnchorNode($(selectedNode));

      tmpDiv = document.createElement('div');
      tmpDiv.innerHTML = ed.selection.getContent({ format: 'html' });

      if (anchorNode) {
        // Editing existing link
        insertMode = false;
        selectedNode = ed.selection.select(anchorNode);
      } else {
        anchorNode = this.findChildAnchorNode($(tmpDiv));
      }

      if (anchorNode) {
        url = anchorNode.href;
      }

      displayText = ed.selection.getContent({ format: 'text' });

      $nonAnchorTextQuery = $(tmpDiv).find('*').andSelf().contents().filter(function () {
        return (this.nodeType !== Node.TEXT_NODE && this.tagName !== 'A');
      });

      if ($nonAnchorTextQuery.length) {
        displayTextEditable = false;
      }

      this._linkAnchorNode = anchorNode;
      if (insertMode) {
        SPTinyMCEInterface.signalResponseInsertHyperlink(displayText, displayTextEditable);
      } else {
        SPTinyMCEInterface.signalResponseEditHyperlink(url, displayText, displayTextEditable);
      }
    },

    insertLink: function (url, displayText) {
      var ed = this._editor, linkHTML;
      linkHTML = ed.dom.createHTML('a', {
        href: url.replace(' ', '%20'),
        title: 'Open ' + url,
        target: '_blank'
      }, displayText);

      // ed.restoreSelection();
      ed.execCommand('mceInsertContent', false, linkHTML, {skip_focus: true});
      ed.execCommand('mceAddUndoLevel');
    },

    //////////////////////////////////////////////////////////////////////////
    // Image handling
    /////////////////////////////////////////////////////////////////////////
    insertImage: function (imgSrc) {
      this._editor.execCommand('mceInsertContent', false, imgSrc);
    },

    reloadImage: function (imgSrc) {
      var bodyClass = '.tinymce-native', $images;

      $images = $('#content_ifr').contents().find(bodyClass).find('img');
      $images.each(function () {
        var src = $(this).attr('src'), idx;
        idx = src.indexOf(imgSrc);
        if (idx !== -1 && src.substr(idx) === imgSrc) {
          $(this).attr('src', src + '?1');
        }
      });
      this._editor.execCommand('mceRepaint');
    },

    escapeRegEg: function (str) {
      return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    },

    detectImagesLoaded: function () {
      var editor = this._editor,
        bodyClass = '.tinymce-native', $images, waitImgDone;

      $images = $('#content_ifr').contents().find(bodyClass).find('img');

      waitImgDone = function (loadedImg, bWasError) {
        console.log('Image has been loaded: ' + loadedImg.src + ' at: ' + new Date().getTime() + ' error: ' + bWasError );
        editor.execCommand('mceRepaint');
        if (!bWasError) {
          SPTinyMCEInterface.signalImageLoadedInBrowser(loadedImg.src);
        }
      };

      $images.each(function () {
        var tmpImg = new Image();
        tmpImg.onload = function () {
          waitImgDone(this, false);
        };
        tmpImg.onerror = function () {
          waitImgDone(this, true);
        };
        tmpImg.src = $(this).attr('src');
        console.log('Image: ' + tmpImg.src + ' setup at: ' + new Date().getTime());
      });
    },

    requestEditImage: function (bForResize) {
      var json = {};
      if (this._cachedSelectedImage) {
        json['src'] = this._cachedSelectedImage.src;
        json['width'] = this._cachedSelectedImage.width;
        json['height'] = this._cachedSelectedImage.height;
        if (bForResize) {
          console.log('Response edit image size');
          SPTinyMCEInterface.signalResponseEditImageSize(json);
        } else {
          console.log('Response edit image');
          SPTinyMCEInterface.signalResponseEditImage(json);
        }
      }
    },

    setEditImageSize: function (width, height) {
      if (this._cachedSelectedImage) {
        this._cachedSelectedImage.width = width;
        this._cachedSelectedImage.height = height;
        this._editor.execCommand('mceRepaint');
        this._editor.undoManager.add(); // Manually add an undo event for the resize
      }
    },

    setEditImage: function (src, width, height) {
      if (this._cachedSelectedImage) {
        this._cachedSelectedImage.src = src;
        this._cachedSelectedImage.setAttribute('data-mce-src', src);
        this._cachedSelectedImage.width = width;
        this._cachedSelectedImage.height = height;
        this._editor.execCommand('mceRepaint');
        this._editor.undoManager.add(); // Manually add an undo event for the new image
      }
    },

    //////////////////////////////////////////////////////////////////////////
    // Editor configuration settings
    /////////////////////////////////////////////////////////////////////////
    _cachedWidthSetting: -1,

    setFixedWidthEditor: function (width) {
      var bodyClass = '.tinymce-native', $editorBody;
      // Only set a fixed width if we are not already set to that fixed width
      if (this._cachedWidthSetting !== width) {
        $editorBody = $('#content_ifr').contents().find(bodyClass);
        $editorBody.css('width', width + 'px');
        $editorBody.css('overflow', 'hidden');
        this._cachedWidthSetting = width;
      }
    },

    clearFixedWidthEditor: function () {
      var bodyClass = '.tinymce-native', $editorBody;
      // Only clear the fixed with if we currently have a fixed width
      if (this._cachedWidthSetting !== -1) {
        $editorBody = $('#content_ifr').contents().find(bodyClass);
        // Remove the width and overflow settings
        $editorBody.css('width', '');
        $editorBody.css('overflow', '');
        this._cachedWidthSetting = -1;
      }
    },

    _cachedEditorHeight: '',

    editorResized: function () {
      var bodyClass = '.tinymce-native', $editorBody, currHeight;
      $editorBody = $('#content_ifr').contents().find(bodyClass);
      currHeight = parseInt($editorBody.css('height'), 10);
      if (currHeight !== this._cachedEditorHeight) {
        this._cachedEditorHeight = currHeight;
        console.log('editorResized: ' + currHeight);
        SPTinyMCEInterface.signalEditorHeightChanged(currHeight);
      }
    },

    _cachedReadOnly: null,

    setReadOnly: function (bReadOnly) {
      var bodyClass = '.tinymce-native', $editorBody;
      // Only apply the new value if it isn't our cached value
      if (bReadOnly !== this._cachedReadOnly) {
        $editorBody = $('#content_ifr').contents().find(bodyClass);
        if (bReadOnly) {
          this._editor.setMode('readonly');
          // If we have settings for the palette in this mode apply them
          if (this._windowReadOnlyColor && this._textReadOnlyColor) {
            // Go ahead and apply the readonly styles to the body
            $editorBody.css('font', this._textReadOnlyColor);
            $editorBody.css('background-color', this._windowReadOnlyColor);
          }
        } else {
          this._editor.setMode('design');
          // If we have settings for the palette in this mode apply them
          if (this._windowEditColor && this._textEditColor) {
            // Go ahead and apply the editable styles to the body
            $editorBody.css('font', this._textEditColor);
            $editorBody.css('background-color', this._windowEditColor);
          }
        }
        this._cachedReadOnly = bReadOnly;
      }
    },

    pasteText: function (strText) {
      this._editor.execCommand('mceInsertContent', false, strText);
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
