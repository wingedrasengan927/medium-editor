import { $insertList, $isListItemNode, $createListItemNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
  TextNode,
  ParagraphNode,
} from "lexical";
import { $findMatchingParent } from "@lexical/utils";
import { getSelectedNode } from "./TextFormatPlugin";

const MAX_INDENT_LEVEL = 3;

export function ListPluginExtended() {
  const [editor] = useLexicalComposerContext();

  // Transform: Remove paragraph nodes inside list item nodes
  // Replace with a new list item node
  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(
      ParagraphNode,
      (paragraphNode) => {
        const parent = paragraphNode.getParent();

        // Check if paragraph is inside a ListItemNode
        if ($isListItemNode(parent)) {
          // Insert a new list item after the parent and remove the paragraph
          const newListItem = $createListItemNode();
          parent.insertAfter(newListItem);
          paragraphNode.remove();
          // Select the newly inserted list item
          newListItem.selectStart();
        }
      }
    );

    return removeTransform;
  }, [editor]);

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

  // Handle TAB Command
  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const node = getSelectedNode(selection);
        const listItemNode = $findMatchingParent(node, $isListItemNode);
        if (!listItemNode) {
          return false;
        }

        const indent = listItemNode.getIndent();
        if (event.shiftKey) {
          if (indent <= 0) {
            return false;
          }
          listItemNode.setIndent(indent - 1);
        } else {
          if (indent > MAX_INDENT_LEVEL) {
            return false;
          }
          listItemNode.setIndent(indent + 1);
        }

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    return unregisterCommand;
  }, [editor]);

  return null;
}
