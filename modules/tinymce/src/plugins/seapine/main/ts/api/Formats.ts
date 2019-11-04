/**
 * @file Formats.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
const register = function (editor) {
  editor.on('init', () => {
    // Text selector generator
    const textSelector = (align) => ({selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div', styles: {'text-align': align}, attributes: {align: ''}});
    // Li selector generators
    const liSelector = (align, pos) => ({selector: 'li', styles: {'list-style-position': pos, 'text-align': align}});
    const noPosLiSelector = (align) => liSelector(align, '');
    const insideLiSelector = (align) => liSelector(align, 'inside');
    // Img, table shared selector generator
    const imgTableSelector = (float) => ({selector : 'img,table', collapsed: false, styles: {float}, attributes: {align: ''}});
    // Remove selector generator
    const removeSelector = (styles) => ({inline: 'span', styles, links: true, remove_similar: true});

    // Register the different formatters
    editor.formatter.register({
      alignleft: [
        textSelector('left'),
        noPosLiSelector('left'),
        imgTableSelector('left')
      ],
      aligncenter: [
        textSelector('center'),
        insideLiSelector('center'),
        // Images and tables need to be handled separately for center alignment
        {selector : 'img', collapsed : false, styles : {display : 'block', marginLeft : 'auto', marginRight : 'auto'}},
        {selector : 'table', collapsed : false, styles: {float: 'none', marginLeft : 'auto', marginRight: 'auto'}, attributes: {align: ''}}
      ],
      alignright: [
        textSelector('right'),
        insideLiSelector('right'),
        imgTableSelector('right')
      ],
      alignfull: [
        textSelector('justify'),
        noPosLiSelector('justify')
      ],
      removefontsize: removeSelector({fontSize: ''}),
      removefontname: removeSelector({fontFamily: ''})
    });
  });
};

export default {
  register
};