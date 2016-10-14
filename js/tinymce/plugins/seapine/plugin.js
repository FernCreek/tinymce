/**
 * plugin.js
 *
 * Copyright 2014, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */

/*global tinymce:true, $: false */

(function () {

  /**
   * @class
   *
   * TinyMCE plugin for general Seapine modifications.
   */
  tinymce.create('tinymce.plugins.SeapinePlugin', {

    /**
     * tracks whether this tinymce instance is set to read only or not.
     * @type {Boolean}
     * @default
     */
    readonly: false,

    /**
     * Initializes the plugin, this will be executed after the plugin has been created.
     * This call is done before the editor instance has finished it's initialization so use the onInit event
     * of the editor instance to intercept that event.
     *
     * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
     */
    init : function (ed) {
      // Override some formats.
      ed.on('init', function () {
        this.formatter.register({
          alignleft : [
            {selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', attributes : {'align' : 'left'}},
            {selector : 'img,table', collapsed : false, styles : {'float' : 'left'}}
          ],

          aligncenter : [
            {selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', attributes: {'align' : 'center'}},
            {selector : 'img', collapsed : false, styles : {display : 'block', marginLeft : 'auto', marginRight : 'auto'}},
            {selector : 'table', collapsed : false, styles : {marginLeft : 'auto', marginRight : 'auto'}}
          ],

          alignright : [
            {selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', attributes : {'align' : 'right'}},
            {selector : 'img,table', collapsed : false, styles : {'float' : 'right'}}
          ],

          alignfull : [
            {selector : 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li', attributes : {'align' : 'justify'}}
          ],

          removefontsize: {inline: 'span', styles: {fontSize: ''}, links: true, remove_similar: true},

          removefontname: {inline: 'span', styles: {fontFamily: ''}, links: true, remove_similar: true}

        });
      });

      tinymce.extend(ed, {
        /**
         * Makes the editor readonly. This turns off contentEditable on the editor body element,
         * disables the toolbar buttons, and saves the selection so it can be restored when the
         * editor becomes editable again.
         *
         * @param {Boolean} ro Whether to make the editor readonly or not.
         */
        makeReadOnly: function (ro) {

          var body = this.getBody(),
            $body = $(body);

          ro = !!ro;

          if (!this.plugins.seapine || (ro && this.plugins.seapine.readonly) || (!ro && !this.plugins.seapine.readonly)) {
            return;
          }

          this.plugins.seapine.readonly = ro;

          // Turn off contentEditable and make the content unselectable.
          if (body) {
            body.contentEditable = !ro;
            $body.toggleClass('mceReadOnly', ro);
          }
        },

        /**
         * Applies or removes the blocking div from the editor.
         * {Boolean} applyBlockingDiv Whether to apply the blocking div. If not
         * specified, the default is false and if there was a blocking div, it is
         * removed.
         */
        applyBlockingDiv: function(applyBlockingDiv) {

          var blockingDivElements,
            hasBlockingDivApplied;

          //This if check makes sure we are initialized.
          if (this.getBody() && this.plugins.seapine) {


            blockingDivElements = this.dom.select('div#' + this.id + '-blocker', this.getContainer());
            hasBlockingDivApplied = ($.isArray(blockingDivElements) && (blockingDivElements.length > 0));

            if (applyBlockingDiv) {

              if (!hasBlockingDivApplied) {
                //Apply if not already there.
                this.dom.add(this.getContainer(), 'div', {
                  id: this.id + '-blocker',
                  style: 'background: black; position: absolute; left: 0; top: 0; height: 100%; width: 100%; opacity: 0.3'
                });
              } //else div is already applied.
            } else {
              //Only remove it if the div is there.
              if (hasBlockingDivApplied) {
                this.dom.remove(blockingDivElements);
              } //else nothing to remove.
            }
          }
        },

        /**
         * Gets the readonly status of the editor.
         *
         * @return {Boolean} true if readonly, false otherwise
         */
        getReadOnly: function () {
          return this.plugins.seapine ? this.plugins.seapine.readonly : false;
        },

        /**
         * Constants for font values that aren't a specific value
         * @enum {Number}
         */
        _fontValues: {
          defaultFont: 0,
          multipleFonts: 1
        },

        /**
         * Helper function to determine if the given text node only contains whitespace
         * @param {HTMLElement} node The node to check if it is only whitespace
         * @returns {boolean} Whether the node is whitespace
         */
        isTextNodeWS: function (node) {
          return !(/[^\t\n\r ]/.test(node.textContent));
        },

        /**
         * Given a parent node recursively gathers all of the text node children in a list and returns it
         * @param {HTMLElement} parent The node recurse looking for text nodes
         * @returns {Array.<HTMLElement>} Array containing the child text nodes of the parent
         */
        getChildTextNodesFromParent: function (parent) {
          var i, child, children = parent.childNodes, textChildren = [];
          for (i = 0; i < children.length; ++i) {
            child = children[i];
            if (child.nodeType === Node.TEXT_NODE && !this.isTextNodeWS(child)) {
              textChildren.push(child);
            } else {
              textChildren = textChildren.concat(this.getChildTextNodesFromParent(child));
            }
          }
          return textChildren;
        },

        /**
         * Give a maximum parent and a child node recursively walks up the tree looking for a specified font
         * @param {HTMLElement} maxParent The max parent to look for a font on
         * @param {HTMLElement} child The child to determine the effective font for
         * @returns {string} The font of the child text node, returns empty string if no font is defined
         */
        determineFontOnTextChild: function (maxParent, child) {
          var parent = child.parentNode,
              found = false, appliedFont = '';
          while (parent && !found && !$(parent).is(maxParent)) {
            if (parent.style && parent.style.fontFamily) {
              // A font style was found, do not continue up the parents
              found = true;
              appliedFont = parent.style.fontFamily.replace(/["']+/g, '').replace(/, /g, ',').toLowerCase();
            } else {
              parent = parent.parentNode;
            }
          }
          return appliedFont;
        },

        /**
         * Give a maximum parent and a child node recursively walks up the tree looking for a specified font size
         * @param {HTMLElement} maxParent The max parent to look for a font size on
         * @param {HTMLElement} child The child to determine the effective font size for
         * @returns {string} The font of the child text node, returns empty string if no font size is defined
         */
        determineFontSizeOnTextChild: function (maxParent, child) {
          var parent = child.parentNode,
              found = false, appliedFont = '';
          while (parent && !found && !$(parent).is(maxParent)) {
            if (parent.style && parent.style.fontSize) {
              // A font style was found, do not continue up the parents
              found = true;
              appliedFont = parent.style.fontSize;
            } else {
              parent = parent.parentNode;
            }
          }
          return appliedFont;
        },

        /**
         * Creates an ChildrenFont object. This is used to represent the font family or the font size
         * @param {String} state The children font state
         * @param {Boolean} didInherit Whether the children's font was a mixture of specified and inherited fonts
         * @constructor
         */
        ChildrenFont: function (state, didInherit) {
          this.fontState = state;
          if (didInherit !== null && didInherit !== false) {
            this.didInherit = didInherit;
          } else {
            this.didInherit = false;
          }
        },

        /**
         * Creates a FontFamilyAndSize object. This is used to contain the state of the font family and size.
         * @param {String} family The current font family
         * @param {String} size The current font size
         * @constructor
         */
        FontFamilyAndSize: function (family, size) {
          this.fontFamily = family;
          this.fontSize = size;
        },

        /**
         * Gets the font family or the font size used by a fragment
         * @param {DocumentFragment} fragment The fragment to analyze
         * @param {Boolean} bCanInherit Whether the children font is allowed to inherit the parent's font
         * @param {Boolean} bFontName Whether to determine the font name or the font size
         * @returns {ed.ChildrenFont} The font used by the fragment
         */
        getChildrenFont: function (fragment, bCanInherit, bFontName) {
          var fontState = this._fontValues.defaultFont, tmpFont, bDidInherit = false,
            font = '', textChildren = this.getChildTextNodesFromParent(fragment), i;
          if (textChildren.length) {
            font = bFontName ? this.determineFontOnTextChild(fragment, textChildren[0]) :
              this.determineFontSizeOnTextChild(fragment, textChildren[0]);
            for (i = 1; i < textChildren.length && fontState !== this._fontValues.multipleFonts; ++i) {
              tmpFont = bFontName ? this.determineFontOnTextChild(fragment, textChildren[i]) :
                this.determineFontSizeOnTextChild(fragment, textChildren[i]);
              if (tmpFont !== font) {
                // Found font doesn't match first child's font
                if (!bCanInherit) {
                  fontState = this._fontValues.multipleFonts;
                } else if (font === '') {
                  // Current font is inherit, this is a specified font
                  font = tmpFont;
                  bDidInherit =  true;
                } else if (tmpFont === '') {
                  // Current font is specified, this found an inherit font
                  bDidInherit = true;
                } else {
                  // Current font was something else specified and this does not match
                  fontState = this._fontValues.multipleFonts;
                }
              }
            }
          }

          if (font !== '' && fontState !== this._fontValues.multipleFonts) {
            fontState = font;
          }
          return new this.ChildrenFont(fontState, bDidInherit);
        },

        /**
         * Determines the current effective font family for a selection.
         * @param {HTMLElement} element The element which now has been selected
         * @param {DocumentFragment} frag The fragment of the current selection.
         * @returns {String} The current font family
         */
        determineCurrentFont: function (element, frag) {
          var fontName, parent, childrenFont;

          // Start with what TinyMCE thinks to be the current font
          fontName = this.queryCommandValue('fontname');

          // If the selection only has one node make sure we are not using the common ancestor
          if (frag && frag.childNodes.length === 1) {
            // If there is only one child node in the fragments use the font off of that instead of the current node.
            parent = frag.childNodes[0];
            if (parent.style && parent.style.fontFamily) {
              fontName = parent.style.fontFamily.replace(/["']+/g, '').replace(/, /g, ',').toLowerCase();
            }
          }

          // TinyMCE said the default font is being used. This just means no font was on the node.
          if (fontName === 0 || fontName === undefined || fontName === '') {
            fontName = this._fontValues.defaultFont;
            // FontFamily not on this node, recurse the parent nodes for a style. If we get to the <body>, end it
            if (element) {
              parent = element;
              while (parent && fontName === this._fontValues.defaultFont && !$(parent).is('body')) {
                if (parent.style && parent.style.fontFamily) {
                  fontName = parent.style.fontFamily.replace(/["']+/g, '').replace(/, /g, ',').toLowerCase();
                } else {
                  parent = parent.parentNode;
                }
              }
            }
          }

          // Verify all of the children are consistent in any fonts specified as the parent
          if (frag && frag.childNodes && frag.childNodes.length > 0) {
            if (fontName === this._fontValues.defaultFont) {
              // The parent is not specified (default) the children can not mix inherit and specified
              childrenFont = this.getChildrenFont(frag, false, true);
              // All of the children match a consistent font TinyMCE did not find, use that
              if (childrenFont.fontState !== this._fontValues.defaultFont) {
                fontName = childrenFont.fontState;
              }
            } else {
              // The parent is specified the children can mix inherit and specified as long as the specified is the same
              childrenFont = this.getChildrenFont(frag, true, true);
              if (childrenFont.fontState === this._fontValues.multipleFonts) {
                // TinyMCE found a font size but the children are not all using it
                fontName = this._fontValues.multipleFonts;
              } else if (childrenFont.fontState !== this._fontValues.defaultFont && childrenFont.fontState !== fontName) {
                // Children match a specified font and it disagrees with the parent font
                if (childrenFont.didInherit) {
                  // Children also inherited the parent font this is now a mismatch
                  fontName = this._fontValues.multipleFonts;
                } else {
                  // The children did not inherit the parent font use their font
                  fontName = childrenFont.fontState;
                }
              }
            }
          }

          return fontName;
        },

        /**
         * Determines the effective font size of the selection
         * @param {HTMLElement} element The element which now has been selected
         * @param {DocumentFragment} frag The selection fragment to determine the font size of
         * @returns {String} The effective font size of the selection
         */
        determineCurrentFontSize: function (element, frag) {
          var sizeName, parent, childrenFont, bCameFromElement = false;

          // Start with what TinyMCE thinks to be the current font size
          sizeName = this.queryCommandValue('fontsize');

          // Sometimes after applying styles our selection isn't perfect so queryCommandValue doesn't
          // work as expected. Check to see if this is a <span> and try to get the font size there.
          // http://www.tinymce.com/develop/bugtracker_view.php?id=6017
          // If the TinyMCE bug is ever fixed, we can probably remove this block
          if (element && $(element).is('span') && element.style && element.style.fontSize) {
            sizeName = element.style.fontSize;
            bCameFromElement = true;
          } else if (frag && frag.childNodes.length === 1) {
            parent = frag.childNodes[0];
            if (parent.style && parent.style.fontSize) {
              sizeName = parent.style.fontSize;
            }
          }

          if (sizeName === 0 || sizeName === undefined || sizeName === '') {
            sizeName = this._fontValues.defaultFont;
            // FontSize not on this node, check the parentNode for a style. If we get to the <body>, end it
            if (element) {
              parent = element;
              while (parent && sizeName === this._fontValues.defaultFont && !$(parent).is('body')) {
                if (parent.style && parent.style.fontSize) {
                  // Get font pt size from parent node
                  sizeName = parent.style.fontSize;
                } else {
                  parent = parent.parentNode;
                }
              }
            }
          }

          // Verify all of the children are consistent in any fonts specified as the parent
          if (frag && frag.childNodes && frag.childNodes.length > 0) {
            if (sizeName === this._fontValues.defaultFont || bCameFromElement) {
              // The parent is not specified (default) the children can not mix inherit and specified
              childrenFont = this.getChildrenFont(frag, false, false);
              // All of the children match a consistent font TinyMCE did not find, use that
              if (childrenFont.fontState !== this._fontValues.defaultFont) {
                sizeName = childrenFont.fontState;
              }
            } else {
              // The parent is specified the children can mix inherit and specified as long as the specified is the same
              childrenFont = this.getChildrenFont(frag, true, false);
              if (childrenFont.fontState === this._fontValues.multipleFonts) {
                // TinyMCE found a font size but the children are not all using it
                sizeName = this._fontValues.multipleFonts;
              } else if (childrenFont.fontState !== this._fontValues.defaultFont && childrenFont.fontState !== sizeName) {
                // Children match a specified font and it disagrees with the parent font
                if (childrenFont.didInherit) {
                  // Children also inherited the parent font this is now a mismatch
                  sizeName = this._fontValues.multipleFonts;
                } else {
                  // The children did not inherit the parent font use their font
                  sizeName = childrenFont.fontState;
                }
              }
            }
          }

          return sizeName;
        },

        /**
         * Determines the current font size and family given the element the current node changed to
         * @param {HTMLElement} element The element that received the node changed event
         * @returns {ed.FontFamilyAndSize} The font family and size of the current selection
         */
        determineCurrentFontAndSize: function (element) {
          var fontName, fontSize, frag;

          // Info used by font family and font size determination logic
          frag = this.selection.getRng().cloneContents();
          fontName = this.determineCurrentFont(element, frag);
          fontSize = this.determineCurrentFontSize(element, frag);

          return new this.FontFamilyAndSize(fontName, fontSize);
        }

      });
    },

    /**
     * Returns information about the plugin as a name/value array.
     * The current keys are longname, author, authorurl, infourl and version.
     *
     * @return {Object} Name/value array containing information about the plugin.
     */
    getInfo : function () {
      return {
        longname : 'Seapine plugin',
        author : 'Seapine Software Inc',
        authorurl : 'http://www.seapine.com',
        infourl : 'http://www.seapine.com',
        version : '0.2'
      };
    }
  });

  // Register plugin
  tinymce.PluginManager.add('seapine', tinymce.plugins.SeapinePlugin);
})();
