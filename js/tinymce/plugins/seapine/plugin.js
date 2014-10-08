/**
 * plugin.js
 *
 * Copyright 2014, Seapine Software Inc
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 */

/*global tinymce:true, $: false */

(function() {

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
		init : function(ed) {
			// Override some formats.
			ed.on('init', function() {
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
					]
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
				makeReadOnly: function(ro) {

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
					if(this.getBody() && this.plugins.seapine) {


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
				getReadOnly: function() {
					return this.plugins.seapine ? this.plugins.seapine.readonly : false;
				}
			});
		},

		/**
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo : function() {
			return {
				longname : 'Seapine plugin',
				author : 'Seapine Software Inc',
				authorurl : 'http://www.seapine.com',
				infourl : 'http://www.seapine.com',
				version : '0.1'
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('seapine', tinymce.plugins.SeapinePlugin);
})();
