import {
  Button,
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import { IconCaretDownFilled } from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";
import { OFFSCREEN_POSITION } from "../InlineToolbar/utils";
import { computeCodeMenuPosition } from "../InlineToolbar/utils";
import { getCodeLanguages, getLanguageFriendlyName } from "@lexical/code";
import "./styles.css";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey } from "lexical";
import { SET_CODE_LANGUAGE_COMMAND } from "../../Plugins/CodePlugin";

export function CodeMenu({ codeBlockCoords, codeNodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [codeMenuPosition, setCodeMenuPosition] = useState({
    x: OFFSCREEN_POSITION,
    y: OFFSCREEN_POSITION,
  });
  const codeMenuRef = useRef(null);
  const [language, setLanguage] = useState("");

  // Get the available code languages
  const codeLanguages = getCodeLanguages();

  // Create a unique set of friendly language names
  const friendlyLanguages = Array.from(
    new Set(codeLanguages.map((lang) => getLanguageFriendlyName(lang)))
  );

  // Create a reverse dictionary for friendly languages
  const friendlyToOriginal = {};
  codeLanguages.forEach((lang) => {
    const friendly = getLanguageFriendlyName(lang);
    if (!friendlyToOriginal[friendly]) {
      friendlyToOriginal[friendly] = lang;
    }
  });

  // Update toolbar position when selection changes
  useEffect(() => {
    setCodeMenuPosition(computeCodeMenuPosition(codeBlockCoords, codeMenuRef));
  }, [codeBlockCoords]);

  // Set the current language of the code block
  useEffect(() => {
    editor.read(() => {
      if (codeNodeKey) {
        const codeNode = $getNodeByKey(codeNodeKey);
        const currentLanguage = codeNode.getLanguage();
        setLanguage(getLanguageFriendlyName(currentLanguage));
      }
    });
  }, [editor]);

  return (
    <ComboBox
      ref={codeMenuRef}
      style={{
        position: "absolute",
        top: codeMenuPosition.y,
        left: codeMenuPosition.x,
      }}
      aria-label="Code menu"
      inputValue={language}
      onInputChange={(friendlyValue) => {
        const originalValue = friendlyToOriginal[friendlyValue];
        editor.dispatchCommand(SET_CODE_LANGUAGE_COMMAND, [
          codeNodeKey,
          originalValue,
        ]);
        setLanguage(friendlyValue);
      }}
    >
      <div>
        <Input />
        <Button>
          <IconCaretDownFilled size={24} />
        </Button>
      </div>
      <Popover>
        <ListBox>
          {friendlyLanguages.map((friendly, index) => (
            <ListBoxItem key={index}>{friendly}</ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
