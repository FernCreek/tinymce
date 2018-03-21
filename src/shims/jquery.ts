/**
 * @file The shim for jquery, so that our code knows to use the version already loaded
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

// tslint:disable:no-reference
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
// tslint:enable:no-reference
export default (window as any).$ as JQueryStatic; // tslint:disable-line:no-default-export no-any