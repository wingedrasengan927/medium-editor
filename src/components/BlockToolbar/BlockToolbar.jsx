import {
  Button,
  DialogTrigger,
  Popover,
  Toolbar,
  Group,
  FileTrigger,
} from "react-aria-components";
import {
  IconPlus,
  IconCodePlus,
  IconPhoto,
  IconLineDashed,
} from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";
import { OFFSCREEN_POSITION } from "../InlineToolbar/utils";
import { computeBlockToolbarPosition } from "../InlineToolbar/utils";
import "./styles/Popover.css";

import { INSERT_CODE_BLOCK_COMMAND } from "../../Plugins/CodePlugin";
import { INSERT_HORIZONTAL_DIVIDER_COMMAND } from "../../Plugins/HorizontalDividerPlugin";
import { INSERT_IMAGE_COMMAND } from "../../Plugins/ImagePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const ICON_SIZE = 24;

function BlockToolbar() {
  const [editor] = useLexicalComposerContext();

  const handleFileSelect = (fileList) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const file = fileList[0];

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    editor.dispatchCommand(INSERT_IMAGE_COMMAND, file);
  };

  return (
    <Toolbar aria-label="Block toolbar" id="block-toolbar">
      <Group aria-label="Media">
        <FileTrigger
          acceptedFileTypes={["image/png", "image/jpeg", "image/gif"]}
          onSelect={handleFileSelect}
          allowsMultiple={false}
        >
          <Button aria-label="image">
            <IconPhoto size={ICON_SIZE} />
          </Button>
        </FileTrigger>
        <Button
          aria-label="code block"
          onPress={() => {
            editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined);
          }}
        >
          <IconCodePlus size={ICON_SIZE} />
        </Button>
        <Button
          aria-label="horizontal divider"
          onPress={() => {
            editor.dispatchCommand(
              INSERT_HORIZONTAL_DIVIDER_COMMAND,
              undefined
            );
          }}
        >
          <IconLineDashed size={ICON_SIZE} />
        </Button>
      </Group>
    </Toolbar>
  );
}

export default function BlockToolbarPopover({
  selectionRectCoords,
  TOOLBAR_OFFSET,
  toolbarTriggerId,
  toolbarPopoverId,
}) {
  const [toolbarPosition, setToolbarPosition] = useState({
    x: OFFSCREEN_POSITION,
    y: OFFSCREEN_POSITION,
  });
  const toolbarRef = useRef(null);

  // Update toolbar position when selection changes
  useEffect(() => {
    setToolbarPosition(
      computeBlockToolbarPosition(
        selectionRectCoords,
        toolbarRef,
        TOOLBAR_OFFSET
      )
    );
  }, [selectionRectCoords]);

  return (
    <DialogTrigger>
      <Button
        aria-label="Block toolbar trigger"
        className="block-toolbar-trigger"
        id={toolbarTriggerId}
        ref={toolbarRef}
        style={{
          position: "absolute",
          top: toolbarPosition.y,
          left: toolbarPosition.x,
        }}
      >
        <IconPlus size={ICON_SIZE} />
      </Button>
      <Popover
        className="block-toolbar-popover"
        id={toolbarPopoverId}
        placement="end"
        shouldFlip={false}
        offset={TOOLBAR_OFFSET}
      >
        <BlockToolbar />
      </Popover>
    </DialogTrigger>
  );
}
