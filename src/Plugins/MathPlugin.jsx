import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $createMathNode, $isMathNode, MathNode } from "../nodes/MathNode";
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from "lexical";
import {
  $createMathHighlightNodeInline,
  $isMathHighlightNodeInline,
  MathHighlightNodeBlock,
  MathHighlightNodeInline,
} from "../nodes/MathHighlightNode";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";

// Define the delimiter for math
export const INLINE_DELIMITERS = [
  ["$", "$"],
  ["\\(", "\\)"],
];
export const DISPLAY_DELIMITERS = [
  ["$$", "$$"],
  ["\\[", "\\]"],
];

// Changed function name and logic
export const getMatchMatch = (text) => {
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const allDelimiters = [
    ...INLINE_DELIMITERS.map(([o, c]) => ({
      opening: o,
      closing: c,
      isInline: true,
    })),
    ...DISPLAY_DELIMITERS.map(([o, c]) => ({
      opening: o,
      closing: c,
      isInline: false,
    })),
  ];

  let earliest = null;

  for (const { opening, closing, isInline } of allDelimiters) {
    const regex = new RegExp(
      `(.*?)(${escapeRegex(opening)})(.*?)(${escapeRegex(closing)})`,
      "g"
    );
    const match = regex.exec(text);
    if (match) {
      const content = match[3];
      if (content && content.trim() !== "") {
        const start = match.index + match[1].length;
        const end = match.index + match[0].length;
        if (!earliest || start < earliest.start) {
          earliest = {
            start,
            end,
            isInline,
            content: opening + content + closing,
          };
        }
      }
    }
  }

  return earliest;
};

export function MathPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (
      !editor.hasNodes([
        MathNode,
        MathHighlightNodeInline,
        MathHighlightNodeBlock,
      ])
    ) {
      throw new Error(
        "MathPlugin: MathNode or MathHighlightNode not registered on editor"
      );
    }
  }, [editor]);

  // Transform to detect math expressions
  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, (node) => {
      // Only run on simple text nodes
      if (!node.isSimpleText()) {
        return;
      }

      const text = node.getTextContent();
      const match = getMatchMatch(text);

      if (match) {
        const { start, end, isInline, content } = match;

        let targetNode;
        const mathNode = $createMathNode(content, isInline);

        if (start === 0) {
          // If math expression starts at the beginning of the text
          [targetNode] = node.splitText(end);
          targetNode.insertBefore(mathNode);
          targetNode.remove();
        } else {
          // If math expression is in the middle or end
          [, targetNode] = node.splitText(start, end);
          targetNode.replace(mathNode);
        }

        // mathNode.select();
        return mathNode;
      }
    });
    return removeTransform;
  }, [editor]);

  // Transform math nodes to math highlight nodes when they are selected
  // Also, transform math highlight nodes back to math nodes when they are deselected
  useEffect(() => {
    // Helper function to convert math highlight nodes to math nodes
    const convertHighlightNodesToMathNodes = (nodesToExclude = new Set()) => {
      const root = $getRoot();
      const allTextNodes = root.getAllTextNodes();

      allTextNodes.forEach((node) => {
        if (
          $isMathHighlightNodeInline(node) &&
          !nodesToExclude.has(node.getKey())
        ) {
          const equation = node.getTextContent();
          // TODO: validate the equation
          const mathNode = $createMathNode(equation, true);
          node.replace(mathNode);
        }
      });
    };

    const unregisterListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();

        if ($isNodeSelection(selection)) {
          // Handle node selection - convert MathNode to MathHighlightNode
          const nodes = selection.getNodes();
          if (nodes.length === 1 && $isMathNode(nodes[0])) {
            const mathNode = nodes[0];
            const equation = mathNode.getEquation();
            const mathHighlightNode = $createMathHighlightNodeInline(equation);
            mathNode.replace(mathHighlightNode);
            mathHighlightNode.select();
            return true;
          }
        } else if ($isRangeSelection(selection)) {
          // For range selection, preserve highlight nodes that are selected
          const selectedNodeKeys = new Set(
            selection.getNodes().map((node) => node.getKey())
          );
          convertHighlightNodesToMathNodes(selectedNodeKeys);
        } else {
          // No selection, convert all highlight nodes back to math nodes
          convertHighlightNodesToMathNodes();
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return unregisterListener;
  }, [editor]);

  return (
    // Make the MathNode selectable
    <NodeEventPlugin
      nodeType={MathNode}
      eventType={"click"}
      eventListener={(event, editor, key) => {
        const node = $getNodeByKey(key);
        node.select();
      }}
    />
  );
}
