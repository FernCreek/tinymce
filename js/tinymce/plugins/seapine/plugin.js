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
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 * This call is done before the editor instance has finished it's initialization so use the onInit event
		 * of the editor instance to intercept that event.
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
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
					var body = this.getBody(), $body = $(body), s = this.settings, cm = this.controlManager, buttons, i, l, c;
					ro = !!ro;

					if (!this.plugins.seapine || (ro && this.plugins.seapine.readonly) || (!ro && !this.plugins.seapine.readonly)) {
						// If readonly value didn't change, do nothing.
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
