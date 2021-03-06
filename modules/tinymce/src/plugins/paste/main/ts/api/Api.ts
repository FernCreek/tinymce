/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { Clipboard } from '../api/Clipboard';
import * as Utils from '../core/Utils';

const get = function (clipboard: Clipboard, quirks) {
  return {
    clipboard,
    quirks,
    trimHtml: Utils.trimHtml
  };
};

export {
  get
};
