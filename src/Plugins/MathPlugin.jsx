import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $createMathNode, $isMathNode, MathNode } from "../nodes/MathNode";
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isLineBreakNode,
  $isNodeSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  SELECTION_CHANGE_COMMAND,
  TextNode,
} from "lexical";
import {
  $createMathHighlightNodeBlock,
  $createMathHighlightNodeInline,
  $isMathHighlightNodeBlock,
  $isMathHighlightNodeInline,
  MathHighlightNodeBlock,
  MathHighlightNodeInline,
} from "../nodes/MathHighlightNode";
import { NodeEventPlugin } from "@lexical/react/LexicalNodeEventPlugin";
import { $findMatchingParent } from "@lexical/utils";

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

function validateDelimiters(text) {
  // Helper function to check if a delimiter pair is valid
  const isValidDelimiter = (opening, closing) => {
    if (text.startsWith(opening) && text.endsWith(closing)) {
      const content = text.slice(opening.length, text.length - closing.length);
      return !content.includes(opening) && !content.includes(closing);
    }
    return false;
  };

  // Check display delimiters first
  for (const [opening, closing] of DISPLAY_DELIMITERS) {
    if (isValidDelimiter(opening, closing)) {
      return { isValid: true, isInline: false };
    }
  }

  // Check inline delimiters next
  for (const [opening, closing] of INLINE_DELIMITERS) {
    if (isValidDelimiter(opening, closing)) {
      return { isValid: true, isInline: true };
    }
  }

  return { isValid: false, isInline: undefined };
}

export function $getMathHighlightBlockNodes(editor) {
  const editorState = editor.getEditorState();
  const allNodes = editorState._nodeMap;
  const blockNodes = [];
  for (const [, node] of allNodes) {
    if ($isMathHighlightNodeBlock(node) && node.isAttached()) {
      blockNodes.push(node);
    }
  }
  return blockNodes;
}

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

      // Don't run on math highlight nodes
      if (
        $isMathHighlightNodeInline(node) ||
        $findMatchingParent(node, $isMathHighlightNodeBlock)
      ) {
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

      // Gather inline highlight nodes
      const allTextNodes = root.getAllTextNodes();

      // Gather block highlight nodes - function deprecated. Need to update
      const blockNodes = $getMathHighlightBlockNodes(editor);

      // Convert inline highlight nodes
      allTextNodes.forEach((node) => {
        if (
          $isMathHighlightNodeInline(node) &&
          !nodesToExclude.has(node.getKey())
        ) {
          const equation = node.getTextContent();
          if (!equation) {
            node.remove();
            return;
          }
          const validation = validateDelimiters(equation);
          if (validation.isValid) {
            const mathNode = $createMathNode(equation, validation.isInline);
            node.replace(mathNode);
          }
        }
      });

      // Convert block highlight nodes
      blockNodes.forEach((node) => {
        if (!nodesToExclude.has(node.getKey())) {
          const equation = node.getTextContent();
          if (!equation) {
            node.remove();
            return;
          }
          const validation = validateDelimiters(equation);
          if (validation.isValid) {
            const mathNode = $createMathNode(equation, validation.isInline);
            node.replace(mathNode);
          }
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
            const isInline = mathNode.isInline();
            const mathHighlightNode = isInline
              ? $createMathHighlightNodeInline(equation)
              : $createMathHighlightNodeBlock(equation);
            mathNode.replace(mathHighlightNode);
            mathHighlightNode.select();
            return true;
          }
        } else if ($isRangeSelection(selection)) {
          const selectionNodes = selection.getNodes();
          const selectedNodeKeys = new Set();
          selectionNodes.forEach((node) => {
            selectedNodeKeys.add(node.getKey());
            const blockNode = $findMatchingParent(
              node,
              $isMathHighlightNodeBlock
            );
            if (blockNode) {
              selectedNodeKeys.add(blockNode.getKey());
            }
          });
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

  // handle enter key press inside math highlight block
  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        const firstNode = selection.getNodes()[0];
        const mathHighlightBlock = $findMatchingParent(
          firstNode,
          $isMathHighlightNodeBlock
        );
        if (!mathHighlightBlock) {
          return false;
        }

        // Check if we're at the end of the block
        const lastChild = mathHighlightBlock.getLastChild();
        const isAtBlockEnd =
          selection.isCollapsed() &&
          // conditions same as in insertNewAfter
          ((selection.anchor.getNode().getKey() ===
            mathHighlightBlock.getKey() &&
            selection.anchor.offset === 0 &&
            mathHighlightBlock.getChildrenSize() === 0) ||
            (lastChild &&
              $isLineBreakNode(lastChild) &&
              selection.anchor.getNode().getKey() ===
                mathHighlightBlock.getKey() &&
              selection.anchor.offset ===
                mathHighlightBlock.getChildrenSize()) ||
            (lastChild &&
              $isTextNode(lastChild) &&
              selection.anchor.getNode().getKey() === lastChild.getKey() &&
              selection.anchor.offset === lastChild.getTextContent().length));

        if (isAtBlockEnd) {
          return false;
        }

        selection.insertLineBreak();
        return true;
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
