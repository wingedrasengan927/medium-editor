import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $isParagraphNode,
} from "lexical";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { getSelectedNode } from "./TextFormatPlugin";

import BlockToolbarPopover from "../components/BlockToolbar/BlockToolbar";

const DOM_ELEMENT = document.body;

export default function BlockToolbarPlugin({ toolbarGap }) {
  const [selectionRectCoords, setSelectionRectCoords] = useState(null);
  const [editor] = useLexicalComposerContext();
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [toolbarActive, setToolbarActive] = useState(false);

  // Generate unique IDs specific to this editor instance
  const randomStringRef = useRef(Math.random().toString(36).substring(2, 9));
  const toolbarTriggerId = `block-toolbar-trigger-${randomStringRef.current}`;
  const toolbarPopoverId = `block-toolbar-popover-${randomStringRef.current}`;

  const handleFocus = () => setIsEditorFocused(true);
  const handleBlur = (event) => {
    // Delay the blur event to give time for toolbar click to register
    setTimeout(() => {
      const toolbarTrigger = document.getElementById(toolbarTriggerId);
      if (
        toolbarTrigger &&
        (toolbarTrigger === document.activeElement ||
          toolbarTrigger.contains(document.activeElement) ||
          toolbarTrigger.contains(event.relatedTarget))
      ) {
        // Don't update focus state if we're clicking on the toolbar trigger
        return;
      }
      setIsEditorFocused(false);
    }, 10);
  };

  // Add observer to detect if toolbar is active
  useEffect(() => {
    const checkToolbarPresence = () => {
      const isPresent = !!document.getElementById(toolbarPopoverId);
      setToolbarActive(isPresent);
    };

    const observer = new MutationObserver(checkToolbarPresence);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Initial check
    checkToolbarPresence();

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const unregisterListener = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        if (rootElement) {
          rootElement.addEventListener("focus", handleFocus);
          rootElement.addEventListener("blur", handleBlur);
        }

        if (prevRootElement) {
          prevRootElement.removeEventListener("focus", handleFocus);
          prevRootElement.removeEventListener("blur", handleBlur);
        }
      }
    );

    return unregisterListener;
  }, [editor]);

  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        // Check editor focus state during selection changes
        const rootElement = editor.getRootElement();
        if (rootElement) {
          const hasFocus =
            rootElement === document.activeElement ||
            rootElement.contains(document.activeElement);

          // Update focus state only if it changed to avoid re-renders
          if (hasFocus !== isEditorFocused) {
            setIsEditorFocused(hasFocus);
          }
        }

        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setSelectionRectCoords(null);
          return false;
        }

        const node = getSelectedNode(selection);
        if ($isParagraphNode(node) && node.getTextContent() === "") {
          // update selection coordinates when selection changes and the condition is met
          const DOMElement = editor.getElementByKey(node.getKey());

          if (DOMElement) {
            const boundingRect = DOMElement.getBoundingClientRect();
            const X = boundingRect.left;
            const centerY =
              boundingRect.top + boundingRect.height / 2 + window.scrollY;

            setSelectionRectCoords({ x: X, y: centerY });
          } else {
            setSelectionRectCoords(null);
          }
        } else {
          setSelectionRectCoords(null);
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor, isEditorFocused]);

  return (
    selectionRectCoords &&
    (isEditorFocused || toolbarActive) &&
    createPortal(
      <BlockToolbarPopover
        selectionRectCoords={selectionRectCoords}
        TOOLBAR_OFFSET={toolbarGap}
        toolbarTriggerId={toolbarTriggerId}
        toolbarPopoverId={toolbarPopoverId}
      />,
      DOM_ELEMENT
    )
  );
}
