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
     * @param {Number} leftMargin The left margin
     * @param {Number} topMargin The top margin
     * @param {Number} rightMargin The right margin
     * @param {Number} bottomMargin The bottom margin
     * @constructor
     */
    CellMargins: function (leftMargin, topMargin, rightMargin, bottomMargin) {
      this.left = leftMargin;
      this.top = topMargin;
      this.right = rightMargin;
      this.bottom = bottomMargin;

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
     * Determines and applies the cell margins to the given cells.
     *
     * @param {CellMargins} cellMargins The cell margins to apply.
     * @param {jQuery} $cells The cells to apply the margins to.
     */
    applyCellMargins: function (cellMargins, $cells) {
      if (cellMargins && $cells) {
        $cells.css('padding', cellMargins.getCSSString(this.tableConstants.kDefaultCellMargin));
      }
    },

    /**
     * Gets the margins for the given cell.
     *
     * @param {jQuery} $cell The cell to get the margins for.
     * @returns {Array.<Number>} The margins for the cell in the order of top, right, bottom, left.
     */
    getMarginsForCell: function ($cell) {
      var margins = [], defaultMargin = this.tableConstants.kDefaultCellMargin,
          marginNames = ['top', 'right', 'bottom', 'left'],
          maxMargin = this.tableConstants.kDefaultMaxMargin,
           marginValue, self = this, tmpPadding;
      if ($cell) {
        marginNames.forEach( function (name) {
          tmpPadding = $cell.css('padding-' + name);
          marginValue = tmpPadding ? self.getWidthFromPxString(tmpPadding) : defaultMargin;
          if (marginValue > maxMargin) {
            marginValue = maxMargin;
          }
          margins.push(marginValue);
        });
      } else {
        margins = [defaultMargin, defaultMargin, defaultMargin, defaultMargin];
      }
      return margins;
    },

    /**
     * Gets the margins for the cells in a particular row. If the cells margins in the row do not match the default
     * cell margins will be returned.
     *
     * @param {jQuery} $row The row to get the cell margins for.
     * @returns {Array.<Number>} The cell margins for the row in the order of top, right, bottom, left.
     */
    getMarginsForRow: function ($row) {
      var $cells, rowMargins, cellMargins, cellMarginsStr,
          i, sameMargins = true, defaultMargin = this.tableConstants.kDefaultCellMargin;

      rowMargins = [defaultMargin, defaultMargin, defaultMargin, defaultMargin];

      if ($row) {
        $cells = $row.find('td');
        cellMargins = this.getMarginsForCell($($cells[0]));
        cellMarginsStr = cellMargins.toString();
        for (i = 1; i < $cells.length && sameMargins; ++i) {
          if (cellMarginsStr !== this.getMarginsForCell($($cells[i])).toString()) {
            sameMargins = false;
          }
        }

        // If all of the cell margins are the same use those instead of the default margins.
        if (sameMargins) {
          rowMargins = cellMargins;
        }
      }
      return rowMargins;
    },

    /**
     * Gets the margins for the cells of a table. If the cells margins in the table do not match the default
     * cell margins will be returned.
     *
     * @param {jQuery} $table The table to get the cell margins for.
     * @returns {Array.<Number>} The cell margins for the table in the order of top, right, bottom, left.
     */
    getMarginsForTable: function ($table) {
      var $rows, tableMargins, rowMargins, rowMarginsStr,
          i, sameMargins = true, defaultMargin = this.tableConstants.kDefaultCellMargin;

      tableMargins = [defaultMargin, defaultMargin, defaultMargin, defaultMargin];

      if ($table) {
        $rows = $table.find('tr');
        rowMargins = this.getMarginsForRow($($rows[0]));
        rowMarginsStr = rowMargins.toString();
        for (i = 1; i < $rows.length && sameMargins; ++i) {
          if (rowMarginsStr !== this.getMarginsForRow($($rows[i])).toString()) {
            sameMargins = false;
          }
        }

        // If all of the row margins are the same use those instead of the default margins.
        if (sameMargins) {
          tableMargins = rowMargins;
        }
      }
      return tableMargins;
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
        borderWidthStr = $cell.css(borderStyleStr + 'width');
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
            commonWidth = $cell.css(borderStyleStr + 'width');
            for (i = 1; i < $cells.length && matchingBorders; ++i) {
              $cell = $($cells[i]);
              if ($cell.css(borderStyleStr + 'color') !== commonColor ||
                  $cell.css(borderStyleStr + 'width') !== commonWidth) {

                matchingBorders = false;
              }
            }
            break;
          case 'right':
          case 'left':
            // Grab the right border of the furthest right or left border of the furthest left
            if (borderStr === 'right') {
              $cells = $row.find('td:last-child');
            } else {
              $cells = $row.find('td:first-child');
            }

            commonWidth = $cells.css(borderStyleStr + 'width');
            commonColor = $cells.css(borderStyleStr + 'color');
            break;
          case 'vertical':
            // Grab the inner borders of all of the cells and set the vertical border if they are the same
            $cell = $($cells[0]);
            commonColor = $cell.css(bRight + 'color');
            commonWidth = $cell.css(bRight + 'width');

            // Check the right border of all of the inner cells (except the right most)
            for (i = 1; i < $cells.length - 1 && matchingBorders; ++i) {
              $cell = $($cells[i]);
              if ($cell.css(bRight + 'color') !== commonColor ||
                  $cell.css(bRight + 'width') !== commonWidth) {
                matchingBorders = false;
              }
            }

            // Check the left border of all of the inner cells (except the left most)
            for (i = 1; i < $cells.length && matchingBorders; ++i) {
              $cell = $($cells[i]);
              if ($cell.css(bLeft + 'color') !== commonColor ||
                  $cell.css(bLeft + 'width') !== commonWidth) {
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

        if ($row.css('border-collapse') === 'separate') {
          separatedBorders = true;
        }

        // Set the inner border on the cells
        $cells = $row.find('td');

        // Set the cell margins if override is checked
        if (cellMargins) {
          this.applyCellMargins(cellMargins, $cells);
        }

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
          } else {
            $table.css('border-spacing', cellSpacing + 'px');
            $table.css('border-collapse', 'separate');
          }
        }

        $cells = $table.find('td');
        // Clear out any previous TinyMCE data it needs to be recomputed after these changes
        $table.removeAttr('data-mce-style');
        $cells.removeAttr('data-mce-style');

        // Clear out deprecated table attributes, since we are storing them in CSS
        $table.removeAttr('border');
        $table.removeAttr('cellspacing');
        $table.removeAttr('cellpadding');

        if (cellMargins) {
          this.applyCellMargins(cellMargins, $cells);
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
