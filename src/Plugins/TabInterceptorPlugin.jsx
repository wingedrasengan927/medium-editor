import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export function TabInterceptorPlugin() {
  const [editor] = useLexicalComposerContext();

  const interceptTab = (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
    }
  };

  useEffect(() => {
    const unregisterListener = editor.registerRootListener(
      (rootElement, prevRootElement) => {
        if (rootElement) {
          rootElement.addEventListener("keydown", interceptTab);
        }

        if (prevRootElement) {
          prevRootElement.removeEventListener("keydown", interceptTab);
        }
      }
    );

    return unregisterListener;
  }, [editor]);

  return null;
}
