/**
 * @file Constants.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {IBorder} from './Interfaces';

const TableConstants = {
  kDefaultCellMargin: 3,
  kDefaultMaxMargin: 300
};

const BorderStyles = {
  full: 'full',
  grid: 'grid',
  box: 'box',
  none: 'none',
  custom: 'custom'
};

const TableMargins = {
  kTop: 0,
  kBottom: 1,
  kLeft: 2,
  kRight: 3
};

const MarginNames = ['top', 'bottom', 'left', 'right'];

const DefaultBorder: IBorder = {width: 1, color: '#000000'};

export {TableConstants, TableMargins, MarginNames, BorderStyles, DefaultBorder};