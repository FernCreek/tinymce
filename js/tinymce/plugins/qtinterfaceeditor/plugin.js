/**
 * plugin.js
 * Plugin to interface with the TestTrack native client's Qt interface when actively editing TinyMCE.
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
   * TinyMCE plugin for integration with our Qt Interface for editing.
   */
  tinymce.create('tinymce.plugins.QtInterfaceEditorPlugin', {

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
     * Stores a bookmark for the selection when a drag is initiated from our editor. If the drop is internal, this may
     * be needed to re-select the correct selection if the user dragged over another editor between drag and drop.
     * @type {Object} bookmark object
     */
    _bookmarkDragStart: null,

    /**
     * Constructor that takes in an editor instance
     * @param {tinymce.Editor} ed The editor instance to use.
     * @constructor
     */
    QtInterfaceEditorPlugin: function (ed) {
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
            this.plugins.qtinterfaceeditor.setBookmark(this.selection.getBookmark(2));
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
          this.plugins.qtinterfaceeditor.setBookmark(null);
        }
      });
    },

    /**
     * Callback for when the node changes
     * @param element
     */
    nodeChanged: function (element) {
      var state = false, foundIt = false,
          listNode, parent,
          supFontSizes = this._supportedFontSizes,
          i, tableCell, ed = this._editor,
          singleCell = false, singleRow = false,
          mergedCell = false, matchingParent,
          alignments = 0, lastAlignment = '', familyAndSize;

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

        // Font family and size, see the Seapine plugin for how this is determined.

        familyAndSize = ed.determineCurrentFontAndSize(element);
        state = familyAndSize.fontFamily;
        if (state === ed._fontValues.defaultFont) {
          // No fonts are specified, this must bhe the default font only
          SPTinyMCEInterface.signalCursorDefaultFontFamily();
        } else if (state === ed._fontValues.multipleFonts) {
          SPTinyMCEInterface.signalCursorFontFamily(0);
        } else {
          SPTinyMCEInterface.signalCursorFontFamily(state);
        }

        state = familyAndSize.fontSize;
        // There is a valid font size and there are not multiple fonts selected
        if (state !== ed._fontValues.multipleFonts) {
          foundIt = false;
          for (i = 0; i < supFontSizes.length && !foundIt; ++i) {
            if (state === supFontSizes[i].name || state === supFontSizes[i].ptvalue) {
              state = supFontSizes[i].ptvalue.replace(/pt/, '');
              foundIt = true;
            }
          }
        }

        if (state === ed._fontValues.defaultFont) {
          // The default font size is being used, no other size is specified
          SPTinyMCEInterface.signalCursorDefaultFontSize();
        } else if (state === ed._fontValues.multipleFonts) {
          SPTinyMCEInterface.signalCursorFontSize(0);
        } else {
          SPTinyMCEInterface.signalCursorFontSize(state);
        }

        // Images
        state = element.tagName === 'IMG';
        SPTinyMCEInterface.signalCursorOnImage(state);
        this._cachedSelectedImage = state ? element : null;

        // Insert/Edit Table
        parent = ed.dom.getParent(element, 'td,th,caption');
        state = (ed.dom.getParent(ed.selection.getStart(true), 'table') || !!parent);

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
            if (parent.rowIndex !== state[i].parentNode.rowIndex) {
              matchingParent = false;
            }
          }
          // If all of the parents of the td's matching they are all in the same row
          singleRow = matchingParent;
        }

        // If a single cell isn't selected see if the cursor is within a cell
        this._cachedCellElement = null;
        if (!singleCell && state.length === 0) {
          tableCell = element.nodeName === 'TD' ? element : ed.dom.getParent(element, 'td');
          if (tableCell) {
            // If the cursor is within a cell a single cell, a single row is selected inherently
            singleCell = true;
            singleRow = true;
            mergedCell = tableCell.rowSpan > 1 || tableCell.colSpan > 1;
            // Because we cannot trust the selection.getNode() in requestCellProperties, cache the selection now.
            this._cachedCellElement = tableCell;
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

        // Tell the base qtinterface plugin to handle the resizing
        this.editorResized();

        SPTinyMCEInterface.signalUndoAvailable(ed.undoManager.hasUndo());
        SPTinyMCEInterface.signalRedoAvailable(ed.undoManager.hasRedo());
        SPTinyMCEInterface.signalCursorHasSelection(ed.selection.getContent().length > 0);
        // console.log('UndoManager HasUndo: ' + ed.undoManager.hasUndo());
        // console.log('UndoManager HasRedo: ' + ed.undoManager.hasRedo());
        // console.log('Selection: ' + ed.selection.getContent());
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
      var height, doc = this._editor.getDoc();
      if (doc && doc.body) {
        height = doc.body.offsetHeight;
        if (height !== this._cachedEditorHeight) {
          this._cachedEditorHeight = height;
          SPTinyMCEInterface.signalEditorHeightChanged(height);
        }
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
      var ed = this._editor;
      ed.undoManager.transact(function () {
        // Clear out any alignments that have been set with justify none command
        ed.execCommand('justifynone');
        ed.execCommand('justify' + alignment);
      });
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
      ed.undoManager.transact(function () {
        ed.execCommand('RemoveFormat');
        // Clear out any alignment
        ed.execCommand('justifynone');
      });
    },

    /**
     * Removes the given format from the current selection.
     * @param {String} format The format to remove
     */
    removeFormat: function (format) {
      var ed = this._editor;
      ed.undoManager.transact(function () {
        ed.focus();
        ed.formatter.remove(format, {value: null}, null, true);
        ed.nodeChanged();
      });
    },

    /**
     * Applies the given color format to the current selection.
     * @param {String} format The format to apply
     * @param {String} value The value to apply
     */
    applyFormat: function (format, value) {
      var ed = this._editor;
      ed.undoManager.transact(function () {
        ed.focus();
        ed.formatter.remove(format, {value: null}, null, true);
        ed.formatter.apply(format, {value: value});
        ed.nodeChanged();
      });
    },

    /**
     * Function to set either the font or background color
     * @param {String} color The color to set
     * @param {Boolean} bForFont True to set the font color, false to set the background color
     */
    setColor: function (color, bForFont) {
      var styleColorStr = bForFont ? 'forecolor' : 'hilitecolor';
      if (color === '') {
        this.removeFormat(styleColorStr);
      } else {
        // They are setting a color besides the default go ahead and apply it
        this.applyFormat(styleColorStr, color);
      }
    },

    /**
     * Sets the font color to the given font color
     * @param {String} color The font color to set
     */
    setFontColor: function (color) {
      this.setColor(color, true);
    },

    /**
     * Sets the hilite color to the given color
     * @param {String} color The hilite color to set
     */
    setHilightColor: function (color) {
      this.setColor(color, false);
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
     * Sets the font
     * @param {JSON} fontJSON JSON object containing the font information to set
     */
    setFont: function (fontJSON) {
      var ed = this._editor, family = fontJSON['family'], size = fontJSON['ptSize'], bold = fontJSON['bold'],
        italic = fontJSON['italic'], underline = fontJSON['underline'], strikethrough = fontJSON['strikethrough'];
      ed.undoManager.transact(function () {
        // Set the font family
        ed.formatter.remove('removefontname', {value: null}, null, true);
        if (family) {
          ed.execCommand('FontName', false, family);
        }

        // Set the font size
        ed.formatter.remove('removefontsize', {value: null}, null, true);
        if (size) {
          ed.execCommand('FontSize', false, size + 'pt');
        }

        // Set the other style properties
        if (ed.queryCommandState('bold') !== bold) {
          ed.execCommand('bold', bold);
        }
        if (ed.queryCommandState('italic') !== italic) {
          ed.execCommand('italic', italic);
        }
        if (ed.queryCommandState('underline') !== underline) {
          ed.execCommand('underline', underline);
        }
        if (ed.queryCommandState('strikethrough') !== strikethrough) {
          ed.execCommand('strikethrough', strikethrough);
        }
      });
    },

    /**
     * Sets the font family
     * @param {String} family The font family to use
     */
    setFontFamily: function (family) {
      var ed = this._editor;
      if (family) {
        ed.undoManager.transact(function () {
          ed.formatter.remove('removefontname', {value: null}, null, true);
          ed.execCommand('FontName', false, font);
        });
      } else {
        ed.undoManager.transact(function () {
          ed.formatter.remove('removefontname', {value: null}, null, true);
        });
      }
    },

    /**
     * Sets the font size
     * @param {Number} size The font size to use
     */
    setFontSize: function (size) {
      var ed = this._editor;
      if (size) {
        ed.undoManager.transact(function () {
          ed.formatter.remove('removefontsize', {value: null}, null, true);
          ed.execCommand('FontSize', false, size + 'pt');
        });
      } else {
        ed.undoManager.transact(function () {
          ed.formatter.remove('removefontsize', {value: null}, null, true);
        });
      }
    },

    /**
     * Loads the default font settings and applies them to the iframe's body
     * @param {JSON} fontJSON JSON object containing the default font family and size information to set
     */
    loadDefaultFont: function (fontJSON) {
      // Save off these defaults for span comparison when text is copy/pasted with default font settings
      this._qtDefaultFontFamily = fontJSON['family'];
      this._qtDefaultFontSize = fontJSON['ptSize'];
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
     * @param {JSON} jsonBorder JSON object containing the border information
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

        cellMargins = new spTablePlugin.CellMargins(json['cellMargins']['top'], json['cellMargins']['bottom'],
                                                    json['cellMargins']['left'], json['cellMargins']['right']);

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
        cellMargins = new spTablePlugin.CellMargins(json['cellMargins']['top'], json['cellMargins']['bottom'],
                                                    json['cellMargins']['left'], json['cellMargins']['right']);

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
        cellMargins = new spTablePlugin.CellMargins(json['cellMargins']['top'], json['cellMargins']['bottom'],
                                                    json['cellMargins']['left'], json['cellMargins']['right']);
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
        backgroundColor = ($cells.attr('bgColor') || '#ffffff').toUpperCase(); // TODO: RGBtoHex?
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

        margins = spTablePlugin.getTableMarginsArray($tableElement);
        json['cellMargins']['top'] = margins[spTablePlugin.tableMargins.kTop];
        json['cellMargins']['bottom'] = margins[spTablePlugin.tableMargins.kBottom];
        json['cellMargins']['left'] = margins[spTablePlugin.tableMargins.kLeft];
        json['cellMargins']['right'] = margins[spTablePlugin.tableMargins.kRight];

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
          margins, borderStyle,
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
        json['bgColor'] = ($cells.attr('bgColor') || '#ffffff').toUpperCase(); // TODO: RGBtoHex?

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

        margins = spTablePlugin.getRowMarginsArray($rowElement);
        json['cellMargins']['top'] = margins[spTablePlugin.tableMargins.kTop];
        json['cellMargins']['bottom'] = margins[spTablePlugin.tableMargins.kBottom];
        json['cellMargins']['left'] = margins[spTablePlugin.tableMargins.kLeft];
        json['cellMargins']['right'] = margins[spTablePlugin.tableMargins.kRight];
        json['overrideMargins'] = spTablePlugin.isPaddingExplicitlySet($rowElement);

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

      cellElement = this._cachedCellElement;
      if (cellElement && spTablePlugin) {
        $cellElement = $(cellElement);

        json['borders'] = {};
        json['cellMargins'] = {};
        jsonBorders = json['borders'];

        json['alignment'] = cellElement.align || 'left';
        json['alignmentV'] = cellElement.vAlign || 'middle';
        json['bgColor'] = (cellElement.bgColor || '#ffffff').toUpperCase(); // TODO: RGBtoHex?;

        topBorder = spTablePlugin.getBorderForCell(ed, $cellElement, 'top');
        jsonBorders['top'] = topBorder;
        leftBorder = spTablePlugin.getBorderForCell(ed, $cellElement, 'left');
        jsonBorders['left'] = leftBorder;
        bottomBorder = spTablePlugin.getBorderForCell(ed, $cellElement, 'bottom');
        jsonBorders['bottom'] = bottomBorder;
        rightBorder = spTablePlugin.getBorderForCell(ed, $cellElement, 'right');
        jsonBorders['right'] = rightBorder;

        cellBorders = new spTablePlugin.RowBorders(leftBorder, topBorder, rightBorder, bottomBorder);

        margins = spTablePlugin.getElementMarginsArray($cellElement);
        json['cellMargins']['top'] = margins[spTablePlugin.tableMargins.kTop];
        json['cellMargins']['bottom'] = margins[spTablePlugin.tableMargins.kBottom];
        json['cellMargins']['left'] = margins[spTablePlugin.tableMargins.kLeft];
        json['cellMargins']['right'] = margins[spTablePlugin.tableMargins.kRight];
        json['overrideMargins'] = spTablePlugin.doesCellOverrideMargins($cellElement);

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

    /**
     * Tells the editor to delete the current selection
     */
    deleteSelection: function () {
      this._editor.execCommand('delete');
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
        return this.nodeType !== Node.TEXT_NODE && this.tagName !== 'A';
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
      var ed = this._editor, linkHTML, $link;

      if (url.length === 0) { // Remove the link
        ed.execCommand('mceInsertContent', false, displayText, {skip_focus: true});
      } else {
        linkHTML = ed.dom.createHTML('a', {
          href: url.replace(' ', '%20'),
          title: 'Open ' + url,
          target: '_blank',
          id: 'tinysc-link'
        }, displayText);

        // ed.restoreSelection();
        ed.execCommand('mceInsertContent', false, linkHTML, {skip_focus: true});
        $link = $(ed.dom.select('#tinysc-link'));
        if ($link.length === 1) {
          ed.selection.setCursorLocation($link[0], 1);
        }
        $link.removeAttr('id');
      }

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
          SPTinyMCEInterface.signalResponseEditImageSize(json);
        } else {
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
    // Drag and drop interactions
    //////////////////////////////////////////////////////////////////////////

    /**
     * Modifies the TinyMCE editor's body tag to prevent drag events from being handled natively
     */
    bypassDragEvents: function () {
      var bodyClass = '.tinymce-native', $editorBody, self = this;
      $editorBody = $('#content_ifr').contents().find(bodyClass);
      $editorBody.on('dragstart', function (event) {
        event.preventDefault();
        event.stopPropagation();
        return self.onDragStart();
      });
    },

    /**
     * Initiates a bypassed drag operation, allowing the host application to handle it instead of the browser
     * @return {Boolean} Always returns false, so the ondragstart event is killed
     */
    onDragStart: function () {
      var html = '', text = '';
      if (this._editor) {
        this._bookmarkDragStart = this._editor.selection.getBookmark();
        html = this._editor.selection.getContent();
        text = this._editor.selection.getContent({ format: 'text' });
        SPTinyMCEInterface.signalStartDrag(html, text);
      }
      return false;
    },

    /**
     * Handles dropped HTML that was originally dragged from this same editor
     * @param {String} strHTML The HTML content that was dragged within the editor
     * @param {Number} posX The x-axis position of the cursor
     * @param {Number} posY The y-axis position of the cursor
     */
    handleInternalDrop: function (strHTML, posX, posY) {
      var rng, ed = this._editor;
      if (strHTML && posX && posY) {
        if (this._bookmarkDragStart) {
          ed.selection.moveToBookmark(this._bookmarkDragStart);
          this._bookmarkDragStart = null;
        }
        rng = tinymce.dom.RangeUtils.getCaretRangeFromPoint(posX, posY, this._editor.getDoc());
        if (rng) {
          ed.undoManager.transact(function () {
            ed.execCommand('delete');
            ed.selection.setRng(rng);
            ed.execCommand('mceInsertClipboardContent', false, { content: strHTML });
          });
        }
      }
    },

    //////////////////////////////////////////////////////////////////////////
    // Cut/Copy Handling
    //////////////////////////////////////////////////////////////////////////

    /**
     * Modifies the TinyMCE editor's body tag to prevent cut/copy events from being handled natively
     */
    bypassCutCopyEvents: function () {
      var bodyClass = '.tinymce-native', $editorBody, self = this;
      $editorBody = $('#content_ifr').contents().find(bodyClass);
      $editorBody.on('cut', function (event) {
        event.preventDefault();
        event.stopPropagation();
        return self.onCut();
      });
      $editorBody.on('copy', function (event) {
        event.preventDefault();
        event.stopPropagation();
        return self.onCopy();
      });
    },

    /**
     * Initiates a bypassed cut operation, allowing the host application to handle it instead of the browser
     * @return {Boolean} Always returns false, so the cut event is killed
     */
    onCut: function () {
      var html = '', text = '';
      if (this._editor) {
        html = this._editor.selection.getContent();
        text = this._editor.selection.getContent({ format: 'text' });
        SPTinyMCEInterface.signalCopyToClipboard(html, text);
        this._editor.execCommand('delete');
      }
      return false;
    },

    /**
     * Initiates a bypassed copy operation, allowing the host application to handle it instead of the browser
     * @return {Boolean} Always returns false, so the copy event is killed
     */
    onCopy: function () {
      var html = '', text = '';
      if (this._editor) {
        html = this._editor.selection.getContent();
        text = this._editor.selection.getContent({ format: 'text' });
        SPTinyMCEInterface.signalCopyToClipboard(html, text);
      }
      return false;
    },

    //////////////////////////////////////////////////////////////////////////
    // Editor configuration settings
    /////////////////////////////////////////////////////////////////////////

    /**
     * Pastes the provided string as text into the editor
     * @param {String} strText The text to paste into the editor
     */
    pasteText: function (strText) {
      this._editor.execCommand('mceInsertClipboardContent', false, { text: strText });
    },

    /**
     * Pastes the provided HTML string into the editor
     * @param {String} strHTML The HTML to paste into the editor
     */
    pasteHTML: function (strHTML) {
      var ed = this._editor, self = this;
      ed.undoManager.transact(function () {
        ed.execCommand('mceInsertClipboardContent', false, { content: strHTML });
        self.removeCommentsFromContent();
        self.removeAppleSpace();
      });
    },

    /**
     * Inserts the provided string as text into the editor
     * @param {String} strText The text to insert into the editor
     */
    insertText: function (strText) {
      var ed = this._editor;
      ed.undomanager.transact(function () {
        ed.selection.collapse();
        ed._editor.execCommand('mceInsertClipboardContent', false, { text: strText });
      });
    },

    /**
     * Inserts the provided HTML string into the editor
     * @param {String} strHTML The HTML to insert into the editor
     */
    insertHTML: function (strHTML) {
      var ed = this._editor, self = this;
      ed.undoManager.transact(function () {
        ed.selection.collapse();
        ed.execCommand('mceInsertClipboardContent', false, { content: strHTML });
        self.removeCommentsFromContent();
        self.removeAppleSpace();
      });
    },

    /**
     * Recursively removes comment nodes from the given node and its children
     * @param {HTMLElement} node The node to remove comment nodes from
     */
    removeCommentNodes: function (node) {
      var childNodes = node.childNodes, i;
      if (node.nodeType === Node.COMMENT_NODE) {
        $(node).remove();
      }
      if (childNodes) {
        for (i = 0; i < childNodes.length; ++i) {
          this.removeCommentNodes(childNodes[i]);
        }
      }
    },

    /**
     * Removes comment nodes from the editors content.
     */
    removeCommentsFromContent: function () {
      var bodyClass = '.tinymce-native', contents, i;
      contents = $('#content_ifr').contents().find(bodyClass).contents();
      for (i = 0; i < contents.length; ++i) {
        this.removeCommentNodes(contents[i]);
      }
    },

    /**
     * Removes 'Apple-converted-space' class that Qt clipboard inserts
     */
    removeAppleSpace: function () {
      var bodyClass = '.tinymce-native', appleSpaceClass = 'Apple-converted-space',
          ed = this._editor, $apples, i;
      $apples = $('#content_ifr').contents().find(bodyClass).contents().find('.' + appleSpaceClass);
      if ($apples.length && ed) {
        ed.undoManager.transact(function () {
          // Remove the Apple-converted-space class
          $apples.removeClass(appleSpaceClass);
          for (i = 0; i < $apples.length; ++i) {
            // Remove any now empty spans after removing the class
            ed.formatter.remove('emptyspan', null, $apples[i]);
          }
        });
      }
    },

    /**
     * Returns information about the plugin as a name/value array.
     * The current keys are longname, author, authorurl, infourl and version.
     *
     * @return {Object} Name/value array containing information about the plugin.
     */
    getInfo: function () {
      return {
        longname: 'Qt Integration plugin for Editing',
        author: 'Seapine Software Inc',
        authorurl: 'http://www.seapine.com',
        infourl: 'http://www.seapine.com',
        version: '0.1'
      };
    }

  });

  // Register plugin
  tinymce.PluginManager.add('qtinterfaceeditor', tinymce.plugins.QtInterfaceEditorPlugin);
})();
