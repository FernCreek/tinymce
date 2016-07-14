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
					listNode,
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

				// Lists
				listNode = ed.dom.getParent(element, 'ul,ol');

				// Bulleted (Unordered) List
				state = (!!listNode) && (listNode.nodeName === 'UL');
				SPTinyMCEInterface.signalCursorInBulletedList(state);

				// Numbered (Ordered) List
				state = (!!listNode) && (listNode.nodeName === 'OL');
				SPTinyMCEInterface.signalCursorInNumberedList(state);
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
