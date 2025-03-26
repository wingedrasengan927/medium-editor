import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_HIGH,
  createCommand,
  $getPreviousSelection,
  $isRangeSelection,
  $createParagraphNode,
} from "lexical";
import { useEffect } from "react";
import { $createHorizontalDividerNode } from "../nodes/HorizontalDividerNode";

export const INSERT_HORIZONTAL_DIVIDER_COMMAND = createCommand(
  "INSERT_HORIZONTAL_DIVIDER_COMMAND"
);

export function HorizontalDividerPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      INSERT_HORIZONTAL_DIVIDER_COMMAND,
      () => {
        const prevSelection = $getPreviousSelection();

        if ($isRangeSelection(prevSelection)) {
          const horizontalDividerNode = $createHorizontalDividerNode();
          prevSelection.insertNodes([horizontalDividerNode]);

          // Move the selection to the next line after the divider
          const nextNode =
            horizontalDividerNode.getNextSibling() ||
            horizontalDividerNode.getParent().getNextSibling();

          if (nextNode) {
            nextNode.selectStart();
          } else {
            const paragraphNode = $createParagraphNode();
            horizontalDividerNode.insertAfter(paragraphNode);
            paragraphNode.selectStart();
          }

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
