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
        // Helper function to get the JQuery body of the iFrame document.
				getJQueryBody: function () {
					return $('#content_ifr').contents().find('.tinymce-native');
				}
			});
		},

		//////////////////////////////////////////////////////////////////////////
		// Editor Display settings
		/////////////////////////////////////////////////////////////////////////

		/**
		 * Loads the default font settings and applies them to the iframe's body
		 * @param {JSON} fontJSON JSON object containing the default font family and size information to set
		 */
		loadDefaultFont: function (fontJSON) {
			var family = fontJSON.family, ptSize = fontJSON.ptSize, $editorBody;
			// console.log('family: ' + family + ' ptSize: ' + ptSize);
			$editorBody = this._editor.getJQueryBody();
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
			var $editorBody;
			this._windowEditColor = windowEdit;
			this._windowReadOnlyColor = windowReadOnly;
			this._textEditColor = textEdit;
			this._textReadOnlyColor = textReadOnly;
			$editorBody = this._editor.getJQueryBody();
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

		/**
		 * Modifies the TinyMCE editor's body tag to prevent drag events from being handled natively
		 */
		disableOnDragStart: function () {
			var $editorBody;
			$editorBody = this._editor.getJQueryBody();
			$editorBody.attr('ondragstart', 'return false;');
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

		//////////////////////////////////////////////////////////////////////////
		// Image handling
		/////////////////////////////////////////////////////////////////////////

		/**
		 * Reloads a provided image in the editor by cachebustering the image
		 * @param {String} imgSrc The image source that needs to be reloaded
		 */
		reloadImage: function (imgSrc) {
			var $images;
			$images = this._editor.getJQueryBody().find('img');
			$images.each(function () {
				var src = $(this).attr('src'), idx;
				idx = src.indexOf(imgSrc);
				if (idx !== -1 && src.substr(idx) === imgSrc) {
					$(this).attr('src', src + '?1');
					$(this).attr('data-mce-src', src + '?1');
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
			var editor = this._editor, $images, waitImgDone;

			$images = editor.getJQueryBody().find('img');

			/**
			 * Function called when an image has been loaded by the browser
			 * @param {String} loadedImg The image that was loaded
			 * @param {Boolean} bWasError Whether there was an error loading the image
			*/
			waitImgDone = function (loadedImg, bWasError) {
				// console.log('Image has been loaded: ' + loadedImg.src + ' at: ' + new Date().getTime() + ' error: ' + bWasError);
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
				// console.log('Image: ' + tmpImg.src + ' setup at: ' + new Date().getTime());
			});
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
			var $editorBody;
			// Only set a fixed width if we are not already set to that fixed width
			if (this._cachedWidthSetting !== width) {
				$editorBody = this._editor.getJQueryBody();
				$editorBody.css('width', width + 'px');
				$editorBody.css('overflow', 'hidden');
				this._cachedWidthSetting = width;
			}
		},

		/**
		 * Sets the editor to be a varaible width again by clearing the fixed width
		 */
		clearFixedWidthEditor: function () {
			var $editorBody;
			// Only clear the fixed with if we currently have a fixed width
			if (this._cachedWidthSetting !== -1) {
				$editorBody = this._editor.getJQueryBody();
				// Remove the width and overflow settings
				$editorBody.css('width', '');
				$editorBody.css('overflow', '');
				this._cachedWidthSetting = -1;
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
			var $editorBody;
			// Only apply the new value if it isn't our cached value
			if (bReadOnly !== this._cachedReadOnly) {
				$editorBody = this._editor.getJQueryBody();
				if (bReadOnly) {
					this._editor.setMode('readonly');
					this._editor.settings.object_resizing = false;
					// In setMode, TinyMCE creates a '_clickBlocker' object, that does exactly what you'd expect for anchor tags.
					// Since in the native client, we still want the user to be able to click hyperlinks, we need to unbind this.
					if (this._editor._clickBlocker) {
						this._editor._clickBlocker.unbind();
						this._editor._clickBlocker = null;
					}
					// If we have settings for the palette in this mode apply them
					if (this._windowReadOnlyColor && this._textReadOnlyColor) {
						// Go ahead and apply the readonly styles to the body
						$editorBody.css('font', this._textReadOnlyColor);
						$editorBody.css('background-color', this._windowReadOnlyColor);
					}
				} else {
					this._editor.setMode('design');
					this._editor.settings.object_resizing = true;
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
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo: function () {
			return {
				longname: 'Qt Base Integration plugin',
				author: 'Seapine Software Inc',
				authorurl: 'http://www.seapine.com',
				infourl: 'http://www.seapine.com',
				version: '0.2'
			};
		}

	});

	// Register plugin
	tinymce.PluginManager.add('qtinterface', tinymce.plugins.QtInterfacePlugin);
})();
