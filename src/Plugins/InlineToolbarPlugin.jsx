import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from "lexical";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import InlineToolbar from "../components/InlineToolbar/InlineToolbar";

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
        setShouldShow($isRangeSelection(selection) && !selection.isCollapsed());
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
