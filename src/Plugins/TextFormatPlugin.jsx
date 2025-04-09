/* Plugins for formatting text */

import {
  $isHeadingNode,
  $createHeadingNode,
  $isQuoteNode,
  $createQuoteNode,
  HeadingNode,
} from "@lexical/rich-text";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_HIGH,
  createCommand,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  $getRoot,
  TextNode,
  $isParagraphNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { useEffect } from "react";
import { $findMatchingParent } from "@lexical/utils";
import { $toggleLink, $isLinkNode } from "@lexical/link";
import { $isListNode } from "@lexical/list";
import "@lexical/utils";
import { $isAtNodeEnd } from "@lexical/selection";

export const TOGGLE_HEADING_COMMAND = createCommand("TOGGLE_HEADING_COMMAND");
export const TOGGLE_QUOTE_COMMAND = createCommand("TOGGLE_QUOTE_COMMAND");
export const TOGGLE_LINK_COMMAND = createCommand("TOGGLE_LINK_COMMAND");

export function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
  }
}

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

  // Effect for NodeTransform: H2 at start -> H1
  useEffect(() => {
    const unregisterTransform = editor.registerNodeTransform(
      HeadingNode,
      (node) => {
        // Check if it's an H2 node
        if (node.getTag() !== "h2") {
          return;
        }

        // Get the root node and the first child
        const root = $getRoot();
        const firstChild = root.getFirstChild();

        // Check if this H2 node is the very first child of the root
        if (firstChild !== null && node.is(firstChild)) {
          const children = node.getChildren();
          const h1Node = $createHeadingNode("h1");
          h1Node.append(...children);
          node.replace(h1Node);
        }
      }
    );

    return () => {
      unregisterTransform();
    };
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

export function getLinkAtSelection(selection) {
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const node = getSelectedNode(selection);
  return $findMatchingParent(node, $isLinkNode);
}

function LinkPlugin() {
  const [editor] = useLexicalComposerContext();

  // If a link node is clicked while holding the ctrl key, open the link in a new tab
  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      CLICK_COMMAND,
      (payload) => {
        const selection = $getSelection();
        const linkNode = getLinkAtSelection(selection);
        if (linkNode && (payload.metaKey || payload.ctrlKey)) {
          window.open(linkNode.getURL(), "_blank");
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
    return unregisterListener;
  }, [editor]);

  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      TOGGLE_LINK_COMMAND,
      (linkURL) => {
        $toggleLink(linkURL);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  return null;
}

/*  Adds a CSS class to ElementNodes (excluding HeadingNodes) that follow a HeadingNode. */
function AdjacentHeadingPlugin() {
  const [editor] = useLexicalComposerContext();
  const HEADING_ABOVE_CLASS = "heading-above";

  useEffect(() => {
    const unregisterTransform = editor.registerNodeTransform(
      TextNode,
      (textNode) => {
        const parentNode =
          $findMatchingParent(textNode, $isParagraphNode) ||
          $findMatchingParent(textNode, $isListNode);

        if (!parentNode) {
          return;
        }

        if ($isHeadingNode(parentNode)) {
          return;
        }

        const node = parentNode;

        const element = editor.getElementByKey(node.getKey());
        if (!element) {
          return;
        }

        const prevSibling = node.getPreviousSibling();
        const shouldHaveClass = $isHeadingNode(prevSibling);

        // Check if the DOM element *currently* has the class.
        const alreadyHasClass = element.classList.contains(HEADING_ABOVE_CLASS);

        // Add or remove the class directly on the DOM element to achieve the desired state.
        if (shouldHaveClass && !alreadyHasClass) {
          element.classList.add(HEADING_ABOVE_CLASS);
        } else if (!shouldHaveClass && alreadyHasClass) {
          element.classList.remove(HEADING_ABOVE_CLASS);
        }
      }
    );

    return unregisterTransform;
  }, [editor]);

  return null;
}

export function TextFormatPlugin() {
  return (
    <>
      <HeadingPlugin />
      <QuotePlugin />
      <LinkPlugin />
      <AdjacentHeadingPlugin />
    </>
  );
}
