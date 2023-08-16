/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import { trimHtml } from '../core/Utils';
import { Clipboard } from './Clipboard';

export interface Api {
  readonly clipboard: Clipboard;
  trimHtml: typeof trimHtml;
}

const get = (clipboard: Clipboard): Api => ({
  clipboard,
  trimHtml
});

export {
  get
};
