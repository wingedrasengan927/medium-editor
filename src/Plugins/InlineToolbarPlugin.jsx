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
import { $isCodeNode } from "@lexical/code";

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

        const isCodeBlock = nodes.some((node) =>
          $findMatchingParent(node, $isCodeNode)
        );

        setShouldShow(!hasMathNode && !isSingleMathHighlight && !isCodeBlock);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  // Handle Focus/Blur
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  useEffect(() => {
    const handleFocus = () => setIsEditorFocused(true);
    const handleBlur = (event) => {
      // Delay to check if we clicked on the toolbar
      setTimeout(() => {
        const toolbarElement = document.getElementById("inline-toolbar");
        if (
          toolbarElement &&
          (toolbarElement === document.activeElement ||
            toolbarElement.contains(document.activeElement) ||
            toolbarElement.contains(event.relatedTarget))
        ) {
          return;
        }
        setIsEditorFocused(false);
      }, 10);
    };

    const unregisterListener = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        if (rootElement) {
          rootElement.addEventListener("focus", handleFocus);
          rootElement.addEventListener("blur", handleBlur);
          // Check initial focus
          if (document.activeElement === rootElement) {
            setIsEditorFocused(true);
          }
        }

        if (prevRootElement) {
          prevRootElement.removeEventListener("focus", handleFocus);
          prevRootElement.removeEventListener("blur", handleBlur);
        }
      }
    );

    return unregisterListener;
  }, [editor]);

  return (
    shouldShow &&
    isEditorFocused &&
    createPortal(<InlineToolbar editor={editor} />, DOM_ELEMENT)
  );
}
