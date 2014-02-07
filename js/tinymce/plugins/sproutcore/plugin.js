/**
 * editor_plugin_src.js
 *
 * Copyright 2014, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */

/*global tinymce:true, TinySC, SC, $ */

(function () {
	var defaults, getParam;

	defaults = {
		sproutcore_app_namespace: null,
		sproutcore_dialog_open: null,
		sproutcore_dialog_close: null
	};

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
	 * TinyMCE plugin for integration with SproutCore.
	 */
	tinymce.create('tinymce.plugins.SproutCorePlugin', {

		SproutCorePlugin: function (ed) {
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
			// Override the editor's window manager with our own.
			ed.on('BeforeRenderUI', function () {
				ed.windowManager = new tinymce.SproutCoreWindowManager(ed);
			});

			// Add expanded editor command.
			ed.addCommand('scOpenExpandedEditor', function (ui, value) {
				//jshint unused:false
				var view = TinySC.Utils.getOwnerView(ed), expandedView;

				if (view && !view.get('isExpanded')) {
					expandedView = TinySC.ExpandedEditorPane.create({ owner: view });
					if (expandedView) {
						ed.plugins.sproutcore.openDialog(ed, expandedView);
						expandedView.load();
					}
				}
			});

			// Insert/edit link command
			ed.addCommand('mceLink', function (ui, value) {
				//jshint unused:false
				// Just matching the function signature with params here
				var viewClass = this.windowManager._setupLinkPropertiesDialog(this),
						ownerView = TinySC.Utils.getOwnerView(this),
						dialog;

				dialog = viewClass.create({owner: ownerView});
				this.plugins.sproutcore.openDialog(this, dialog);
			});

			// Insert/edit image command
			ed.addCommand('mceImage', function (ui, value) {
				var ownerView = TinySC.Utils.getOwnerView(this),
						viewClass = this.windowManager._setupImagePropertiesDialog(this, ownerView),
						dialog;

				dialog = viewClass.create({owner: ownerView});
				this.plugins.sproutcore.openDialog(this, dialog);
			});

			// Add expanded editor button.
			ed.addButton('expanded_editor', {
				title: 'sproutcore.expanded_editor_desc',
				cmd: 'scOpenExpandedEditor',
				ui: true
			});

			// Add paste post processing.
			if (ed.plugins.paste) {
				ed.on('PastePostProcess', function (evt) {
					var view = TinySC.Utils.getOwnerView(ed);

					if (view) {
						view.onPaste(ed, evt.node);
					}
				});
			}

			tinymce.extend(ed, {
				/**
				 * Stores the editor's current selection.
				 */
				storeSelection: function () {
					var curBookmark = this.plugins.sproutcore.getBookmark();

					// Only store the selection if we don't already have one
					if (this.selection && !curBookmark) {
						this.plugins.sproutcore.setBookmark(this.selection.getBookmark(2));
					}
				},

				/**
				 * Restores the previously saved editor selection.
				 */
				restoreSelection: function () {
					var bm = this.plugins.sproutcore.getBookmark();

					if (bm) {
						this.selection.moveToBookmark(bm);
					}

					// After we restore the selection, remove the bookmark
					this.plugins.sproutcore.setBookmark(null);
				}
			});
		},

		/**
		 * Opens a dialog according to the app specified method.
		 * Falls back to doing view.append.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {SC.PanelPane} view Dialog instance.
		 */
		openDialog: function (ed, view) {
			var app, dialogOpen;

			app = getParam(ed, 'sproutcore_app_namespace');
			dialogOpen = getParam(ed, 'sproutcore_dialog_open');

			if (tinymce.is(app, 'string')) {
				app = window[app];
			}

			if (app && tinymce.is(dialogOpen, 'string')) {
				dialogOpen = app[dialogOpen];
			}

			if (app && dialogOpen) {
				dialogOpen.call(app, view);
			} else {
				view.append();
			}
		},

		/**
		 * Closes a dialog according to the app specified method.
		 * Falls back to doing view.remove.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {SC.PanelPane} view Dialog instance.
		 */
		closeDialog: function (ed, view) {
			var app, dialogClose;

			app = getParam(ed, 'sproutcore_app_namespace');
			dialogClose = getParam(ed, 'sproutcore_dialog_close');

			if (tinymce.is(app, 'string')) {
				app = window[app];
			}

			if (app && tinymce.is(dialogClose, 'string')) {
				dialogClose = app[dialogClose];
			}

			if (app && dialogClose) {
				dialogClose.call(app, view);
			} else {
				view.remove();
			}
		},

		/**
		 * Sets the bookmark in the sproutcore plugin for this editor
		 * @param {Object} bm bookmark object
		 */
		setBookmark: function (bm) {
			this._bookmark = bm;
		},

		/**
		 * Gets the saved bookmark in the sproutcore plugin for this editor
		 * @return {*}
		 */
		getBookmark: function () {
			return this._bookmark;
		},

		/**
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo: function () {
			return {
				longname: 'SproutCore integration plugin',
				author: 'Seapine Software Inc',
				authorurl: 'http://www.seapine.com',
				infourl: 'http://www.seapine.com',
				version: '0.2'
			};
		}

	});

	/**
	 * Override of the default window manager for opening SproutCore based dialogs.
	 *
	 * @class tinymce.SproutCoreWindowManager
	 */
	tinymce.create('tinymce.SproutCoreWindowManager:tinymce.WindowManager', {
		/**
		 * Constructs a new window manager instance.
		 *
		 * @constructor
		 * @param {tinymce.Editor} ed Editor instance that the windows are bound to.
		 */
		SproutCoreWindowManager: function (ed) {
			// Class constructor
			var t = this;
			t.editor = ed;
		},

		/**
		 * Opens a new window. Overriden to open our SproutCore based dialogs instead.
		 *
		 * @param {Object} args See documentation of tinymce.WindowManager.
		 */
		open: function (args) {
			var self = this,
					editor = self.editor,
					owner,
					extraOptions,
					url,
					viewClass,
					title = args.title;

			owner = TinySC.Utils.getOwnerView(editor);

			if (title) {
				// Boy do I hate doing this... TinyMCE changed how they open windows, so title is the best thing we have to
				// match now.
				switch (title) {
				case 'Table properties':
					// Insert Table
					viewClass = this._setupTablePropertiesDialog(editor, args.onsubmit);
					break;
				case 'Cell properties':
					// Cell Properties
					viewClass = this._setupRowCellPropertiesDialog(editor, false);
					break;
				case 'Row properties':
					// Row Properties
					viewClass = this._setupRowCellPropertiesDialog(editor, true);
					break;
				case 'Merge cells':
					// Merge Cells
					viewClass = this._setupMergeCellsDialog(editor, args.onsubmit);
					break;
				case 'Source code':
					// HTML editor, used in debug
					viewClass = this._setupSourceEditorDialog(editor);
					break;
				default:
					// no-op
				}

			}

			if (viewClass) {
				// We implemented this window, its been setup, now open it.
				this._openDialog(editor, viewClass, owner, extraOptions);
			} // else we shouldn't be here...we are using all our own dialogs (for now)
		},

		/**
		 * Opens a dialog according to the app specified method.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {SC.PanelPane} viewClass Dialog class to create and open.
		 * @param {SC.PanelPane} owner Dialog owner.
		 * @param {Object} opts Optional extra options.
		 */
		_openDialog: function (ed, viewClass, owner, opts) {
			var view;

			opts = SC.mixin(opts, {
				owner: owner
			});

			view = viewClass.create(opts);

			if (ed.plugins.sproutcore) {
				ed.plugins.sproutcore.openDialog(ed, view);
			}
		},

		/**
		 * Setup the table properties dialog.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @return {TinySC.TablePropertiesPane} View class to create.
		 */
		_setupTablePropertiesDialog: function (ed, onsubmit) {
			var viewClass, controller, selectedNode, tableElement, $tableElement,
					cellPadding, cellSpacing, border, alignment, backgroundColor;

			viewClass = TinySC.TablePropertiesPane;
			controller = TinySC.tablePropertiesController;

			selectedNode = ed.selection.getNode();
			tableElement = ed.dom.getParent(selectedNode, 'table');

			if (tableElement) {
				$tableElement = $(tableElement);

				cellPadding = parseInt(tableElement.cellPadding, 10);
				if (!isFinite(cellPadding)) {
					cellPadding = 0;
				}
				cellSpacing = parseInt(tableElement.cellSpacing, 10);
				if (!isFinite(cellSpacing)) {
					cellSpacing = 0;
				}
				border = parseInt(tableElement.border, 10);
				if (!isFinite(border)) {
					border = 0;
				}
				alignment = tableElement.align || 'left';
				backgroundColor = tableElement.bgColor || '#ffffff'; // TODO: RGBtoHex?

				controller.beginPropertyChanges()
						.set('insertMode', false)
						.set('node', tableElement)
						.set('rows', TinySC.Utils.countTableRows($tableElement))
						.set('columns', TinySC.Utils.countTableColumns($tableElement))
						.set('width', tableElement.offsetWidth)
						.set('cellPadding', cellPadding)
						.set('cellSpacing', cellSpacing)
						.set('frame', border > 0 ? 'on' : 'off')
						.set('frameWidth', border)
						.set('alignment', alignment)
						.set('backgroundColor', backgroundColor)
						.set('onsubmit', onsubmit)
						.endPropertyChanges();
			} else {
				controller.set('insertMode', true);
			}

			return viewClass;
		},

		/**
		 * Setup the row/cell properties dialog.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {Boolean} rowMode Setup for row or cell mode.
		 * @return {TinySC.TableRowCellPropertiesPane} View class to create.
		 */
		_setupRowCellPropertiesDialog: function (ed, rowMode) {
			var viewClass, controller, selectedNode, rowCellElement, horizontalAlignment, verticalAlignment, backgroundColor;

			viewClass = TinySC.TableRowCellPropertiesPane;
			controller = TinySC.tableRowCellPropertiesController;

			selectedNode = ed.selection.getNode();
			rowCellElement = ed.dom.getParent(selectedNode, rowMode ? 'tr' : 'td');

			if (rowCellElement) {
				horizontalAlignment = rowCellElement.align || 'left';
				verticalAlignment = rowCellElement.vAlign || 'middle';
				backgroundColor = rowCellElement.bgColor || '#ffffff'; // TODO: RGBtoHex?

				controller.beginPropertyChanges()
						.set('rowMode', rowMode)
						.set('node', rowCellElement)
						.set('horizontalAlignment', horizontalAlignment)
						.set('verticalAlignment', verticalAlignment)
						.set('backgroundColor', backgroundColor)
						.endPropertyChanges();
			}

			return viewClass;
		},

		/**
		 * Setup the merge cells dialog.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {Function} mergeAction Function that does the cell merge.
		 * @return {TinySC.TableMergeCellsPane} View class to create.
		 */
		_setupMergeCellsDialog: function (ed, mergeAction) {
			var viewClass = TinySC.TableMergeCellsPane,
					controller = TinySC.tableMergeCellsController;

			controller.set('mergeAction', mergeAction);

			return viewClass;
		},

		/**
		 * Setup the image properties dialog.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @param {TinySC.WysiwygView} owner Dialog owner.
		 * @return {TinySC.InsertImagePane} View class to create.
		 */
		_setupImagePropertiesDialog: function (ed, owner) {
			var viewClass, controller, delegate, selectedNode, percentWidth, percentHeight;

			// Insert image pane and controller.
			viewClass = TinySC.InsertImagePane;
			controller = TinySC.insertImageController;

			selectedNode = ed.selection.getNode();

			if (selectedNode.tagName === 'IMG') {
				// An image was selected, we are editing an existing image.

				// We must set this false to begin, so the controller does not update width/height properties while we are setting them.
				controller.set('maintainAspectRatio', false);

				// Get values from the selected image node.
				controller.beginPropertyChanges()
						.set('insertMode', false)
						.set('fileSelected', true)
						.set('node', selectedNode)
						.set('originalWidth', selectedNode.getAttribute('data-mce-tinysc-original-width'))
						.set('originalHeight', selectedNode.getAttribute('data-mce-tinysc-original-height'))
						.set('scaledPixelWidth', selectedNode.getAttribute('width'))
						.set('scaledPixelHeight', selectedNode.getAttribute('height'))
						.set('fileName', selectedNode.getAttribute('data-mce-tinysc-file-name'))
						.set('serverFileID', selectedNode.getAttribute('data-mce-tinysc-server-file-id'))
						.set('fileSize', selectedNode.getAttribute('data-mce-tinysc-file-size'))
						.set('imageType', selectedNode.getAttribute('data-mce-tinysc-image-type'))
						.endPropertyChanges();

				// Now that the controller has calculated the %width/%height (by setting the pixel width/height above),
				// we can check if we should maintain aspect ratio.
				percentWidth = controller.get('scaledPercentWidth');
				percentHeight = controller.get('scaledPercentHeight');
				controller.set('maintainAspectRatio', percentWidth === percentHeight);
			} else {
				// No image was selected, we are inserting a new image.
				controller.set('insertMode', true);
			}

			delegate = controller.get('delegate');
			if (delegate) {
				delegate
						.set('entityType', owner.get('entityType'))
						.set('entityID', owner.get('entityID'))
						.set('subtypeID', owner.get('subtypeID'))
						.set('reportedBy', owner.get('reportedBy'))
						.set('fieldID', owner.get('fieldID'));
			}

			return viewClass;
		},

		/**
		 * Setup the link properties dialog.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @return {TinySC.InsertLinkPane} View class to create.
		 */
		_setupLinkPropertiesDialog: function (ed) {
			var viewClass, controller, selectedNode, anchorNode, tmpDiv, $q;

			// Insert Link pane and controller.
			viewClass = TinySC.InsertLinkPane;
			controller = TinySC.insertLinkController;

			// Try to find the selected anchor node.
			selectedNode = ed.selection.getNode();
			anchorNode = TinySC.Utils.findClosestAnchorNode($(selectedNode));

			// Create a temporary div with the selected HTML so we can do some inspection.
			tmpDiv = document.createElement('div');
			tmpDiv.innerHTML = ed.selection.getContent({ format: 'html' });

			if (anchorNode) {
				// We found an anchor node, we are editing an existing link.
				controller.set('insertMode', false);
				// Select the anchor node, in case it was a parent of the actual selection.
				selectedNode = ed.selection.select(anchorNode);
			} else {
				// No anchor node found, we are inserting a new link.
				controller.set('insertMode', true);
				// Try to find a child anchor node, so we can populate the dialog with its href.
				anchorNode = TinySC.Utils.findChildAnchorNode($(tmpDiv));
			}

			if (anchorNode) {
				// Populate based on the anchor node we found.
				controller.set('selectedUrlType', controller.getUrlType(anchorNode.href));
				controller.set('url', anchorNode.href);
			}

			// Set the display text based on the selection.
			controller.set('displayText', ed.selection.getContent({ format: 'text' }));

			// This is a little complicated. We are trying to figure out if the display text should be editable.
			// So we are looking to see if the selection contains anything other than anchor and text nodes.
			$q = $(tmpDiv).find('*').andSelf().contents().filter(function () {
				return (this.nodeType !== Node.TEXT_NODE && this.tagName !== 'A');
			});
			if ($q.length) {
				// We found other nodes, display text is not editable.
				TinySC.insertLinkController.set('displayTextEditable', false);
			}

			return viewClass;
		},

		/**
		 * Setup the color picker dialog.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @return {TinySC.PopupColorPicker} View class to create.
		 */
		_setupColorPicker: function (ed) {
			//jshint unused:false
			return TinySC.PopupColorPicker;
		},

		/**
		 * Setup the source editor dialog.
		 *
		 * @param {tinymce.Editor} ed Editor instance.
		 * @return {TinySC.SourceEditorPane} View class to create.
		 */
		_setupSourceEditorDialog: function (ed) {
			//jshint unused:false
			return TinySC.SourceEditorPane;
		}
	});

	// Register plugin
	tinymce.PluginManager.add('sproutcore', tinymce.plugins.SproutCorePlugin);
})();
