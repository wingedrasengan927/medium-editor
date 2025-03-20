import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from "lexical";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { $findMatchingParent } from "@lexical/utils";

import InlineToolbar from "../components/InlineToolbar/InlineToolbar";
import { $isMathNode } from "../nodes/MathNode";
import {
  $isMathHighlightNodeBlock,
  $isMathHighlightNodeInline,
} from "../nodes/MathHighlightNode";

const DOM_ELEMENT = document.body;

export default function InlineToolbarPlugin() {
  const [shouldShow, setShouldShow] = useState(false);
  const [editor] = useLexicalComposerContext();

  // Listen for selection changes and show/hide the toolbar
  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
          setShouldShow(false);
          return false;
        }

        // Get all selected nodes
        const nodes = selection.getNodes();

        // Don't show if any Math nodes are in the selection
        const hasMathNode = nodes.some((node) => $isMathNode(node));

        // Don't show if only one node is selected and it's a MathHighlightNode
        const isSingleMathHighlight =
          nodes.length === 1 &&
          ($isMathHighlightNodeInline(nodes[0]) ||
            $findMatchingParent(nodes[0], $isMathHighlightNodeBlock));

        setShouldShow(!hasMathNode && !isSingleMathHighlight);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  return (
    shouldShow && createPortal(<InlineToolbar editor={editor} />, DOM_ELEMENT)
  );
}
