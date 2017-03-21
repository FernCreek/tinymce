/**
 * plugin.js
 * Plugin for working with copy & cut actions.
 *
 * Copyright 2017, Seapine Software Inc
 * Released under LGPL License
 *
 * License: http://tinymce.moxiecode.com/license
 */

/* globals  tinymce */

(function () {

	/**
	 * @class
	 *
	 * TinyMCE plugin for working with copy & cut actions.
	 */
	tinymce.create('tinymce.plugins.CopyCutPlugin', {

		/**
		 * The TinyMCE editor object
		 * @type {tinymce.Editor}
		 */
		_editor: null,

		/**
		 * Constructor
		 *
		 * @param {tinymce.Editor} editor - The editor instance to use.
		 * @constructor
		 */
		CopyCutPlugin: function (editor) {
			this._editor = editor;
		},

		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 * This call is done before the editor instance has finished it's initialization so use the onInit event
		 * of the editor instance to intercept that event.
		 *
		 * @param {tinymce.Editor} editor - Editor instance that the plugin is initialized in.
		 */
		init: function (editor) {
			var self = this;

			editor.on('copy', function (event) {
				return self.onCopy(event);
			});

			editor.on('cut', function (event) {
				return self.onCut(event);
			});
		},

		/**
		 * Listener for the copy event.
		 *
		 * @param {ClipboardEvent} event - The copy event
		 * @returns {boolean} If the default browser behavior should be allowed
		 */
		onCopy: function (event) {
			var ret = true;
			var content;
			// update cached styles on the selection, this way if the user then pastes into an editor all styles will be pasted
			this._editor.dom.updateCachedStylesOnElements(this._editor.selection.getSelectedBlocks());

			// on WebKit depending on the selection the cached style attribute doesn't get copied to the clipboard, forcibly
			// set the clipboard content so it is always correct
			if (tinymce.isWebKit && event && event.clipboardData && event.clipboardData.setData && event.clipboardData.clearData) {
				event.preventDefault();
				ret = false;
				event.clipboardData.clearData();

				content = this._editor.selection.getSelectionWithFormatting({keepCachedStyles: true});

				event.clipboardData.setData('text/html', content);
				event.clipboardData.setData('text/plain', this._editor.selection.getContent({format: 'text'}));
			}

			return ret;
		},

		/**
		 * Listener for the cut event.
		 *
		 * @param {ClipboardEvent} event - THe cut event
		 * @returns {boolean} true, allow the default browser behavior
		 */
		onCut: function (event) { // eslint-disable-line no-unused-vars
			// update cached styles on the selection, this way if the user then pastes into an editor all styles will be pasted
			this._editor.dom.updateCachedStylesOnElements(this._editor.selection.getSelectedBlocks());
			return true;
		}
	});

	tinymce.PluginManager.add('copycut', tinymce.plugins.CopyCutPlugin);
})();