import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_HIGH,
  createCommand,
  $getPreviousSelection,
  $isRangeSelection,
  $createParagraphNode,
} from "lexical";
import { useEffect } from "react";
import {
  $createHorizontalDividerNode,
  HorizontalDividerNode,
} from "../nodes/HorizontalDividerNode";

export const INSERT_HORIZONTAL_DIVIDER_COMMAND = createCommand(
  "INSERT_HORIZONTAL_DIVIDER_COMMAND"
);

export function HorizontalDividerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([HorizontalDividerNode])) {
      throw new Error("HorizontalDividerNode not registered on editor");
    }

    const unregisterCommand = editor.registerCommand(
      INSERT_HORIZONTAL_DIVIDER_COMMAND,
      () => {
        const prevSelection = $getPreviousSelection();

        if ($isRangeSelection(prevSelection)) {
          const horizontalDividerNode = $createHorizontalDividerNode();
          prevSelection.insertNodes([horizontalDividerNode]);

          // Move the selection to the next line after the divider
          let nextNode =
            horizontalDividerNode.getNextSibling() ||
            horizontalDividerNode.getParent().getNextSibling();

          if (!nextNode) {
            nextNode = $createParagraphNode();
            horizontalDividerNode.insertAfter(nextNode);
          }
          nextNode.selectStart();

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return unregisterCommand;
  }, [editor]);

  return null;
}
