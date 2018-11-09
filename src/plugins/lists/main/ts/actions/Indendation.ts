/**
 * Indentation.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2018 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

import { Arr } from '@ephox/katamari';
import { Compare, Element, Replication, Traverse } from '@ephox/sugar';
import { Editor } from 'tinymce/core/api/Editor';
import Range from '../core/Range';
import Selection from '../core/Selection';
import SplitList from '../core/SplitList';
import { IndentValue } from '../listModel/Indentation';
import { listsIndentation } from '../listModel/ListsIndendation';
import Outdent from './Outdent';
import ToggleList from './ToggleList';

const outdentDlItem = (editor: Editor, item: Element): void => {
  if (Compare.is(item, 'DD')) {
    Replication.mutate(item, 'DT');
  } else if (Compare.is(item, 'DT')) {
    Traverse.parent(item).each((dl) => SplitList.splitList(editor, dl.dom(), item.dom()));
  }
};

const indentDlItem = (item: Element): void => {
  if (Compare.is(item, 'DT')) {
    Replication.mutate(item, 'DD');
  }
};

const dlIndentation = (editor: Editor, indentation: IndentValue, dlItems: Element[]) => {
  if (indentation === IndentValue.Indent) {
    Arr.each(dlItems, indentDlItem);
  } else {
    Arr.each(dlItems, (item) => outdentDlItem(editor, item));
  }
};

const selectionIndentation = (editor: Editor, indentation: IndentValue) => {
  const dlItems = Arr.map(Selection.getSelectedDlItems(editor), Element.fromDom);
  const lists = Arr.map(Selection.getSelectedListRoots(editor), Element.fromDom);

  if (dlItems.length || lists.length) {
    const bookmark = editor.selection.getBookmark();

    dlIndentation(editor, indentation, dlItems);

    listsIndentation(
      editor,
      lists,
      indentation
    );

    editor.selection.moveToBookmark(bookmark);
    editor.selection.setRng(Range.normalizeRange(editor.selection.getRng()));
    editor.nodeChanged();
  }
};

const indentListSelection = (editor: Editor) => {
  selectionIndentation(editor, IndentValue.Indent);
};

const outdentListSelection = (editor: Editor) => {
  // selectionIndentation(editor, IndentValue.Outdent);
  Outdent.outdentSelection(editor);
};

const flattenListSelection = (editor: Editor) => {
  // selectionIndentation(editor, IndentValue.Flatten);
  ToggleList.removeList(editor)
};

export { indentListSelection, outdentListSelection, flattenListSelection };
