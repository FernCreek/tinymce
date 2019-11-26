/**
 * @file TableRowCell.ts
 * @copyright 2016-2018 Perforce Software, Inc. and its subsidiaries.
 * Released under LGPL License.
 * License: http://www.tinymce.com/license
 */
import {TinySC} from 'shims/tinysc';

const cellBorders: string[] = ['top', 'left', 'bottom', 'right'];
const rowBorders = cellBorders.concat(['vertical']);
const tableBorders = rowBorders.concat(['horizontal']);
// See seapinetable plugin constants
const TableMargins = {
  kTop: 0,
  kBottom: 1,
  kLeft: 2,
  kRight: 3
};

const getInitialVars = (editor, selector) => {
  const tablePlugin = editor.plugins.seapinetable;
  const element = editor.dom.getParent( editor.selection.getNode(), selector);
  const $jElement = $(element);
  return {tablePlugin, element, $jElement};
};

const getEnumForBorderStyleString = (styleString) => {
  let styleEnum;
  switch (styleString) {
    case 'full':
      styleEnum = TinySC.BorderStyles.full;
      break;
    case 'box':
      styleEnum = TinySC.BorderStyles.box;
      break;
    case 'grid':
      styleEnum = TinySC.BorderStyles.grid;
      break;
    case 'custom':
      styleEnum = TinySC.BorderStyles.custom;
      break;
    default:
      styleEnum = TinySC.BorderStyles.none;
      break;
  }
  return styleEnum;
};

const getMarginsBgColor = ($jElement, getMarginsFn, rawBgColor) => {
  return {margins: getMarginsFn($jElement), bgColor: (rawBgColor || '').toUpperCase()};
};

const setBorderColorWidthOnController = (controller, borderStyle) => {
  controller.updateBorderContainerLists();
  if (borderStyle.commonColor) {
    controller.set('borderColor', borderStyle.commonColor);
  }
  if (borderStyle.commonWidth) {
    controller.set('borderWidth', borderStyle.commonWidth);
  }
};

const getRowCellAlignments = (plugin, $cells) => {
  const hAlign = plugin.getTableCellsTextAlignment($cells) || 'left';
  const vAlign = plugin.getTableCellsVerticalTextAlignment($cells) || 'middle';
  return {hAlign, vAlign};
};

const setBordersOnController = ($jElement, borderNames, borderCmd, controller) => {
  const borderInterface = {};
  borderNames.forEach((borderName) => {
    const border = borderCmd($jElement, borderName);
    controller.set(borderName + 'Border', TinySC.Border.create(border));
    borderInterface[borderName] = Object.assign({}, border);
  });
  return borderInterface;
};

const setPropertiesOnController = (controller, properties, margins) => {
  const applyToController = (props) => props.forEach(({name, value}) => controller.set(name, value));

  const setMarginsOnController = () => {
    const marginProperties = [
      {name: 'top', value: margins[TableMargins.kTop]},
      {name: 'bottom', value: margins[TableMargins.kBottom]},
      {name: 'left', value: margins[TableMargins.kLeft]},
      {name: 'right', value: margins[TableMargins.kRight]}
    ].map((property) => ({name: property.name + 'CellMargin', value: property.value}));
    applyToController(marginProperties);
  };

  controller.beginPropertyChanges();
  applyToController(properties);
  setMarginsOnController();
  controller.endPropertyChanges();
};

const setupTableProperties = (editor, onSubmit) => {
  const {tablePlugin, element, $jElement} = getInitialVars(editor, 'table');
  const controller = TinySC.tablePropertiesController;

  if (element && tablePlugin) {
    const cellSpacing = $jElement.css('border-collapse') === 'separate' ?
      tablePlugin.getNumFromPxString($jElement.css('border-spacing')) : 0;
    const alignment = tablePlugin.getTableAlignment($jElement) || 'left';
    const borders = setBordersOnController($jElement, tableBorders, tablePlugin.getBorderForTable, controller);
    const borderStyle = tablePlugin.getBorderStyleForTable(borders);

    const {margins, bgColor} = getMarginsBgColor(
      $jElement, tablePlugin.getTableMarginsArray, tablePlugin.getTableBackgroundColor($jElement)
    );
    setBorderColorWidthOnController(controller, borderStyle);
    const properties = [
      {name: 'insertMode', value: false},
      {name: 'node', value: element},
      {name: 'rows', value: tablePlugin.countTableRows($jElement)},
      {name: 'columns', value: tablePlugin.countTableColumns($jElement)},
      {name: 'width', value: element.offsetWidth},
      {name: 'cellSpacing', value: cellSpacing},
      {name: 'alignment', value: alignment},
      {name: 'backgroundColor', value: bgColor},
      {name: 'borderStyle', value: getEnumForBorderStyleString(borderStyle.style)},
      {name: 'onsubmit', value: onSubmit}
    ];
    setPropertiesOnController(controller, properties, margins);
  } else {
    controller.set('insertMode', true);
  }
};

const setupRowCellProperties = (editor, forCell) => {
  const {tablePlugin, element, $jElement} = getInitialVars(editor, forCell ? 'td' : 'tr');
  const controller = forCell ? TinySC.cellPropertiesController : TinySC.rowPropertiesController;

  if (element && tablePlugin) {
    // These are specific to whether this is for a row or a cell
    let borders, borderStyle, bOverrideMargins, $cells, getMarginsFn;

    if (forCell) { // Get cell specific properties
      borders = setBordersOnController($jElement, cellBorders, tablePlugin.getBorderForCell, controller);
      borderStyle = tablePlugin.getBorderStyleForCell(borders);
      bOverrideMargins = tablePlugin.doesCellOverrideMargins($jElement);
      $cells = $jElement;
      getMarginsFn = tablePlugin.getElementMarginsArray;
    } else { // Get row specific properties
      borders = setBordersOnController($jElement, rowBorders, tablePlugin.getBorderForRow, controller);
      borderStyle = tablePlugin.getBorderStyleForRow(borders);
      bOverrideMargins = tablePlugin.isPaddingExplicitlySet($jElement);
      $cells = $jElement.find('td');
      getMarginsFn = tablePlugin.getRowMarginsArray;
    }

    const {margins, bgColor} = getMarginsBgColor($jElement, getMarginsFn, tablePlugin.getTableCellsBackgroundColor($cells));
    const {hAlign, vAlign} = getRowCellAlignments(tablePlugin, $cells);
    setBorderColorWidthOnController(controller, borderStyle);

    const properties = [
      {name: 'rowMode', value: !forCell},
      {name: 'node', value: element},
      {name: 'horizontalAlignment', value: hAlign},
      {name: 'verticalAlignment', value: vAlign},
      {name: 'backgroundColor', value: bgColor},
      {name: 'overrideMargins', value: bOverrideMargins},
      {name: 'borderStyle', value: getEnumForBorderStyleString(borderStyle.style)},
    ];
    setPropertiesOnController(controller, properties, margins);
  }
};

export default {
  setupRowCellProperties,
  setupTableProperties
};
