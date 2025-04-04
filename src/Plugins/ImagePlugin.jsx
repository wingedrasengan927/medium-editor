import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  createCommand,
  COMMAND_PRIORITY_HIGH,
  $getPreviousSelection,
  $isRangeSelection,
  $createParagraphNode,
  SELECTION_CHANGE_COMMAND,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_LOW,
  $getNodeByKey,
  PASTE_COMMAND,
} from "lexical";
import { useEffect, useRef } from "react";
import { $createImageNode, $isImageNode, ImageNode } from "../nodes/ImageNode";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";

export const INSERT_IMAGE_COMMAND = createCommand("INSERT_IMAGE_COMMAND");
const SELECTED_CLASS_NAME = "selected";

// Helper to check if a file is an image
function isImageFile(file) {
  return file && file.type && file.type.startsWith("image/");
}

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();
  const selectedImgElemRef = useRef(null);

  useEffect(() => {
    if (!editor.hasNode(ImageNode)) {
      throw new Error("ImagePlugin: ImageNode not registered on editor");
    }

    const unregisterCommand = editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const src = payload;
        const prevSelection = $getPreviousSelection();

        if ($isRangeSelection(prevSelection)) {
          const imageNode = $createImageNode(src);
          prevSelection.insertNodes([imageNode]);

          let nextNode =
            imageNode.getNextSibling() ||
            imageNode.getParent().getNextSibling();

          // insert a new paragraph node after the image node
          if (!nextNode) {
            nextNode = $createParagraphNode();
            imageNode.insertAfter(nextNode);
          }

          // select the image after inserting
          imageNode.select();

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return unregisterCommand;
  }, [editor]);

  // handle selection
  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        // clear previous selection
        if (selectedImgElemRef.current) {
          selectedImgElemRef.current.classList.remove(SELECTED_CLASS_NAME);
          selectedImgElemRef.current = null;
        }

        const selection = $getSelection();
        if ($isNodeSelection(selection) && selection.getNodes().length === 1) {
          const node = selection.getNodes()[0];
          if ($isImageNode(node)) {
            const DOMElement = editor.getElementByKey(node.getKey());
            DOMElement.classList.add(SELECTED_CLASS_NAME);
            selectedImgElemRef.current = DOMElement;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return unregisterCommand;
  }, [editor]);

  // --- Handle PASTE_COMMAND ---
  useEffect(() => {
    const unregisterPasteCommand = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        const files = Array.from(clipboardData.files);
        const imageFiles = files.filter(isImageFile);

        if (imageFiles.length === 1) {
          event.preventDefault();

          const imageFile = imageFiles[0];
          const selection = $getSelection() || $getPreviousSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          // Create a blob URL for the single image
          const imageUrl = URL.createObjectURL(imageFile);
          const imageNode = $createImageNode(imageUrl);

          // Insert the image node
          selection.insertNodes([imageNode]);

          // Insert a paragraph node after the image node if the next node is empty
          let nextNode =
            imageNode.getNextSibling() ||
            imageNode.getParent().getNextSibling();

          if (!nextNode) {
            nextNode = $createParagraphNode();
            imageNode.insertAfter(nextNode);
          }

          imageNode.select();

          // URL.revokeObjectURL(imageUrl);

          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return unregisterPasteCommand;
  }, [editor]);

  return (
    // Make the Image selectable
    <NodeEventPlugin
      nodeType={ImageNode}
      eventType={"click"}
      eventListener={(event, editor, key) => {
        const node = $getNodeByKey(key);
        node.select();
      }}
    />
  );
}
