import { $insertList } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  TextNode,
} from "lexical";
import { $findMatchingParent } from "@lexical/utils";

export function ListPluginExtended() {
  const [editor] = useLexicalComposerContext();

  // If a text node begins with '1. ' or '- ', convert it into a list
  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, (node) => {
      if (!$findMatchingParent(node, $isParagraphNode)) {
        return;
      }

      const parentNode = $findMatchingParent(node, $isParagraphNode);
      if (parentNode.getFirstDescendant() !== node) {
        return;
      }

      const selection = $getSelection();
      if ($isRangeSelection(selection) && selection.isCollapsed()) {
        const anchor = selection.anchor;
        const offset = anchor.offset;

        if (node.getTextContent() === "1. " && offset === 3) {
          $insertList("number");
          node.setTextContent("");
        } else if (node.getTextContent() === "- " && offset === 2) {
          $insertList("bullet");
          node.setTextContent("");
        }
      }
    });

    return removeTransform;
  }, [editor]);

  return null;
}
