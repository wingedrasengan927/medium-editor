import {
  Button,
  Group,
  Toolbar,
  TextField,
  Input,
} from "react-aria-components";
import { IconCheck, IconX } from "@tabler/icons-react";
import { ICON_SIZE } from "./InlineToolbar";
import { useState } from "react";
import { TOGGLE_LINK_COMMAND } from "../../Plugins/TextFormatPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import "./styles/LinkToolbar.css";

export function LinkToolbar({ style, closeToolbar, existingLinkURL }) {
  const [editor] = useLexicalComposerContext();
  const [linkURL, setLinkURL] = useState(existingLinkURL);

  // TODO: The left and right arrow keys aren't working at all. Need to debug.

  return (
    <Toolbar style={style} aria-details="link toolbar" id="link-toolbar">
      <TextField
        aria-label="url"
        autoFocus={true}
        defaultValue={linkURL}
        onChange={setLinkURL}
      >
        <Input placeholder="Enter Link" />
      </TextField>
      <Group aria-label="edit link">
        <Button
          aria-label="Update link"
          onPress={() => {
            const url = linkURL === "" ? null : linkURL;
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
            closeToolbar();
          }}
        >
          <IconCheck size={ICON_SIZE} />
        </Button>
        <Button aria-label="Discard changes" onPress={closeToolbar}>
          <IconX size={ICON_SIZE} />
        </Button>
      </Group>
      <div className="inline-toolbar-pointer"></div>
    </Toolbar>
  );
}
