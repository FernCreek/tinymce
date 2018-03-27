/**
 * @file Interfaces.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */

interface IBorder {
  width: number;
  color: string;
}

interface ICellBorders {
  left: IBorder;
  top: IBorder;
  right: IBorder;
  bottom: IBorder;
}

interface IRowBorders extends ICellBorders {
  vertical: IBorder;
}

interface ITableBorders extends IRowBorders {
  horizontal: IBorder;
}

interface ISharedBorderStyle {
  style: string;
  commonWidth?: number;
  commonColor?: string;
}

interface ICellMargins {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface IAlignment {
  horizontal: string;
  vertical: string;
}

export {IBorder, ICellBorders, IRowBorders, ITableBorders, ICellMargins, IAlignment, ISharedBorderStyle};