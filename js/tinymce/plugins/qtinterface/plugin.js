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

    /**
     * The TinyMCE editor object
     * @type {tinymce.Editor}
     */
    _editor: null,

    /**
     * The current table element being worked with
     * @type {HTMLElement}
     */
    _cachedTableElement: null,

    /**
     * The current row element being worked with
     * @type {HTMLElement}
     */
    _cachedRowElement: null,

    /**
     * The current cell element being worked with
     * @type {HTMLElement}
     */
    _cachedCellElement: null,

    /**
     * The currently selected image
     * @type {HTMLElement}
     */
    _cachedSelectedImage: null,

    /**
     * The current font family
     * @type {String}
     */
    _cachedFontFamily: null,

    /**
     * The current font size
     * @type {String}
     */
    _cachedFontSize: null,

    // These defaults are invalid. They are the defaults used when we can not find an specified font size
    // or family. In this case just allow the one assigned in the CSS to be used.
    _defaultFontValue: '',

    _defaultFontSize: 0,

    // TODO_FUTURE Improved font family/size handling
    // These should be changed to properly determine if the font size or family in a span is actually
    // our CSS default so that the family and size menus can be set more accurately.
    /**
     * The default font family set by the client
     * @type {String}
     */
    _qtDefaultFontFamily: '',

    /**
     * The default font size set by the client
     * @type {Number}
     */
    _qtDefaultFontSize: 0,

    /**
     * The supported font sizes for the editor.
     * @type {Array.<Object>} Array of name, point value associations for font sizes
     */
    _supportedFontSizes:  [
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

    /**
     * Constructor that takes in an editor instance
     * @param {tinymce.Editor} ed The editor instance to use.
     * @constructor
     */
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
          i, tableCell, ed = this._editor,
          singleCell = false, singleRow = false,
          mergedCell = false, matchingParent,
          alignments = 0, lastAlignment = '';

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
          lastAlignment = 'left';
          ++alignments;
        }
        if (ed.queryCommandState('justifycenter')) {
          lastAlignment = 'center';
          ++alignments;
        }
        if (ed.queryCommandState('justifyright')) {
          lastAlignment = 'right';
          ++alignments;
        }
        if (ed.queryCommandState('justifyfull')) {
          lastAlignment = 'justify';
          ++alignments;
        }

        if (alignments === 0) {
          SPTinyMCEInterface.signalCursorAlignNone();
        } else if (alignments > 1) {
          SPTinyMCEInterface.signalCursorAlignMultiple();
        } else {
          switch (lastAlignment) {
            case 'left':
              SPTinyMCEInterface.signalCursorAlignLeft();
              break;
            case 'center':
              SPTinyMCEInterface.signalCursorAlignCenter();
              break;
            case 'right':
              SPTinyMCEInterface.signalCursorAlignRight();
              break;
            case 'justify':
              SPTinyMCEInterface.signalCursorAlignJustify();
              break;
            default:
              break;
          }
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
          singleCell = true;
          singleRow = true;
          mergedCell = tableCell.rowSpan > 1 || tableCell.colSpan > 1;
        } else if (state.length > 1) {
          // In multiple cells
          SPTinyMCEInterface.signalCursorInMergedCell(false);
          // Check if all of the cells selected are in the same row
          matchingParent = true;
          parent = state[0].parentNode;
          for (i = 1; i < state.length && matchingParent; ++i) {
            if (!parent.isEqualNode(state[i].parentNode)) {
              matchingParent = false;
            }
          }
          // If all of the parents of the td's matching they are all in the same row
          singleRow = matchingParent;
        }

        // If a single cell isn't selected see if the cursor is within a cell
        if (!singleCell && state.length === 0) {
          tableCell = ed.dom.getParent(ed.selection.getNode(), 'td');
          if (tableCell) {
            // If the cursor is within a cell a single cell, a single row is selected inherently
            singleCell = true;
            singleRow = true;
            mergedCell = tableCell.rowSpan > 1 || tableCell.colSpan > 1;
          }
        }

        SPTinyMCEInterface.signalCursorInMergedCell(mergedCell);
        SPTinyMCEInterface.signalCursorInSingleCell(singleCell);
        SPTinyMCEInterface.signalCursorInSingleRow(singleRow);

        // Lists
        listNode = ed.dom.getParent(element, 'ul,ol');

        // Bullet (Unordered) List
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
    /**
     * Toggles bold on the editor
     * @param {Boolean} bBold Whether to toggle bold on/off
     */
    toggleBold: function (bBold) {
      this._editor.execCommand('bold', bBold);
    },

    /**
     * Toggles italic on the editor
     * @param {Boolean} bItalic Whether to toggle italic on/off
     */
    toggleItalic: function (bItalic) {
      this._editor.execCommand('italic', bItalic);
    },

    /**
     * Toggles underline on the editor
     * @param {Boolean} bULine Wether to toggle underline on/off
     */
    toggleUnderline: function (bULine) {
      this._editor.execCommand('underline', bULine);
    },

    /**
     * Toggles strikethough on the editor
     * @param {Boolean} bStriked Whether to toggle strikethrough on/off
     */
    toggleStrikethrough: function (bStriked) {
      this._editor.execCommand('strikethrough', bStriked);
    },

    /**
     * Sets the current alignment on the editor
     * @param {String} alignment The alignment to set on the editor
     */
    setAlign: function (alignment) {
      // Clear out any alignments that have been set with justify none command
      this._editor.execCommand('justifynone');
      this._editor.execCommand('justify' + alignment);
    },

    /**
     * Decreases the current indent level
     */
    decreaseIndent: function () {
      this._editor.execCommand('outdent');
    },

    /**
     * Increases the current indent level
     */
    increaseIndent: function () {
      this._editor.execCommand('indent');
    },

    /**
     * Inserts a horizontal rule
     */
    insertHorizontalRule: function () {
      this._editor.execCommand('InsertHorizontalRule', false, true);
    },

    /**
     * Clears the formatting of the current selection
     */
    clearFormatting: function () {
      var ed = this._editor;
      ed.execCommand('RemoveFormat');
			// Clear out any alignment
      ed.execCommand('justifynone');
    },

    /**
     * Sets the font color to the given font color
     * @param {String} color The font color to set
     */
    setFontColor: function (color) {
      if (color === '') {
        this._editor.formatter.remove('forecolor');
      } else {
        this._editor.execCommand('ForeColor', false, color);
      }
    },

    /**
     * Sets the hilite color to the given color
     * @param {String} color The hiliTe color to set
     */
    setHilightColor: function (color) {
      if (color === '') {
        this._editor.formatter.remove('hilitecolor');
      } else {
        this._editor.execCommand('HiliteColor', false, color);
      }
    },

    /**
     * Toggles bullet list mode on/off
     * @param {Boolean} bInList Whether to toggle bullet list mode on/off
     */
    bulletList: function (bInList) {
      this._editor.execCommand('InsertUnorderedList', false, bInList);
    },

    /**
     * Toggles numbered list mode on/off
     * @param {Boolean} bInList Whether to toggle number list mode on/off
     */
    numberList: function (bInList) {
      this._editor.execCommand('InsertOrderedList', false, bInList);
    },

    /**
     * Sets the font family
     * @param {String} font The font family to use
     */
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

    /**
     * Sets the font size
     * @param {Number} size The font size to use
     */
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

    /**
     * Loads the default font settings and applies them to the iframe's body
     * @param {JSON} fontJSON JSON object containing the default font family and size information to set
     */
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

    /**
     * The text color to use when in edit mode
     * @type {String}
     */
    _textEditColor: '',

    /**
     * The text color to use when in readonly mode
     * @type {String}
     */
    _textReadOnlyColor: '',

    /**
     * The window color to use when in readonly mode
     * @type {String}
     */
    _windowReadOnlyColor: '',

    /**
     * The window color to use when in edit mode
     * @type {String}
     */
    _windowEditColor: '',

    /**
     * Loads the client's palette settings into the editor
     * @param {String} windowEdit The window color for edit mode
     * @param {String} windowReadOnly The window color for readonly mode
     * @param {String} textEdit The text color for edit mode
     * @param {String} textReadOnly The text color for readonly mode
     */
    loadPalette: function (windowEdit, windowReadOnly, textEdit, textReadOnly) {
      var bodyClass = '.tinymce-native', $editorBody;
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

    /**
     * Whether or not there is a currently a row on the TinyMCE clipboard that can be pasted
     * @type {Boolean}
     */
    _hasRowToPaste: false,

    /**
     * Executes the provided table command and updates whether a row is available for pasting accordingly
     * @param {String} cmd The table command to execute
     */
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

      SPTinyMCEInterface.signalHasRowToPaste(this._hasRowToPaste);
    },

    /**
     * Creates a SeapineTable border from the provided JSON border information
     * @param {JSON} jsonBorder JSON object containing the border infromation
     * @returns {SeapineTable.Border} The border object
     */
    getBorderFromJSON: function (jsonBorder) {
      var border, spTablePlugin = this._editor.plugins.seapinetable;
      if (jsonBorder) {
        border = new spTablePlugin.Border(jsonBorder['width'], jsonBorder['color']);
      } else {
        border = new spTablePlugin.Border(0);
      }
      return border;
    },

    /**
     * Inserts a new table or applies different settings to the current table in the editor
     * @param {JSON} json JSON object containing the table information to insert or apply
     * @param {Boolean} insertTable Whether to insert a new table or apply the information to the current table
     */
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

        // No borders provided, called with none set for borders
        if (!borders) {
          borders = {};
        }
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

    /**
     * Applies the given properties to the current row in the editor
     * @param {JSON} json JSON object containing the properties to set on the current row
     */
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

        // No borders provided, called with none set for borders
        if (!borders) {
          borders = {};
        }
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

    /**
     * Applies the given cell properties to the current cell in the editor
     * @param {JSON} json JSON object containing the properties to set on the current cell
     */
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
        // No borders provided, called with none set for borders
        if (!borders) {
          borders = {};
        }
        topBorder = this.getBorderFromJSON(borders['top']);
        leftBorder = this.getBorderFromJSON(borders['left']);
        rightBorder = this.getBorderFromJSON(borders['right']);
        bottomBorder = this.getBorderFromJSON(borders['bottom']);

        rowBorders = new spTablePlugin.CellBorders(leftBorder, topBorder, rightBorder, bottomBorder);
        alignment = new spTablePlugin.Alignment(json['alignment'], json['alignmentV']);

        spTablePlugin.saveCellProperties(this._cachedCellElement, rowBorders, cellMargins, alignment, json['bgColor']);
      }

    },

    /**
     * Determines and emits a signal to the interface containing the properties of the currently selected table
     */
    requestTableProperties: function () {

      var ed = this._editor, spTablePlugin = ed.plugins.seapinetable,
          json = {}, jsonBorders, tableBorders,
          selectedNode, tableElement, $tableElement, $cells,
          cellSpacing, alignment, margins, backgroundColor, borderStyle,
          topBorder, leftBorder, bottomBorder, rightBorder, horizontalBorder, verticalBorder;

      selectedNode = ed.selection.getNode();
      tableElement = ed.dom.getParent(selectedNode, 'table');
      this._cachedTableElement = tableElement;

      if (tableElement && spTablePlugin) {
        $tableElement = $(tableElement);
        $cells = $tableElement.find('td');

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
        backgroundColor = $cells.attr('bgColor') || '#ffffff'; // TODO: RGBtoHex?
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

    /**
     * Determines and emits a signal to the interface containing the properties of the currently selected row
     */
    requestRowProperties: function () {

      // console.log('requestRowProperties');

      var ed = this._editor, spTablePlugin = ed.plugins.seapinetable,
          json = {}, jsonBorders, rowBorders,
          selectedNode, rowElement, $rowElement, $cells,
          cellSpacing, margins, borderStyle,
          topBorder, leftBorder, bottomBorder, rightBorder, verticalBorder;

      selectedNode = ed.selection.getNode();
      rowElement = ed.dom.getParent(selectedNode, 'tr');
      this._cachedRowElement = rowElement;

      if (rowElement && spTablePlugin) {
        $rowElement = $(rowElement);
        $cells = $rowElement.find('td');

        json['borders'] = {};
        json['cellMargins'] = {};
        jsonBorders = json['borders'];

        json['alignment'] = $cells.attr('align') || 'left';
        json['alignmentV'] = $cells.attr('vAlign') || 'middle';
        json['bgColor'] = $cells.attr('bgColor') || '#ffffff'; // TODO: RGBtoHex?

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

    /**
     * Determines and emits a signal to the interface containing the properties of the currently selected cell
     */
    requestCellProperties: function () {

      // console.log('requestCellProperties');

      var ed = this._editor, spTablePlugin = ed.plugins.seapinetable,
          json = {}, jsonBorders, cellBorders,
          selectedNode, cellElement, $cellElement,
          margins, borderStyle,
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
    /**
     * Tells the editor to perform an undo
     */
    undo: function () {
      this._editor.execCommand('Undo');
    },

    /**
     * Tells the editor to perform a redo
     */
    redo: function () {
      this._editor.execCommand('Redo');
    },

    /**
     * Tells the editor to select all of its contents
     */
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
      return q && q.length ? q[0] : null;
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

    /**
     * Tells the editor to unlink the current link
     */
    unlink: function () {
      this._editor.execCommand('unlink', true);
    },

    /**
     * Tells the editor to select the current link
     */
    selectLink: function () {
      var ed = this._editor,
          selectedNode, anchorNode;

      selectedNode = ed.selection.getNode();
      anchorNode = this.findClosestAnchorNode($(selectedNode));

      if (anchorNode) {
        ed.selection.select(anchorNode);
      }
    },

    /**
     * Determines the URL and emits a signal to the interface so the client can open the current link.
     */
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

    /**
     * Determines the information for inserting or editing a link for the current location and
     * emits a corresponding signal to the interface.
     */
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

    /**
     * Inserts a link in the editor with the provided information
     * @param {String} url The URL to link to
     * @param {String} displayText The text to display for the link
     */
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
    /**
     * Inserts an image into the editor
     * @param {String} imgSrc The HTML to insert for the iamge
     */
    insertImage: function (imgSrc) {
      this._editor.execCommand('mceInsertContent', false, imgSrc);
    },

    /**
     * Reloads a provided image in the editor by cachebustering the image
     * @param {String} imgSrc The image source that needs to be reloaded
     */
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

    /**
     * Helper function to escape a regular expression
     * @param {String} str The regular expression string to escape
     * @returns {String} The escaped regular expression string
     */
    escapeRegEg: function (str) {
      return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    },

    /**
     * Function that sets up callbacks so a signal is emitted to the interface when an image is successfully loaded
     */
    detectImagesLoaded: function () {
      var editor = this._editor,
        bodyClass = '.tinymce-native', $images, waitImgDone;

      $images = $('#content_ifr').contents().find(bodyClass).find('img');

      /**
       * Function called when an image has been loaded by the browser
       * @param {String} loadedImg The image that was loaded
       * @param {Boolean} bWasError Whether there was an error loading the image
       */
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

    /**
     * Emits a signal to the interface containing the information about the currently selected image to edit or resize
     * @param {Boolean} bForResize Whether to emit the signal for an image edit or image resize
     */
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

    /**
     * Sets the size of the selected image in the editor
     * @param {Number} width The width to set on the image
     * @param {Number} height The height to set on the image
     */
    setEditImageSize: function (width, height) {
      if (this._cachedSelectedImage) {
        this._cachedSelectedImage.width = width;
        this._cachedSelectedImage.height = height;
        this._editor.execCommand('mceRepaint');
        this._editor.undoManager.add(); // Manually add an undo event for the resize
      }
    },

    /**
     * Changes the selected image in the editor to be the provided new image
     * @param {String} src The source of the new image
     * @param {Number} width The width to set on the image
     * @param {Number} height The height to set on the image
     */
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
    /**
     * The current width setting of the editor (-1 represents variable width)
     * @type {Number}
     */
    _cachedWidthSetting: -1,

    /**
     * Sets the editor to be a fixed width
     * @param {Number} width The fixed width to set
     */
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

    /**
     * Sets the editor to be a varaible width again by clearing the fixed width
     */
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

    /**
     * The current editor height
     * @type {Number}
     */
    _cachedEditorHeight: '',

    /**
     * Function that emits a signal to the interface when the editor's height changes
     */
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

    /**
     * Whether the editor is currently readonly
     * @type {Boolean}
     */
    _cachedReadOnly: null,

    /**
     * Sets the editor to be readonly or edit mode (if it different from the current setting)
     * @param {Boolean} bReadOnly Whether to set the editor to readonly or edit mode
     */
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

    /**
     * Pastes the provided string as text into the editor
     * @param {String} strText The text to paste into the editor
     */
    pasteText: function (strText) {
      this._editor.execCommand('mceInsertContent', false, strText);
    },

    insertText: function (strText) {
      this._editor.selection.collapse();
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
