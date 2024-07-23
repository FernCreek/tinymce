/**
 * @file Plugin.ts
 * Plugin for interacting with the Qt interface used by native clients when editing.
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

// eslint-disable-next-line notice/notice
import { QtHostInterface } from 'sp-qt-web-engine-util';

import PluginManager from 'tinymce/core/api/PluginManager';

import { configureHostInterfaceForContentActions, getContentActions } from './core/Content';
import * as Formatting from './core/Format';
import { configureHostInterfaceForImageActions, getImageActions, getImageActionsWithoutEditor } from './core/Image';
import { configureHostInterfaceForLinkActions, getLinkActions } from './core/Link';
import * as Misc from './core/Misc';
import { configureHostInterfaceForNodeChanged, nodeChanged } from './core/NodeChanged';
import { configureHostInterfaceForTableActions, getTableActions } from './core/Table';

export default () => {
  PluginManager.add('qtinterfaceeditor', (editor) => {
    const applyEditorArg = (fn) => (...args) => fn(editor, ...args);
    const applyEditorArgToObj = (obj) => Object.keys(obj).reduce((objApp, key) => Object.assign(objApp, ({ [key]: applyEditorArg(obj[key]) })), {});
    // Link handlers
    const links = applyEditorArgToObj(getLinkActions());
    // Small misc handlers, not really specific
    const misc = applyEditorArgToObj(Object.assign({}, Misc, { nodeChanged }));
    // Table handlers
    const table = applyEditorArgToObj(getTableActions());
    // Image handlers
    const image = {
      ...applyEditorArgToObj(getImageActions()),
      ...getImageActionsWithoutEditor()
    };
    // Content manipulation handlers
    const content = applyEditorArgToObj(getContentActions());
    // Formatting handlers
    const formatting = Object.assign({}, applyEditorArgToObj(Formatting), { loadDefaultFont: Formatting.loadDefaultFont });
    // return Object.assign({}, links, misc, table, image, content, formatting);
    return {
      ...links,
      ...misc,
      ...table,
      ...image,
      ...content,
      ...formatting,
      configureHostInterface: (hostInterface: QtHostInterface) => {
        configureHostInterfaceForLinkActions(hostInterface);
        configureHostInterfaceForNodeChanged(hostInterface);
        configureHostInterfaceForTableActions(hostInterface);
        configureHostInterfaceForImageActions(hostInterface);
        configureHostInterfaceForContentActions(hostInterface);
      }
    };
  });
};
