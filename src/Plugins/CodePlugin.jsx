import { $createCodeNode, registerCodeHighlighting } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getPreviousSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  createCommand,
} from "lexical";
import { useEffect } from "react";

export const INSERT_CODE_BLOCK_COMMAND = createCommand(
  "INSERT_CODE_BLOCK_COMMAND"
);

export function CodePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      INSERT_CODE_BLOCK_COMMAND,
      () => {
        const prevSelection = $getPreviousSelection();
        if ($isRangeSelection(prevSelection)) {
          const codeBlockNode = $createCodeNode();
          prevSelection.insertNodes([codeBlockNode]);
          codeBlockNode.selectStart();
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
