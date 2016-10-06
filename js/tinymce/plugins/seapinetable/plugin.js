/**
 * plugin.js
 * Plugin for handling with enhanced table functionality in tinyMCE.
 *
 * Copyright 2016, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */

/* global tinymce, $ */

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
   * TinyMCE plugin for interacting with tables.
   */
  tinymce.create('tinymce.plugins.SeapineTablePlugin', {

    SeapineTablePlugin: function (ed) {
    },

    tableConstants: {
      kDefaultCellMargin: 3,
      kDefaultMaxMargin: 300
    },

    tableMargins: {
      kTop: 0,
      kBottom: 1,
      kLeft: 2,
      kRight: 3
    },

    /**
     * Creates a Border object.
     *
     * @param {Number} width The border width in px.
     * @param {String} color The border color in hex.
     * @constructor
     */
    Border: function (width, color) {
      if (width !== null && width !== undefined) {
        this.width = width;
      } else {
        this.width = 1;
      }
      if (color) {
        this.color = color;
      } else {
        this.color = '#000000';
      }
    },

    /**
     * Creates a CellBorders object.
     * @param {Border} leftBorder The left border
     * @param {Border} topBorder The top border
     * @param {Border} rightBorder The right border
     * @param {Border} bottomBorder The bottom border
     * @constructor
     */
    CellBorders: function (leftBorder, topBorder, rightBorder, bottomBorder) {
      this.left = leftBorder;
      this.top = topBorder;
      this.right = rightBorder;
      this.bottom = bottomBorder;
    },

    /**
     * Creates a RowBorders object.
     * @param {Border} leftBorder The left border
     * @param {Border} topBorder The top border
     * @param {Border} rightBorder The right border
     * @param {Border} bottomBorder The bottom border
     * @param {Border} verticalBorder The the vertical border between the columns
     * @constructor
     */
    RowBorders: function (leftBorder, topBorder, rightBorder, bottomBorder, verticalBorder) {
      this.left = leftBorder;
      this.top = topBorder;
      this.right = rightBorder;
      this.bottom = bottomBorder;
      this.vertical = verticalBorder;
    },

    /**
     * Creates a TableBorders object.
     * @param {Border} leftBorder The left border
     * @param {Border} topBorder The top border
     * @param {Border} rightBorder The right border
     * @param {Border} bottomBorder The bottom border
     * @param {Border} verticalBorder The vertical border between the columns
     * @param {Border} horizontalBorder The horizontal border between the rows
     * @constructor
     */
    TableBorders: function (leftBorder, topBorder, rightBorder, bottomBorder, verticalBorder, horizontalBorder) {
      this.left = leftBorder;
      this.top = topBorder;
      this.right = rightBorder;
      this.bottom = bottomBorder;
      this.vertical = verticalBorder;
      this.horizontal = horizontalBorder;
    },

    /**
     * Creates a cell margins object
     * @param {Number} topMargin The top margin
     * @param {Number} bottomMargin The bottom margin
     * @param {Number} leftMargin The left margin
     * @param {Number} rightMargin The right margin
     * @constructor
     */
    CellMargins: function (topMargin, bottomMargin, leftMargin, rightMargin) {
      this.top = topMargin;
      this.bottom = bottomMargin;
      this.left = leftMargin;
      this.right = rightMargin;

      this.isValid = function () {
        var i, margins = [this.top, this.right, this.bottom, this.left], isValid = true;
        for (i = 0; isValid && i < margins.length; ++i) {
          if (typeof margins[i] !== 'number') {
            if (!isFinite(margins[i]) || isNaN(parseInt(margins[i], 10))) {
              isValid = false;
            }
          } else if (margins[i] < 0) {
            isValid = false;
          }
        }
        return isValid;
      };

      /**
       * Determines the CSS string for this cells margins
       * @param {Number} defaultMargin The default margin to use should one of the margins be invalid
       * @returns {string} The CSS string for this cells margins
       */
      this.getCSSString = function (defaultMargin) {
        var i, paddingStr=  '', margins = [this.top, this.right, this.bottom, this.left];
        for (i = 0; i < margins.length; ++i) {
          if (typeof margins[i] !== 'number') {
            if (!isFinite(margins[i]) || isNaN(parseInt(margins[i], 10))) {
              margins[i] = '' + defaultMargin;
            }
          }
          paddingStr += margins[i] + 'px ';
        }
        return paddingStr;
      };

    },

    /**
     * Creates an alignment object
     * @param {String} horizontalAlignment The horizontal alignment
     * @param {String} verticalAlignment The vertical alignment
     * @constructor
     */
    Alignment: function (horizontalAlignment, verticalAlignment) {
      this.horizontal = horizontalAlignment;
      this.vertical = verticalAlignment;
    },

    /**
     * Counts the number of rows in a table.
     *
     * @param {jQuery} $table Table element.
     * @returns {Number} Count of table rows.
     */
    countTableRows: function ($table) {
      var rows = 0;
      if ($table) {
        rows = $table.find('tr').length;
      }
      return rows;
    },

    /**
     * Counts the number of columns in a table.
     * This takes into account colSpan.
     *
     * @param {jQuery} $table Table element.
     * @returns {Number} Count of table columns.
     */
    countTableColumns: function ($table) {
      var self = this,
          numColumns = 0;

      if ($table) {
        $table.find('tr').each(function () {
          numColumns = Math.max(self.countRowColumns($(this), numColumns));
        });
      }

      return numColumns;
    },

    /**
     * Counts the number of columns in a table row.
     * This takes into account colSpan.
     *
     * @param {jQuery} $row Row element.
     * @returns {Number} Count of row columns.
     */
    countRowColumns: function ($row) {
      var numColumns = 0;

      if ($row) {
        $row.find('td').each(function () {
          numColumns += $(this).prop('colSpan');
        });
      }

      return numColumns;
    },

    /**
     * Determines and applies the cell margins to the given table.
     *
     * @param {CellMargins} margins The margins to apply.
     * @param {jQuery} $table The table to apply the margins to.
     */
    applyTableMargins: function (margins, $table) {
      var $rows, $row, $cells, $cell, countRow, countCell, cssOld, cssNew;
      if (margins && $table) {
        if (this.isPaddingExplicitlySet($table)) {
          cssOld = this.getElementMarginsCSS($table);
        }
        cssNew = margins.getCSSString(this.tableConstants.kDefaultCellMargin);
        $table.css('padding', cssNew);

        // Now, process each row. Any that do not contain their own padding must be processed.
        $rows = $table.find('tr');
        for (countRow = 0; countRow < $rows.length; ++countRow) {
          $row = $($rows[countRow]);
          if (!this.isPaddingExplicitlySet($row)) { // If a row is overriding our margins, don't mess with it.
            // We know this row doesn't override our margins. So for any of its cells, check to see if they match
            // our old margins. If they do, then our margins weren't actually overridden, so apply the new margins.
            $cells = $row.find('td');
            for (countCell = 0; countCell < $cells.length; ++countCell) {
              $cell = $($cells[countCell]);
              if ((!cssOld && !this.isPaddingExplicitlySet($cell)) || this.doesCellMatchMargins($cell, cssOld)) {
                $cell.css('padding', cssNew);
              }
            }
          }
        }
      }
    },

    /**
     * Determines and applies the row margins to the given row.
     *
     * @param {CellMargins} margins The margins to apply.
     * @param {jQuery} $row The row to apply the margins to.
     */
    applyRowMargins: function (margins, $row) {
      var $cells, $cell, countCell, cssOld, cssNew;
      if ($row && margins && margins.isValid()) {
        cssOld = this.convertMarginsArrayToCSS(this.getRowMarginsArray($row));
        cssNew = margins.getCSSString(this.tableConstants.kDefaultCellMargin);
        $row.css('padding', cssNew);

        // Now, process all of the row's cells. Any that don't match the old row padding should be reset.
        $cells = $row.find('td');
        for (countCell = 0; countCell < $cells.length; ++countCell) {
          $cell = $($cells[countCell]);
          if (!cssOld || this.doesCellMatchMargins($cell, cssOld)) {
            $cell.css('padding', cssNew);
          }
        }
      }
    },

    /**
     * Determines and applies the cell margins to the given cell.
     *
     * @param {CellMargins} margins The margins to apply.
     * @param {jQuery} $cell The cell to apply the margins to.
     */
    applyCellMargins: function (margins, $cell) {
      var $row, $table, css = '';
      if ($cell && margins) {
        if (margins.isValid()) {
          css = margins.getCSSString(this.tableConstants.kDefaultCellMargin);
        } else { // Invalid margins, we need to determine the default margins, and apply them as necessary.
          $row = $cell.closest('tr');
          if (this.isPaddingExplicitlySet($row)) {
            css = this.getElementMarginsCSS($row);
          } else { // Row is not explicitly set, check the table
            $table = $cell.closest('table');
            if (this.isPaddingExplicitlySet($table)) {
              css = this.getElementMarginsCSS($table);
            }
          }
        }
        $cell.css('padding', css);
      }
    },

    /**
     * Gets the margins for the table. If the table is not explicitly set, it tries to get the margins from the rows.
     * If none of the rows match, then it gives up and returns the default table margins for a newly inserted table.
     *
     * @param {jQuery} $table The table to get the cell margins for.
     * @returns {Array.<Number>} The cell margins for the table in the order of top, bottom, left, right.
     */
    getTableMarginsArray: function ($table) {
      var $rows, $row, i, strCompare, marginDefault = this.tableConstants.kDefaultCellMargin,
        useDefaults = true, allMatch = true, margins = [];
      if ($table && $table.length === 1) {
        if (this.isPaddingExplicitlySet($table)) {
          margins = this.getElementMarginsArray($table);
          useDefaults = false;
        } else { // Padding is not set on the table element, we need to check and see if our row arrays match or not.
          $rows = $table.find('tr');
          if ($rows.length > 0) {
            // Get the first row's margins and CSS string, then compare the other rows to it to see if they match.
            $row = $($rows[0]);
            margins = this.getRowMarginsArray($row);
            if (margins && margins.length === 4) {
              strCompare = margins.toString();
              for (i = 1; allMatch && i < $rows.length; ++i) {
                $row = $($rows[i]);
                margins = this.getRowMarginsArray($row);
                if (!margins || margins.toString() !== strCompare) {
                  allMatch = false;
                }
              }
              useDefaults = !allMatch;
            }
          }
        }
      }
      return !useDefaults && margins && margins.length === 4 ? margins : [marginDefault, marginDefault, marginDefault, marginDefault];
    },

    /**
     * Gets the margins for the row. If the row is not explicitly set, it tries to get the margins set on the table.
     * If the table is not set, then it checks to see if the cells in the row match. If they match, the cell margins are
     * returned; if they do not match, then the default cell margins are returned instead.
     *
     * @param {jQuery} $row The row to get the cell margins for.
     * @returns {Array.<Number>} The cell margins for the row in the order of top, bottom, left, right.
     */
    getRowMarginsArray: function ($row) {
      var $table, $cells, $cell, i, strCompare, marginDefault = this.tableConstants.kDefaultCellMargin,
        useDefaults = true, allMatch = true, margins = [];
      if ($row && $row.length === 1) {
        if (this.isPaddingExplicitlySet($row)) {
          margins = this.getElementMarginsArray($row);
          useDefaults = false;
        } else { // Padding is not set on the row element, we need to check and see if the table is set explicitly.
          $table = $row.closest('table');
          if (this.isPaddingExplicitlySet($table)) {
            margins = this.getElementMarginsArray($table);
            useDefaults = false;
          } else { // Table is not explicitly set, look to see if our cells have matching padding styles.
            $cells = $row.find('td');
            if ($cells.length > 0) {
              // Get the first cell's margins and CSS string, then compare the other cells to it to see if they match.
              $cell = $($cells[0]);
              margins = this.getElementMarginsArray($cell);
              if (margins && margins.length === 4) {
                strCompare = margins.toString();
                for (i = 1; allMatch && i < $cells.length; ++i) {
                  $cell = $($cells[i]);
                  margins = this.getElementMarginsArray($cell);
                  if (!margins || margins.toString() !== strCompare) {
                    allMatch = false;
                  }
                }
                useDefaults = !allMatch;
              }
            }
          }
        }
      }
      return !useDefaults && margins && margins.length === 4 ? margins : [marginDefault, marginDefault, marginDefault, marginDefault];
    },

    /**
     * Determines if the given cell is overriding the rest of the table's margins or not.
     *
     * @param {jQuery} $cell The cell to query
     * @returns {Boolean} Whether the margins are explicitly overridden for the given cell
     */
    doesCellOverrideMargins: function ($cell) {
      var $row, $table, cssCell, cssDefault;
      if ($cell && $cell.length === 1 && this.isPaddingExplicitlySet($cell)) {
        cssCell = this.getElementMarginsCSS($cell);
        $row = $cell.closest('tr');
        if (this.isPaddingExplicitlySet($row)) {
          cssDefault = this.getElementMarginsCSS($row);
        } else {
          $table = $cell.closest('table');
          if (this.isPaddingExplicitlySet($table)) {
            cssDefault = this.getElementMarginsCSS($table);
          }
        }
      }
      return cssCell ? cssCell !== cssDefault : !!cssDefault;
    },

    /**
     * Determines if the given cell's padding matches the given CSS padding or not.
     *
     * @param {jQuery} $cell The cell to query
     * @param {String} cssPadding The CSS padding string to compare with the cell's padding
     * @returns {Boolean} Whether the css passed in matches the cell's padding or not
     */
    doesCellMatchMargins: function ($cell, cssPadding) {
      var cssCell, matches = true;
      if ($cell && $cell.length === 1 && this.isPaddingExplicitlySet($cell)) {
        cssCell = this.getElementMarginsCSS($cell);
        if (cssCell && cssCell !== cssPadding) {
          matches = false;
        }
      }
      return matches;
    },

    /**
     * Returns whether padding is explicitly set on an element or not.
     *
     * @param {jQuery} $element The element to query
     * @returns {Boolean} Whether padding is explicitly set or not.
     */
    isPaddingExplicitlySet: function ($element) {
      var marginNames = ['top', 'bottom', 'left', 'right'], padding,
        isExplicitlySet = false;
      if ($element && $element.length === 1) {
        padding = $element[0].style['padding'];
        if (padding) {
          isExplicitlySet = true;
        } else {
          marginNames.forEach( function (name) {
            padding = $element[0].style['padding-' + name];
            if (padding) {
              isExplicitlySet = true;
            }
          });
        }
      }
      return isExplicitlySet;
    },

    /**
     * Returns the configured margins of an element.
     *
     * @param {jQuery} $element The element to query
     * @returns {Array.<Number>} The margins for the element in the order of top, bottom, left, right.
     */
    getElementMarginsArray: function ($element) {
      var marginNames = ['top', 'bottom', 'left', 'right'], marginDefault = this.tableConstants.kDefaultCellMargin,
        padding, margin, self = this,
        margins = [];
      if ($element && $element.length === 1) {
        marginNames.forEach( function (name) {
          padding = $element.css('padding-' + name);
          margin = padding ? self.getWidthFromPxString(padding) : marginDefault;
          if (margin > self.tableConstants.kDefaultMaxMargin) {
            margin = self.tableConstants.kDefaultMaxMargin;
          }
          margins.push(margin);
        });
      } else {
        margins = [marginDefault, marginDefault, marginDefault, marginDefault];
      }
      return margins;
    },

    /**
     * Returns the configured margins of an element in a CSS string form.
     *
     * @param {jQuery} $element The element to query
     * @returns {String} The string representing the margins CSS
     */
    getElementMarginsCSS: function ($element) {
      var marginsCSS;
      if ($element && $element.length === 1) {
        marginsCSS = this.convertMarginsArrayToCSS(this.getElementMarginsArray($element));
      }
      return marginsCSS;
    },

    /**
     * Converts a margins array into a CSS string form.
     *
     * @param {Array.<Number>} marginsArray The margins array to convert
     * @returns {String} The string representing the margins CSS
     */
    convertMarginsArrayToCSS: function (marginsArray) {
      var marginsObj, marginsCSS;
      if (marginsArray && marginsArray.length === 4) {
        marginsObj = new this.CellMargins(marginsArray[this.tableMargins.kTop], marginsArray[this.tableMargins.kBottom],
                                          marginsArray[this.tableMargins.kLeft], marginsArray[this.tableMargins.kRight]);
        marginsCSS = marginsObj.getCSSString(this.tableConstants.kDefaultCellMargin);
      }
      return marginsCSS;
    },

    /**
     * Gets the border width string for the given cell.
     *
     * NOTE TTBugs #41231
     * This is needed because FireFox getComputedStyle returns an incorrect value when querying the top and left borders
     * of a cell in a table where border-collapse is on. This causes jquery to return the same incorrect value.
     *
     * Due to this we are pulling the value directly off of the style on the cell. If the borders are set not on
     * the cell elements this, and large amounts of the border styling functionality will break.
     *
     * @param {jQuery} $cell Cell selector, should only contain one HTMLElement.
     * @param {String} borderCSSStyleStr The CSS style property to get the information for.
     * @returns {String} The string containing the border width information.
     */
    getBorderWidthForCell: function ($cell, borderCSSStyleStr) {
      var borderWidth = '0px', tmpString;
      if ($cell && $cell.length === 1) {
        tmpString = $cell[0].style[borderCSSStyleStr];
        if (tmpString) {
          borderWidth = tmpString;
        } else {
          // On old tables the border may not be set on the cell itself. In this case fall back to
          // the computed value for the cell.
          borderWidth = $cell.css(borderCSSStyleStr);
        }
      }
      return borderWidth;
    },

    /**
     * Gets the border information for a particular cell
     *
     * @param {tinymce.Editor} ed Editor instance.
     * @param {jQuery} $cell Cell selector.
     * @param {String} borderStr The border to get the information for. Should be 'top' 'left' 'right' or 'bottom'.
     * @returns {TinySC.Border} The filled in border object.
     */
    getBorderForCell: function (ed, $cell, borderStr) {
      var border = new this.Border(),
          borderStyleStr,
          borderWidthStr,
          borderStyle;

      if (ed && $cell && borderStr) {

        borderStyleStr = 'border-' + borderStr + '-';
        // Please see note on getBorderWidthForCell before changing
        borderWidthStr = this.getBorderWidthForCell($cell, borderStyleStr + 'width');
        borderStyle = $cell.css(borderStyleStr + 'style');

        // Check if the border is hidden
        if (borderStyle === 'hidden' || borderStyle === 'none') {
          border.width = 0;
        } else {
          // Grab the width of the border if its not hidden
          border.width = this.getWidthFromPxString(borderWidthStr);
          if (border.width > 0) {
            // If the border has a valid width go ahead and grab the color as well
            border.color = ed.dom.toHex($cell.css(borderStyleStr + 'color')).toUpperCase();
          }
        }
      }

      return border;
    },

    /**
     * Gets the border information for a particular row
     *
     * @param {tinymce.Editor} ed Editor instance.
     * @param {jQuery} $row Row selector.
     * @param {String} borderStr The border to get the information for.
     * @returns {TinySC.Border} The filled in border object.
     */
    getBorderForRow: function (ed, $row, borderStr) {
      var border = new this.Border(),
          borderStyleStr, $cells, $cell,
          commonColor, commonWidth,
          bLeft = 'border-left-', bRight = 'border-right-',
          i, matchingBorders = true;

      if (ed && $row && borderStr) {
        borderStyleStr = 'border-' + borderStr + '-';
        $cells = $row.find('td');

        switch (borderStr) {
          case 'top':
          case 'bottom':
            // Grab the top or bottom border of all of the cells, set it if they are the same, if not use default
            $cell = $($cells[0]);
            commonColor = $cell.css(borderStyleStr + 'color');
            commonWidth = this.getBorderWidthForCell($cell, borderStyleStr + 'width');
            for (i = 1; i < $cells.length && matchingBorders; ++i) {
              $cell = $($cells[i]);
              if ($cell.css(borderStyleStr + 'color') !== commonColor ||
                  this.getBorderWidthForCell($cell, borderStyleStr + 'width') !== commonWidth) {
                matchingBorders = false;
              }
            }
            break;
          case 'right':
          case 'left':
            // Grab the right border of the furthest right or left border of the furthest left
            if (borderStr === 'right') {
              $cell = $row.find('td:last-child');
            } else {
              $cell = $row.find('td:first-child');
            }

            commonWidth = this.getBorderWidthForCell($cell, borderStyleStr + 'width');
            commonColor = $cell.css(borderStyleStr + 'color');
            break;
          case 'vertical':
            // Grab the inner borders of all of the cells and set the vertical border if they are the same
            $cell = $($cells[0]);
            commonColor = $cell.css(bRight + 'color');
            commonWidth = this.getBorderWidthForCell($cell, bRight + 'width');

            // Check the right border of all of the inner cells (except the right most)
            for (i = 1; i < $cells.length - 1 && matchingBorders; ++i) {
              $cell = $($cells[i]);
              if ($cell.css(bRight + 'color') !== commonColor ||
                  this.getBorderWidthForCell($cell, bRight + 'width') !== commonWidth) {
                matchingBorders = false;
              }
            }

            // Check the left border of all of the inner cells (except the left most)
            for (i = 1; i < $cells.length && matchingBorders; ++i) {
              $cell = $($cells[i]);
              if ($cell.css(bLeft + 'color') !== commonColor ||
                  this.getBorderWidthForCell($cell, bLeft + 'width') !== commonWidth) {
                matchingBorders = false;
              }
            }
            break;
          default:
            matchingBorders = false;
            break;
        }

        if (matchingBorders) {
          border.color = ed.dom.toHex(commonColor).toUpperCase();
          border.width = this.getWidthFromPxString(commonWidth);
        }
      }

      return border;
    },

    /**
     * Gets the border information for the given table.
     *
     * @param {tinymce.Editor} ed Editor instance.
     * @param $table {jQuery} The table selector.
     * @param {String} borderStr The border to get the information for.
     * @returns {TinySC.Border} The filled in border object.
     */
    getBorderForTable: function (ed, $table, borderStr) {
      var border = new this.Border(),
          rowBorder,
          commonColor, commonWidth,
          $rows, i,
          matchingBorders = true;

      if (ed && $table && borderStr) {
        $rows = $table.find('tr');

        switch (borderStr) {
          case 'left':
          case 'right':
            rowBorder = this.getBorderForRow(ed, $($rows[0]), borderStr);
            commonColor = rowBorder.color;
            commonWidth = rowBorder.width;
            for (i = 1; i < $rows.length - 1 && matchingBorders; ++i) {
              rowBorder = this.getBorderForRow(ed, $($rows[i]), borderStr);
              if (commonColor !== rowBorder.color || commonWidth !== rowBorder.width) {
                matchingBorders = false;
              }
            }
            break;
          case 'top':
            rowBorder = this.getBorderForRow(ed, $($rows[0]), borderStr);
            commonColor = rowBorder.color;
            commonWidth = rowBorder.width;
            break;
          case 'bottom':
            rowBorder = this.getBorderForRow(ed, $($rows[$rows.length - 1]), borderStr);
            commonColor = rowBorder.color;
            commonWidth = rowBorder.width;
            break;
          case 'horizontal':
            // Check the bottom border of all of the rows (except the most bottom)
            rowBorder = this.getBorderForRow(ed, $($rows[0]), 'bottom');
            commonColor = rowBorder.color;
            commonWidth = rowBorder.width;
            for (i = 1; i < $rows.length - 1 && matchingBorders; ++i) {
              rowBorder = this.getBorderForRow(ed, $($rows[i]), 'bottom');
              if (commonColor !== rowBorder.color || commonWidth !== rowBorder.width) {
                matchingBorders = false;
              }
            }
            // Check the top border of all of the rows (except the most top)
            for (i = 1; i < $rows.length && matchingBorders; ++i) {
              rowBorder = this.getBorderForRow(ed, $($rows[i]), 'top');
              if (commonColor !== rowBorder.color || commonWidth !== rowBorder.width) {
                matchingBorders = false;
              }
            }
            break;
          case 'vertical':
            rowBorder = this.getBorderForRow(ed, $($rows[0]), 'vertical');
            commonColor = rowBorder.color;
            commonWidth = rowBorder.width;
            // Check that the vertical border of all of the rows match
            for (i = 1; i < $rows.length && matchingBorders; ++i) {
              rowBorder = this.getBorderForRow(ed, $($rows[i]), 'vertical');
              if (commonColor !== rowBorder.color || commonWidth !== rowBorder.width) {
                matchingBorders = false;
              }
            }
            break;
          default:
            matchingBorders = false;
            break;
        }

        if (matchingBorders) {
          border.color = commonColor;
          border.width = commonWidth;
        }
      }

      return border;
    },

    /**
     * Creates a SharedBorderStyle object
     * @param {String} style The border style 'full', 'grid', 'box', 'none', 'custom'
     * @param {Number} commonWidth The common border width if applicable
     * @param {String} commonColor The common border color if applicable
     * @constructor
     */
    SharedBorderStyle: function (style, commonWidth, commonColor) {
      this.style = style;
      this.commonWidth = commonWidth;
      this.commonColor = commonColor;
    },

    /**
     * Gets the border style for a given cell
     * @param {CellBorders} cellBorders The borders of the cell to get the style for
     * @returns {BorderStyle} The border style of the cell
     */
    getBorderStyleForCell: function (cellBorders) {
      var commonWidth,
          commonColor,
          allBorders = [cellBorders.top, cellBorders.left, cellBorders.right, cellBorders.bottom],
          border,
          allMatching = true,
          i, borderStyle;

      border = allBorders[0];
      commonWidth = border.width;
      commonColor = border.color;

      for (i = 1; i < allBorders.length && allMatching; ++i) {
        border = allBorders[i];
        if (commonWidth !== border.width || commonColor !== border.color) {
          allMatching = false;
        }
      }

      if (allMatching) {
        if (commonWidth === 0) {
          borderStyle = new this.SharedBorderStyle('none');
        } else {
          borderStyle = new this.SharedBorderStyle('full', commonWidth, commonColor);
        }
      } else {
        borderStyle = new this.SharedBorderStyle('custom');
      }

      return borderStyle;
    },

    /**
     * Gets the border style for a row
     * @param {RowBorders} rowBorders The borders of the row to get the style for
     * @returns {BorderStyle} The border style for the row
     */
    getBorderStyleForRow: function (rowBorders) {
      var commonWidth,
          commonColor,
          allBorders = [rowBorders.top, rowBorders.left, rowBorders.right, rowBorders.bottom, rowBorders.vertical],
          outerBorders = [rowBorders.top, rowBorders.left, rowBorders.right, rowBorders.bottom],
          verticalBorder = rowBorders.vertical,
          border, borderStyle,
          allMatching = true,
          outerMatching = true,
          i;

      border = allBorders[0];
      commonWidth = border.width;
      commonColor = border.color;

      for (i = 1; i < allBorders.length && allMatching; ++i) {
        border = allBorders[i];
        if (commonWidth !== border.width || commonColor !== border.color) {
          allMatching = false;
        }
      }
      // If all of the borders match go ahead and set full or none accordingly
      if (allMatching) {
        if (commonWidth === 0) {
          borderStyle = new this.SharedBorderStyle('none');
        } else {
          borderStyle = new this.SharedBorderStyle('full', commonWidth, commonColor);
        }
      } else {
        // See if all of the outer borders are matching and determine if the style is box or grid
        border = outerBorders[0];
        commonWidth = border.width;
        commonColor = border.color;
        for (i = 1; i < outerBorders.length && outerMatching; ++i) {
          border = outerBorders[i];
          if (commonWidth !== border.width || commonColor !== border.color) {
            outerMatching = false;
          }
        }

        // If the outer borders match check the inner vertical border
        if (outerMatching) {
          if (verticalBorder.width === 0) {
            // The vertical border has a width of 0, this is a box style
            borderStyle = new this.SharedBorderStyle('box', commonWidth, commonColor);
          } else if (verticalBorder.color === commonColor) {
            // If the color matches it could potentially be a grid style
            if (verticalBorder.width === 1) {
              // The vertical border has a width of 1, this is a grid style
              borderStyle = new this.SharedBorderStyle('grid', commonWidth);
            } else {
              // The vertical border has a custom width, this is a custom style
              borderStyle = new this.SharedBorderStyle('custom');
            }
            // Go ahead and set the color since the color of all of the borders matched
            borderStyle.commonColor = commonColor;
          } else {
            // The outer borders match but the inner border has been customized
            borderStyle = new this.SharedBorderStyle('custom');
          }
        } else {
          // If the outer borders are not matching this is custom
          borderStyle = new this.SharedBorderStyle('custom');
        }
      }

      return borderStyle;
    },

    /**
     * Gets the border style for the given table
     * @param {TableBorders} tableBorders The borders of the table to get the style for
     * @returns {BorderStyle} The border style of the table
     */
    getBorderStyleForTable: function (tableBorders) {
      var commonWidth,
          commonColor,
          allBorders = [tableBorders.top, tableBorders.left, tableBorders.right, tableBorders.bottom,
                        tableBorders.vertical, tableBorders.horizontal],
          outerBorders = [tableBorders.top, tableBorders.left, tableBorders.right, tableBorders.bottom],
          innerBorders = [tableBorders.vertical, tableBorders.horizontal],
          border, borderStyle,
          allMatching = true, outerMatching = true,
          innerMatching = true,
          innerColor, innerWidth, i;

      border = allBorders[0];
      commonWidth = border.width;
      commonColor = border.color;

      for (i = 1; i < allBorders.length && allMatching; ++i) {
        border = allBorders[i];
        if (commonWidth !== border.width || commonColor !== border.color) {
          allMatching = false;
        }
      }
      // If all of the borders match go ahead and set full or none accordingly
      if (allMatching) {
        if (commonWidth === 0) {
          borderStyle = new this.SharedBorderStyle('none');
        } else {
          borderStyle = new this.SharedBorderStyle('full', commonWidth, commonColor);
        }
      } else {
        // Check if the outer borders and inner borders are matching amongst themselves

        border = outerBorders[0];
        commonWidth = border.width;
        commonColor = border.color;
        for (i = 1; i < outerBorders.length && outerMatching; ++i) {
          border = outerBorders[i];
          if (commonWidth !== border.width || commonColor !== border.color) {
            outerMatching = false;
          }
        }

        border = innerBorders[0];
        innerWidth = border.width;
        innerColor = border.color;
        for (i = 1; i < innerBorders.length && innerMatching; ++i) {
          border = innerBorders[i];
          if (innerWidth !== border.width || innerColor !== border.color) {
            innerMatching = false;
          }
        }

        if (outerMatching && innerMatching && commonWidth > 0) {
          // This could be a box or grid style depending on the inner borders
          if (innerWidth === 0) {
            // The outer borders are consistent and the inner borders have a width of 0, this is a box style
            borderStyle = new this.SharedBorderStyle('box', commonWidth, commonColor);
          } else if (commonColor === innerColor) {
            if (innerWidth === 1) {
              // The outer borders are consistent and the inner borders have a width of 1, this is a grid style
              borderStyle = new this.SharedBorderStyle('grid', commonWidth);
            } else {
              // The inner borders have a custom width, this is custom
              borderStyle = new this.SharedBorderStyle('custom');
            }
            // Go ahead and set the color since the color of all of the borders matched
            borderStyle.commonColor = commonColor;
          } else {
            // The outer borders match but the inner borders have been customized
            borderStyle = new this.SharedBorderStyle('custom');
          }
        } else {
          // The outer borders or inner borders don't match, this is custom
          borderStyle = new this.SharedBorderStyle('custom');
        }
      }

      return borderStyle;
    },

    /**
     * Gets the CSS string representing a given border.
     *
     * @param {String} border The border to get the CSS string for
     * @returns {String} The CSS string for the border.
     */
    getCSSStringForBorder: function (border) {
      var str = 'none';

      if (border && border.width > 0) {
        str = border.width + 'px ' + border.color + ' solid';
      }

      return str;
    },

    /**
     * Saves the cell properties to the given cell in tinyMCE
     * @param {HTMLElement} node The cell to save the properties to
     * @param {CellBorders} cellBorders The borders of the cell
     * @param {CellMargins} cellMargins The margins of the cell
     * @param {Alignment} alignment The alignment of the cell
     * @param {String} bgColor The background color of the cell
     */
    saveCellProperties: function (node, cellBorders, cellMargins, alignment, bgColor) {

      var ed = tinymce.activeEditor,
          $cell, $cellTmp, separatedBorders = false;

      if (node) {
        $cell = $(node);
        this.translateOldTableProperties($cell.closest('table'));

        if ($cell.css('border-collapse') === 'separate') {
          separatedBorders = true;
        }

        // Set the cell margins if override is checked
        if (cellMargins) {
          this.applyCellMargins(cellMargins, $cell);
        }

        // Set the top left right and bottom borders on the cell
        if (cellBorders) {
          $cell.css('border-left', this.getCSSStringForBorder(cellBorders.left));
          $cell.css('border-top', this.getCSSStringForBorder(cellBorders.top));
          $cell.css('border-right', this.getCSSStringForBorder(cellBorders.right));
          $cell.css('border-bottom', this.getCSSStringForBorder(cellBorders.bottom));

          if (!separatedBorders) {
            $cellTmp = $cell.prev();
            // Set the right border on the cell to the left to match this cells left border
            $cellTmp.css('border-right', this.getCSSStringForBorder(cellBorders.left));
            $cellTmp.removeAttr('data-mce-style');

            // Set the left border on the cell to the right to match this cells right border
            $cellTmp = $cell.next();
            $cell.next().css('border-left', this.getCSSStringForBorder(cellBorders.right));
            $cellTmp.removeAttr('data-mce-style');

            // Set the bottom border on the cell above to match this cells top border
            $cellTmp = $($cell.parent().prev().children()[$cell.index()]);
            $cellTmp.css('border-bottom', this.getCSSStringForBorder(cellBorders.top));
            $cellTmp.removeAttr('data-mce-style');

            // Set the top border on the cell below to match this cells bottom border
            $cellTmp = $($cell.parent().next().children()[$cell.index()]);
            $cellTmp.css('border-top', this.getCSSStringForBorder(cellBorders.bottom));
            $cellTmp.removeAttr('data-mce-style');
          }
        }

        if (alignment && bgColor) {
          $cell.attr('align', alignment.horizontal)
               .attr('vAlign', alignment.vertical)
               .attr('bgColor', bgColor);
        }
        $cell.removeAttr('data-mce-style');

        ed.execCommand('mceAddUndoLevel');
      }
    },

    /**
     * Saves the row properties to the given row in tinyMCE
     * @param {HTMLElement} node The row to save the properties to
     * @param {RowBorders} rowBorders The borders of the row
     * @param {CellMargins} cellMargins The cell margins to use in the cells of the row
     * @param {Alignment} alignment The alignment of the row
     * @param {String} bgColor The background color of the row
     */
    saveRowProperties: function (node, rowBorders, cellMargins, alignment, bgColor) {
      var ed = tinymce.activeEditor,
          $rowAndCells, $row, $cells, $edgeCell, $tmpCells,
          separatedBorders = false;

      if (node) {
        $rowAndCells = $(node).children('td').andSelf();
        // Clear out any previous TinyMCE data it needs to be recomputed after these changes
        $rowAndCells.removeAttr('data-mce-style');
        $row = $(node);
        this.translateOldTableProperties($row.closest('table'));

        if ($row.css('border-collapse') === 'separate') {
          separatedBorders = true;
        }

        // Set the cell margins if override is checked
        if (cellMargins) {
          this.applyRowMargins(cellMargins, $row);
        }

        // Set the inner border on the cells
        $cells = $row.find('td');

        if (rowBorders) {
          $cells.css('border-left', this.getCSSStringForBorder(rowBorders.vertical));
          $cells.css('border-right', this.getCSSStringForBorder(rowBorders.vertical));

          // Set the top border on the cells in the row
          $cells.css('border-top', this.getCSSStringForBorder(rowBorders.top));
          if (!separatedBorders) {
            // Set the bottom border on the row above, if was bigger it needs to match this
            $tmpCells = $row.prev().find('td');
            // Clear out any previous TinyMCE data it needs to be recomputed after these changes
            $tmpCells.removeAttr('data-mce-style');
            $tmpCells.css('border-bottom', this.getCSSStringForBorder(rowBorders.top));
          }

          // Set the bottom border on the cells in the row
          $cells.css('border-bottom', this.getCSSStringForBorder(rowBorders.bottom));
          if (!separatedBorders) {
            // Set the top border on the row below, if it was bigger it needs to match this
            $tmpCells = $row.next().find('td');
            // Clear out any previous TinyMCE data it needs to be recomputed after these changes
            $tmpCells.removeAttr('data-mce-style');
            $tmpCells.css('border-top', this.getCSSStringForBorder(rowBorders.bottom));
          }

          $cells.attr('align', alignment.horizontal)
                .attr('vAlign', alignment.vertical)
                .attr('bgColor', bgColor);

          // Set the left border on the left cell
          $edgeCell = $row.find('td:first-child');
          $edgeCell.css('border-left', this.getCSSStringForBorder(rowBorders.left));

          // Set the right border on the right cell
          $edgeCell = $row.find('td:last-child');
          $edgeCell.css('border-right', this.getCSSStringForBorder(rowBorders.right));
        }

        if (alignment && bgColor) {
          $row.attr('align', alignment.horizontal)
              .attr('vAlign', alignment.vertical)
              .attr('bgColor', bgColor);
        }

        ed.execCommand('mceAddUndoLevel');
      }
    },

    /**
     * Inserts or saves the table into tinyMCE
     * @param {HTMLElement} node The table to save (undefined if inserting a new table}
     * @param {Number} rows The number of rows in the table
     * @param {Number} columns The number of columns in the table
     * @param {Number} width The widtdh of the table
     * @param {TableBorders} tableBorders The borders of the table
     * @param {String} alignment The horizontal alignment for the table
     * @param {Number} cellSpacing The spacing between the cells of the table, 0 if they are not separated
     * @param {CellMargins} cellMargins The margins to use for the cells
     * @param {String} bgColor The background color of the table
     */
    insertOrSaveTable: function (node, rows, columns,
                                 width, tableBorders, alignment,
                                 cellSpacing, cellMargins, bgColor) {

      var ed = tinymce.activeEditor,
          i, $table, $cells,
          currentRows, x, y, html,
          emptyRow = tinymce.isIE ? '<tr><td></td></tr>' : '<tr><td><br data-mce-bogus="1"/></td></tr>',
          focusFirstCell = true,
          firstCell, insertMode, self = this;

      if (node) {
        $table = $(node);
        insertMode = false;
        this.translateOldTableProperties($table);
      } else if (rows && columns) {
        // Copied from the TinyMCE table plugin.
        html = '<table id="tinysc-table"><tbody>';

        for (y = 0; y < rows; y++) {
          html += '<tr>';

          for (x = 0; x < columns; x++) {
            html += '<td>' + (tinymce.Env.ie ? ' ' : '<br>') + '</td>';
          }

          html += '</tr>';
        }

        html += '</tbody></table>';

        ed.insertContent(html);
        // END copy from TinyMCE

        $table = $(ed.dom.select('#tinysc-table'));
        insertMode = true;
      }

      if ($table && $table.length) {
        currentRows = self.countTableRows($table);

        // add/remove rows
        if (currentRows > rows) {
          // need to remove rows
          $table.find('tr').slice(rows).remove();
        } else if (currentRows < rows) {
          // need to add rows
          for (i = 0; i < rows - currentRows; ++i) {
            $table.find('tr').filter(':last').after(emptyRow);
          }
        }

        // add/remove columns
        $table.find('tr').each(function () {
          var $this = $(this),
              numColumns = self.countRowColumns($this);

          if (numColumns > columns) {
            // need to remove columns
            $this.find('td').slice(columns).remove();
          } else if (numColumns < columns) {
            // need to add columns
            for (i = 0; i < columns - numColumns; ++i) {
              if (!tinymce.isIE || tinymce.isIE11) {
                $this.find('td').filter(':last').after('<td><br data-mce-bogus="1"/></td>');
              } else {
                $this.find('td').filter(':last').after('<td></td>');
              }
            }
          }
        });

        // Don't set width 0 on the table or it will not be visible. Instead, follow the behavior of the native client and
        // do not set a width at all, which will let the browser draw the table at its min width
        if (!isNaN(width) && width !== 0) {
          $table.prop('width', width);
        }

        // Set the border styling and cell spacing on the table
        if (!isNaN(cellSpacing)) {
          if (cellSpacing === 0) {
            $table.css('border-collapse', 'collapse');
            $table.css('border-spacing', '');
          } else {
            $table.css('border-spacing', cellSpacing + 'px');
            $table.css('border-collapse', 'separate');
          }
        }

        $cells = $table.find('td');
        // Clear out any previous TinyMCE data it needs to be recomputed after these changes
        $table.removeAttr('data-mce-style');
        $cells.removeAttr('data-mce-style');

        if (cellMargins) {
          this.applyTableMargins(cellMargins, $table);
        }

        if (tableBorders) {
          // Set the cells to have the internal vertical and horizontal borders

          $cells.css('border-left', this.getCSSStringForBorder(tableBorders.vertical));
          $cells.css('border-right', this.getCSSStringForBorder(tableBorders.vertical));
          $cells.css('border-top', this.getCSSStringForBorder(tableBorders.horizontal));
          $cells.css('border-bottom', this.getCSSStringForBorder(tableBorders.horizontal));

          // Cells need to have their bgColor so when the tables is set it overrides the cells
          if (bgColor) {
            $cells.prop('bgColor', bgColor);
          }

          // Set the left border on the left cells
          $cells = $table.find('tr td:first-child');
          $cells.css('border-left', this.getCSSStringForBorder(tableBorders.left));

          // Set the right border on the right cells
          $cells = $table.find('tr td:last-child');
          $cells.css('border-right', this.getCSSStringForBorder(tableBorders.right));

          // Set the top border on the cells in the first row
          $cells = $table.find('tr:first-child td');
          $cells.css('border-top', this.getCSSStringForBorder(tableBorders.top));

          // Set the bottom border on the bottom cells
          $cells = $table.find('tr:last-child td');
          $cells.css('border-bottom', this.getCSSStringForBorder(tableBorders.bottom));
        }

        if (alignment && bgColor) {
          $table.prop('align', alignment)
                .prop('bgColor', bgColor)
                .removeAttr('id');
        }

        if (!insertMode) {
          // Check if selection is in a cell still. If not, it means the cell was removed
          // by this table edit, and we need to put the cursor in the first cell.
          node = ed.selection.getNode();
          if (node) {
            node = $(node);
            if (node.closest('td').length) {
              focusFirstCell = false;
            }
          }
        }

        // Should put the cursor in the first cell when inserting a table, or when a table edit removes
        // the cell that had the cursor.
        if (focusFirstCell) {
          firstCell = $table.find('td').first();
          if (firstCell.length) {
            ed.selection.setCursorLocation(firstCell[0], 0);
          }
        }

        ed.execCommand('mceAddUndoLevel', undefined, undefined, {skip_focus: true});
      }
    },

    /**
     * Translates old table properties previously attributes to the style of the table
     * @param {jQuery} $table jQuery selector for the table to translate the attributes to styles
     */
    translateOldTableProperties: function ($table) {
      // Clear out deprecated table attributes, since they will be stored in the style
      var borderWidth = $table.attr('border'), cellSpacing = $table.attr('cellSpacing'),
          cellPadding = $table.attr('cellPadding'),
          newBorder, newMargins, $cells;

      // Apply the old attributes in the new styling
      // Note: Only make apply the changes if the old attribute is actually present

      if (cellSpacing !== undefined) {
        cellSpacing = parseInt(cellSpacing, 10);
        if (cellSpacing === 0) {
          $table.css('border-collapse', 'collapse');
          $table.css('border-spacing', '');
        } else {
          $table.css('border-collapse', 'separate');
          $table.css('border-spacing', cellSpacing + 'px');
        }
        $table.removeAttr('cellspacing');
      }

      if (cellPadding !== undefined) {
        cellPadding = parseInt(cellPadding, 10);
        newMargins = new this.CellMargins(cellPadding, cellPadding, cellPadding, cellPadding);
        this.applyTableMargins(newMargins, $table);
        $table.removeAttr('cellpadding');
      }

      if (borderWidth !== undefined) {
        borderWidth = parseInt(borderWidth, 10);
        newBorder = new this.Border(borderWidth);
        $cells = $table.find('td');
        $cells.css('border', this.getCSSStringForBorder(newBorder));
        $table.removeAttr('border');
        $table.css('border-style', '');
      }

      $table.removeAttr('data-mce-style');
      $table.addClass('mce-item-table');
    },

    /**
     * Gets the width from a css border width string.
     * @param {String} widthPx The width as a string, i.e. '10px'
     * @returns {Number} The width.
     */
    getWidthFromPxString: function (widthPx) {
      var width = parseInt(widthPx.substring(0, widthPx.indexOf('px')), 10);
      if (isNaN(width)) {
        width = 0;
      }
      return width;
    },

    /**
     * Returns information about the plugin as a name/value array.
     * The current keys are longname, author, authorurl, infourl and version.
     *
     * @return {Object} Name/value array containing information about the plugin.
     */
    getInfo: function () {
      return {
        longname: 'Seapine Table Plugin',
        author: 'Seapine Software Inc',
        authorurl: 'http://www.seapine.com',
        infourl: 'http://www.seapine.com',
        version: '0.1'
      };
    }

  });

  // Register plugin
  tinymce.PluginManager.add('seapinetable', tinymce.plugins.SeapineTablePlugin);
})();
