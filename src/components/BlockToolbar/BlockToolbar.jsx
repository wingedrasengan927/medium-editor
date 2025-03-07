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

import "./styles/Popover.css";

function BlockToolbar() {
  const iconSize = 24;

  return (
    <Toolbar aria-label="Block toolbar" id="block-toolbar">
      <Group aria-label="Media">
        <Button aria-label="image">
          <IconPhoto size={iconSize} />
        </Button>
        <Button aria-label="code block">
          <IconCodePlus size={iconSize} />
        </Button>
        <Button aria-label="horizontal divider">
          <IconLineDashed size={iconSize} />
        </Button>
      </Group>
    </Toolbar>
  );
}

export default function BlockToolbarPopover() {
  const toolbarOffset = 16;

  return (
    <DialogTrigger>
      <Button aria-label="Block toolbar trigger" id="block-toolbar-trigger">
        <IconPlus size={iconSize} />
      </Button>
      <Popover
        id="block-toolbar-popover"
        placement="end"
        shouldFlip={false}
        offset={toolbarOffset}
      >
        <BlockToolbar />
      </Popover>
    </DialogTrigger>
  );
}
