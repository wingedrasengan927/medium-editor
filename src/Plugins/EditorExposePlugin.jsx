import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

// Exposes the editor to the parent component
export function EditorExposePlugin({ editorRef }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;

      // Clear the ref on component unmount
      return () => {
        if (editorRef) {
          editorRef.current = null;
        }
      };
    }
  }, [editor, editorRef]);

  return null;
}
