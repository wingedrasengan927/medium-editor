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
  $setSelection,
  COMMAND_PRIORITY_LOW,
  $getNodeByKey,
  PASTE_COMMAND,
  BLUR_COMMAND,
} from "lexical";
import { useEffect, useRef } from "react";
import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  IMAGE_UPLOAD_STATE,
} from "../nodes/ImageNode";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";

export const INSERT_IMAGE_COMMAND = createCommand("INSERT_IMAGE_COMMAND");
const SELECTED_CLASS_NAME = "selected";

function isImageFile(file) {
  return file && file.type && file.type.startsWith("image/");
}

// Inserts an ImageNode at the current selection and returns its key so the
// caller can update it later (e.g. when a background upload resolves).
function $insertImageNode(src, uploadState) {
  const prevSelection = $getPreviousSelection() || $getSelection();
  if (!$isRangeSelection(prevSelection)) {
    return null;
  }

  const imageNode = $createImageNode(src, uploadState);
  prevSelection.insertNodes([imageNode]);

  let nextNode =
    imageNode.getNextSibling() || imageNode.getParent().getNextSibling();
  if (!nextNode) {
    nextNode = $createParagraphNode();
    imageNode.insertAfter(nextNode);
  }

  imageNode.select();
  return imageNode.getKey();
}

export function ImagePlugin({ onImageUpload }) {
  const [editor] = useLexicalComposerContext();
  const selectedImgElemRef = useRef(null);
  const onImageUploadRef = useRef(onImageUpload);

  useEffect(() => {
    onImageUploadRef.current = onImageUpload;
  }, [onImageUpload]);

  useEffect(() => {
    if (!editor.hasNode(ImageNode)) {
      throw new Error("ImagePlugin: ImageNode not registered on editor");
    }
  }, [editor]);

  // Kick off an async upload for a node already inserted with a blob URL.
  // On success swap the src to the returned URL and revoke the blob.
  // On failure mark the node as errored but keep the blob URL visible.
  const startUpload = (nodeKey, file, blobUrl) => {
    const upload = onImageUploadRef.current;
    if (!upload) return;

    Promise.resolve()
      .then(() => upload(file))
      .then((remoteUrl) => {
        if (typeof remoteUrl !== "string" || !remoteUrl) {
          throw new Error("onImageUpload must resolve to a URL string");
        }
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.setSrc(remoteUrl);
            node.setUploadState(IMAGE_UPLOAD_STATE.UPLOADED);
          }
        });
        URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("ImagePlugin: image upload failed", err);
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.setUploadState(IMAGE_UPLOAD_STATE.ERROR);
          }
        });
      });
  };

  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        // String payload: caller already has a usable URL — just insert.
        if (typeof payload === "string") {
          $insertImageNode(payload, IMAGE_UPLOAD_STATE.UPLOADED);
          return true;
        }

        // File payload: show immediately via blob URL, upload in background.
        if (payload instanceof File && isImageFile(payload)) {
          const blobUrl = URL.createObjectURL(payload);
          const hasUpload = !!onImageUploadRef.current;
          const key = $insertImageNode(
            blobUrl,
            hasUpload
              ? IMAGE_UPLOAD_STATE.UPLOADING
              : IMAGE_UPLOAD_STATE.UPLOADED
          );
          if (key && hasUpload) {
            startUpload(key, payload, blobUrl);
          }
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

  // Unselect image node when the editor loses focus
  useEffect(() => {
    const unregisterBlurCommand = editor.registerCommand(
      BLUR_COMMAND,
      () => {
        const selection = $getSelection();
        if (
          $isNodeSelection(selection) &&
          selection.getNodes().length === 1 &&
          $isImageNode(selection.getNodes()[0])
        ) {
          $setSelection(null);
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return unregisterBlurCommand;
  }, [editor]);

  useEffect(() => {
    const unregisterPasteCommand = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const imageFiles = Array.from(clipboardData.files).filter(isImageFile);
        if (imageFiles.length !== 1) return false;

        const selection = $getSelection() || $getPreviousSelection();
        if (!$isRangeSelection(selection)) return false;

        event.preventDefault();
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, imageFiles[0]);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    return unregisterPasteCommand;
  }, [editor]);

  return (
    <NodeEventPlugin
      nodeType={ImageNode}
      eventType={"click"}
      eventListener={(event, editor, key) => {
        if (!editor.isEditable()) {
          return;
        }
        const node = $getNodeByKey(key);
        node.select();
      }}
    />
  );
}
