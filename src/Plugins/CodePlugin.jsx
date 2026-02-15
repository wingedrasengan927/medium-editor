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
  BLUR_COMMAND,
  $getNodeByKey,
  KEY_BACKSPACE_COMMAND,
  TextNode,
  $isLineBreakNode,
  $isParagraphNode,
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
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [editor] = useLexicalComposerContext();

  const hideCodeMenu = () => {
    setCodeBlockCoords(null);
    setCodeNodeKey(null);
  };

  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const rootElement = editor.getRootElement();
        if (rootElement) {
          const hasFocus =
            rootElement === document.activeElement ||
            rootElement.contains(document.activeElement);

          setIsEditorFocused((prev) => (prev === hasFocus ? prev : hasFocus));
        }

        const selection = $getSelection();

        if (!$isRangeSelection(selection)) {
          hideCodeMenu();
          return false;
        }

        const node = getSelectedNode(selection);
        const codeNode = $findMatchingParent(node, $isCodeNode);
        if (codeNode) {
          // update selection coordinates when selection changes and the condition is met
          const DOMElement = editor.getElementByKey(codeNode.getKey());
          const boundingRect = DOMElement.getBoundingClientRect();

          // Use top-right coordinates
          const X = boundingRect.right;
          const Y = boundingRect.top + window.scrollY;

          setCodeBlockCoords({ x: X, y: Y });
          setCodeNodeKey(codeNode.getKey());
        } else {
          hideCodeMenu();
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        setIsEditorFocused(false);
        hideCodeMenu();
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    const handleFocus = () => {
      setIsEditorFocused(true);
    };

    const handleBlur = () => {
      setIsEditorFocused(false);
      hideCodeMenu();
    };

    return editor.registerRootListener((rootElement, prevRootElement) => {
      if (rootElement) {
        rootElement.addEventListener("focus", handleFocus);
        rootElement.addEventListener("blur", handleBlur);
      }

      if (prevRootElement) {
        prevRootElement.removeEventListener("focus", handleFocus);
        prevRootElement.removeEventListener("blur", handleBlur);
      }
    });
  }, [editor]);

  return (
    codeBlockCoords &&
    isEditorFocused &&
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
    const removeTransform = editor.registerNodeTransform(TextNode, (node) => {
      if (!node.isSimpleText()) {
        return;
      }

      const text = node.getTextContent();

      // Check for Code Block Trigger: "``` " at start of line/paragraph
      if (text.startsWith("``` ")) {
        const prevSibling = node.getPreviousSibling();
        const parentNode = $findMatchingParent(node, $isParagraphNode);
        const isStartOfParagraph =
          parentNode !== null && parentNode.getChildrenSize() === 1;
        const isAfterLineBreak = $isLineBreakNode(prevSibling);

        if (isStartOfParagraph || isAfterLineBreak) {
          // If there is more text after "``` ", don't do anything
          if (text.length > 4) {
            return;
          }

          // Create the new code block
          const codeNode = $createCodeNode();

          // Replace "``` " with the code block
          node.replace(codeNode);

          // Select the code block
          codeNode.select();

          // Check if the next sibling is a LineBreakNode and remove it
          const nextSibling = codeNode.getNextSibling();
          if ($isLineBreakNode(nextSibling)) {
            nextSibling.remove();
          }

          return;
        }
      }
    });

    return removeTransform;
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

          // Bring the focus back to the editor
          setTimeout(() => {
            editor.focus();
          }, 0);

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

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const node = selection.anchor.getNode();
        const codeNode = $findMatchingParent(node, $isCodeNode);

        if (codeNode) {
          // Check if we are at the beginning of the code block
          if (selection.anchor.offset === 0) {
            // Check if code block is empty (only has empty text node or line break)
            const textContent = codeNode.getTextContent();
            if (textContent === "") {
              codeNode.remove();
              return true;
            }
          }
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
