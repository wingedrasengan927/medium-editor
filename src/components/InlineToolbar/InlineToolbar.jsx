import {
  Button,
  Group,
  Separator,
  ToggleButton,
  Toolbar,
} from "react-aria-components";
import {
  IconBold,
  IconItalic,
  IconCode,
  IconTextSize,
  IconBlockquote,
  IconLink,
} from "@tabler/icons-react";
import { useEffect, useState, useRef } from "react";
import {
  $getSelection,
  $isRangeSelection,
  $getCharacterOffsets,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { createDOMRange } from "@lexical/selection";
import {
  computeToolbarPosition,
  OFFSCREEN_POSITION,
  getBoundingRectCoords,
} from "./utils";
import {
  TOGGLE_HEADING_COMMAND,
  TOGGLE_QUOTE_COMMAND,
  updateToolbarHeadingState,
  updateToolbarQuoteState,
} from "../../Plugins/TextFormatPlugin";

import "./styles/Toolbar.css";

const ICON_SIZE = 24;
const TOP_OFFSET = 16;

export default function InlineToolbar({ editor }) {
  // State for storing the bounding rectangle coordinates of the selection
  const [selectionRectCoords, setSelectionRectCoords] = useState(null);
  // State for storing the toolbar's position (x, y coordinates)
  const [toolbarPosition, setToolbarPosition] = useState({
    x: OFFSCREEN_POSITION,
    y: OFFSCREEN_POSITION,
  });
  const toolbarRef = useRef(null);
  const [toolbarState, setToolbarState] = useState({
    isBold: false,
    isItalic: false,
    isCode: false,
    isHeadingOne: false,
    isHeadingTwo: false,
    isHeadingThree: false,
    isQuote: false,
  });

  // Logic for updating/setting toolbar state
  const updateToolbarFormatState = (selection) => {
    if ($isRangeSelection(selection)) {
      setToolbarState({
        isBold: selection.hasFormat("bold"),
        isItalic: selection.hasFormat("italic"),
        isCode: selection.hasFormat("code"),
        isQuote: updateToolbarQuoteState(selection),
      });

      // update/set heading state
      const toolbarHeadingState = updateToolbarHeadingState(selection);
      setToolbarState((prev) => ({
        ...prev,
        ...toolbarHeadingState,
      }));
    }
  };

  // Initialize toolbar state on component mount
  useEffect(() => {
    editor.read(() => {
      const selection = $getSelection();
      updateToolbarFormatState(selection);
    });
  }, [editor]);

  // Update toolbar state
  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          updateToolbarFormatState(selection);
        });
      }
    );
    return unregisterListener;
  }, [editor]);

  // Update selection rectangle coordinates when toolbar state changes
  useEffect(() => {
    editor.read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Create a DOM range from the selection
        const [anchorPoint, focusPoint] = selection.getStartEndPoints();
        const [anchorNode, focusNode] = [
          anchorPoint.getNode(),
          focusPoint.getNode(),
        ];
        const [anchorOffset, focusOffset] = $getCharacterOffsets(selection);
        const selectionDOMRange = createDOMRange(
          editor,
          anchorNode,
          anchorOffset,
          focusNode,
          focusOffset
        );

        // Set bounding rect coords
        setSelectionRectCoords(getBoundingRectCoords(selectionDOMRange));
      }
    });
  }, [editor, toolbarState]);

  // Update toolbar position
  useEffect(() => {
    if (selectionRectCoords) {
      setToolbarPosition(
        computeToolbarPosition(selectionRectCoords, toolbarRef, TOP_OFFSET)
      );
      setTimeout(() => {
        toolbarRef.current?.classList.add("visible");
      }, 50);
    } else {
      toolbarRef.current?.classList.remove("visible");
    }
  }, [selectionRectCoords]);

  return (
    selectionRectCoords && (
      <Toolbar
        style={{
          position: "absolute",
          top: toolbarPosition.y,
          left: toolbarPosition.x,
        }}
        aria-label="Text formatting"
        id="inline-toolbar"
        ref={toolbarRef}
      >
        <Group aria-label="Style">
          <ToggleButton
            aria-label="Bold"
            isSelected={toolbarState.isBold}
            isDisabled={
              toolbarState.isCode ||
              toolbarState.isHeadingOne ||
              toolbarState.isHeadingTwo ||
              toolbarState.isHeadingThree
            }
            onChange={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          >
            <IconBold size={ICON_SIZE} />
          </ToggleButton>
          <ToggleButton
            aria-label="Italic"
            isSelected={toolbarState.isItalic}
            isDisabled={toolbarState.isCode || toolbarState.isHeadingOne}
            onChange={() =>
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
            }
          >
            <IconItalic size={ICON_SIZE} />
          </ToggleButton>
          <ToggleButton
            aria-label="inline-code"
            isDisabled={toolbarState.isHeadingOne}
            isSelected={toolbarState.isCode}
            onChange={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
          >
            <IconCode size={ICON_SIZE} />
          </ToggleButton>
        </Group>
        <Separator orientation="vertical" />
        <Group aria-label="Text Blocks">
          <ToggleButton
            aria-label="Heading"
            isSelected={
              toolbarState.isHeadingOne ||
              toolbarState.isHeadingTwo ||
              toolbarState.isHeadingThree
            }
            onChange={() =>
              editor.dispatchCommand(TOGGLE_HEADING_COMMAND, toolbarState)
            }
          >
            <IconTextSize size={ICON_SIZE} />
          </ToggleButton>
          <ToggleButton
            aria-label="Quote"
            isSelected={toolbarState.isQuote}
            onChange={() =>
              editor.dispatchCommand(TOGGLE_QUOTE_COMMAND, toolbarState)
            }
          >
            <IconBlockquote size={ICON_SIZE} />
          </ToggleButton>
        </Group>
        <Separator orientation="vertical" />
        <Group aria-label="Links">
          <Button>
            <IconLink size={ICON_SIZE} />
          </Button>
        </Group>
        <div className="inline-toolbar-pointer"></div>
      </Toolbar>
    )
  );
}
