import {
  Button,
  DialogTrigger,
  Popover,
  Toolbar,
  Group,
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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const ICON_SIZE = 24;
const TOOLBAR_OFFSET = 18;

function BlockToolbar() {
  const [editor] = useLexicalComposerContext();

  return (
    <Toolbar aria-label="Block toolbar" id="block-toolbar">
      <Group aria-label="Media">
        <Button aria-label="image">
          <IconPhoto size={ICON_SIZE} />
        </Button>
        <Button
          aria-label="code block"
          onPress={() => {
            editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined);
          }}
        >
          <IconCodePlus size={ICON_SIZE} />
        </Button>
        <Button aria-label="horizontal divider">
          <IconLineDashed size={ICON_SIZE} />
        </Button>
      </Group>
    </Toolbar>
  );
}

export default function BlockToolbarPopover({ selectionRectCoords }) {
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
        id="block-toolbar-trigger"
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
        id="block-toolbar-popover"
        placement="end"
        shouldFlip={false}
        offset={TOOLBAR_OFFSET}
      >
        <BlockToolbar />
      </Popover>
    </DialogTrigger>
  );
}
