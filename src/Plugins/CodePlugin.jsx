import {
  $createCodeNode,
  $isCodeNode,
  registerCodeHighlighting,
} from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getPreviousSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  $getSelection,
  SELECTION_CHANGE_COMMAND,
  $getNodeByKey,
} from "lexical";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getSelectedNode } from "./TextFormatPlugin";
import { $findMatchingParent } from "@lexical/utils";
import { CodeMenu } from "../components/CodeHighlightMenu/CodeMenu";

const DOM_ELEMENT = document.body;

export const INSERT_CODE_BLOCK_COMMAND = createCommand(
  "INSERT_CODE_BLOCK_COMMAND"
);
export const SET_CODE_LANGUAGE_COMMAND = createCommand(
  "SET_CODE_LANGUAGE_COMMAND"
);

function CodeHighlightMenuPlugin() {
  const [codeBlockCoords, setCodeBlockCoords] = useState(null);
  const [codeNodeKey, setCodeNodeKey] = useState(null);
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          setCodeBlockCoords(null);
          return false;
        }

        const node = getSelectedNode(selection);
        const codeNode = $findMatchingParent(node, $isCodeNode);
        if (codeNode) {
          // update selection coordinates when selection changes and the condition is met
          const DOMNode = editor.getElementByKey(codeNode.getKey());
          const boundingRect = DOMNode.getBoundingClientRect();

          // Use top-right coordinates
          const X = boundingRect.right;
          const Y = boundingRect.top + window.scrollY;

          setCodeBlockCoords({ x: X, y: Y });
          setCodeNodeKey(codeNode.getKey());
        } else {
          setCodeBlockCoords(null);
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  return (
    codeBlockCoords &&
    createPortal(
      <CodeMenu codeBlockCoords={codeBlockCoords} codeNodeKey={codeNodeKey} />,
      DOM_ELEMENT
    )
  );
}

function CodeBlockPlugin() {
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

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      SET_CODE_LANGUAGE_COMMAND,
      (payload) => {
        const [nodeKey, language] = payload;
        const codeNode = $getNodeByKey(nodeKey);
        if ($isCodeNode(codeNode)) {
          codeNode.setLanguage(language);
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

export function CodePlugin() {
  return (
    <>
      <CodeBlockPlugin />
      <CodeHighlightMenuPlugin />
    </>
  );
}
