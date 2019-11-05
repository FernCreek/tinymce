/**
 * @file jquery.ts
 * The shim for jquery, so that our code knows to use the version already loaded
 *
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
// @ts-ignore
declare const $: JQueryStatic; // tslint:disable-line:no-default-export no-any
