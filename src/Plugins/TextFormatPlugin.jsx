/* Plugins for formatting text */

import {
  $isHeadingNode,
  $createHeadingNode,
  $isQuoteNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_HIGH,
  createCommand,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { useEffect } from "react";
import { $findMatchingParent } from "@lexical/utils";

export const TOGGLE_HEADING_COMMAND = createCommand("TOGGLE_HEADING_COMMAND");
export const TOGGLE_QUOTE_COMMAND = createCommand("TOGGLE_QUOTE_COMMAND");

// Helper function to fetch the tag of a node if it or its ancestor is a heading node.
function fetchTagIfHeadingNode(node) {
  const headingNode = $findMatchingParent(node, $isHeadingNode);
  return headingNode ? headingNode.getTag() : null;
}

export function updateToolbarHeadingState(selection) {
  const toolbarHeadingState = {
    isHeadingOne: false,
    isHeadingTwo: false,
    isHeadingThree: false,
  };

  const nodes = selection.getNodes();
  if (!nodes.length) return toolbarHeadingState;

  const headingTag = fetchTagIfHeadingNode(nodes[0]);
  if (!headingTag) return toolbarHeadingState;

  const allMatch = nodes.every(
    (node) => fetchTagIfHeadingNode(node) === headingTag
  );

  if (allMatch) {
    const stateKey = {
      h1: "isHeadingOne",
      h2: "isHeadingTwo",
      h3: "isHeadingThree",
    }[headingTag];

    if (stateKey) toolbarHeadingState[stateKey] = true;
  }

  return toolbarHeadingState;
}

function HeadingPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      TOGGLE_HEADING_COMMAND,
      (toolbarState) => {
        const { isHeadingOne, isHeadingTwo, isHeadingThree } = toolbarState;
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          let tag;

          // Apply the toggling logic based on current state in toolbar
          if (isHeadingOne) {
            // H1 --> H3
            tag = "h3";
          } else if (isHeadingTwo) {
            // H2 --> H3
            tag = "h3";
          } else if (isHeadingThree) {
            // H3 --> None (paragraph)
            tag = null;
          } else {
            // None --> H2
            tag = "h2";
          }

          // Apply the heading or paragraph node
          $setBlocksType(selection, () =>
            tag ? $createHeadingNode(tag) : $createParagraphNode()
          );
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  return null;
}

// Helper function to check if a node or its ancestor is a quote node
function isNodeOrAncestorQuote(node) {
  return $findMatchingParent(node, $isQuoteNode);
}

export function updateToolbarQuoteState(selection) {
  const nodes = selection.getNodes();
  if (!nodes.length) return false;

  // Check if all nodes are within quote blocks
  return nodes.length > 0 && nodes.every((node) => isNodeOrAncestorQuote(node));
}

function QuotePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      TOGGLE_QUOTE_COMMAND,
      (toolbarState) => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () =>
            toolbarState.isQuote ? $createParagraphNode() : $createQuoteNode()
          );
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  return null;
}

export function TextFormatPlugin() {
  return (
    <>
      <HeadingPlugin />
      <QuotePlugin />
    </>
  );
}
