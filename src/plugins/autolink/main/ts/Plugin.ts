/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import PluginManager from 'tinymce/core/api/PluginManager';
import Keys from './core/Keys';
import { Editor } from 'tinymce/core/api/Editor';

PluginManager.add('autolink', function (editor: Editor) {
  Keys.setup(editor);
  return {addProtocolIfNeeded: Keys.addProtocolIfNeeded};
});

export default function () { }