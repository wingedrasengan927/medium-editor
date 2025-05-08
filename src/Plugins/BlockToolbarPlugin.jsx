import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isParagraphNode,
} from "lexical";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getSelectedNode } from "./TextFormatPlugin";

import BlockToolbarPopover from "../components/BlockToolbar/BlockToolbar";

const DOM_ELEMENT = document.body;

export default function BlockToolbarPlugin({ toolbarGap }) {
  const [selectionRectCoords, setSelectionRectCoords] = useState(null);
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setSelectionRectCoords(null);
          return false;
        }

        const node = getSelectedNode(selection);
        if ($isParagraphNode(node) && node.getTextContent() === "") {
          // update selection coordinates when selection changes and the condition is met
          const DOMElement = editor.getElementByKey(node.getKey());
          const boundingRect = DOMElement.getBoundingClientRect();

          const X = boundingRect.left;
          const centerY =
            boundingRect.top + boundingRect.height / 2 + window.scrollY;

          setSelectionRectCoords({ x: X, y: centerY });
        } else {
          setSelectionRectCoords(null);
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  return (
    selectionRectCoords &&
    createPortal(
      <BlockToolbarPopover
        selectionRectCoords={selectionRectCoords}
        TOOLBAR_OFFSET={toolbarGap}
      />,
      DOM_ELEMENT
    )
  );
}
