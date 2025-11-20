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
  KEY_ARROW_RIGHT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  TextNode,
  $getAdjacentNode
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

export const INLINE_DELIMITERS = [
  ["$", "$"],
  ["\\(", "\\)"],
];

export const DISPLAY_DELIMITERS = [
  ["$$", "$$"],
  ["\\[", "\\]"],
];

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getMatch = (text, delimiters) => {
  let earliest = null;

  for (const [opening, closing] of delimiters) {
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
            content: opening + content + closing,
          };
        }
      }
    }
  }

  return earliest;
};

export function MathInlinePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([MathNode, MathHighlightNodeInline])) {
      throw new Error(
        "MathInlinePlugin: MathNode or MathHighlightNodeInline not registered on editor"
      );
    }
  }, [editor]);

  // Convert simple text $...$ to MathNode Inline
  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, (node) => {
      if (!node.isSimpleText()) {
        return;
      }

      if (
        $isMathHighlightNodeInline(node) ||
        $findMatchingParent(node, $isMathHighlightNodeBlock)
      ) {
        return;
      }

      const text = node.getTextContent();
      const match = getMatch(text, INLINE_DELIMITERS);

      if (match) {
        const { start, end, content } = match;
        let targetNode;
        const mathNode = $createMathNode(content, true);

        if (start === 0) {
          [targetNode] = node.splitText(end);
          targetNode.insertBefore(mathNode);
          targetNode.remove();
        } else {
          [, targetNode] = node.splitText(start, end);
          targetNode.replace(mathNode);
        }
        return mathNode;
      }
    });
    return removeTransform;
  }, [editor]);

  // conversion: MathNode Inline <--> MathHighlightNodeInline upon selection change
  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        const nodesToExclude = new Set();

        if ($isNodeSelection(selection)) {
          const nodes = selection.getNodes();
          if (nodes.length === 1 && $isMathNode(nodes[0])) {
            const mathNode = nodes[0];
            if (mathNode.isInline()) {
              let equation = mathNode.getEquation();
              // Strip delimiters
              if (equation.startsWith("$") && equation.endsWith("$")) {
                equation = equation.slice(1, -1);
              } else if (equation.startsWith("\\(") && equation.endsWith("\\)")) {
                equation = equation.slice(2, -2);
              }

              const mathHighlightNode = $createMathHighlightNodeInline(equation);
              mathNode.replace(mathHighlightNode);
              mathHighlightNode.select();
              return true;
            }
          }
        } else if ($isRangeSelection(selection)) {
          selection.getNodes().forEach(node => nodesToExclude.add(node.getKey()));
        }

        // Convert unselected inline highlight nodes back to math nodes
        const root = $getRoot();
        const allTextNodes = root.getAllTextNodes();

        // convert unselected MathHighlightNodeInline to MathNode Inline
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
            const mathNode = $createMathNode(`$${equation}$`, true);
            node.replace(mathNode);
          }
        });

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  // If a collapsed selection lands on a MathNode Inline from left,
  // convert it to MathHighlightNodeInline and select it at the start
  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const adjacentNode = $getAdjacentNode(selection.anchor, false);

        if ($isMathNode(adjacentNode) && adjacentNode.isInline()) {
          const equation = adjacentNode.getEquation();
          let cleanEquation = equation;
          // Strip delimiters if present
          if (cleanEquation.startsWith("$") && cleanEquation.endsWith("$")) {
            cleanEquation = cleanEquation.slice(1, -1);
          } else if (cleanEquation.startsWith("\\(") && cleanEquation.endsWith("\\)")) {
            cleanEquation = cleanEquation.slice(2, -2);
          }

          const mathHighlightNode = $createMathHighlightNodeInline(cleanEquation);
          adjacentNode.replace(mathHighlightNode);
          mathHighlightNode.select(0, 0);
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  // If a collapsed selection lands on a MathNode Inline from right upon backspace,
  // convert it to MathHighlightNodeInline and select it at the end
  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const adjacentNode = $getAdjacentNode(selection.anchor, true);

        if ($isMathNode(adjacentNode) && adjacentNode.isInline()) {
          const equation = adjacentNode.getEquation();
          let cleanEquation = equation;
          // Strip delimiters if present
          if (cleanEquation.startsWith("$") && cleanEquation.endsWith("$")) {
            cleanEquation = cleanEquation.slice(1, -1);
          } else if (cleanEquation.startsWith("\\(") && cleanEquation.endsWith("\\)")) {
            cleanEquation = cleanEquation.slice(2, -2);
          }

          const mathHighlightNode = $createMathHighlightNodeInline(cleanEquation);
          adjacentNode.replace(mathHighlightNode);
          mathHighlightNode.select();
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return (
    // Register click event for MathNode
    <NodeEventPlugin
      nodeType={MathNode}
      eventType={"click"}
      eventListener={(event, editor, key) => {
        const node = $getNodeByKey(key);
        if (node && node.isInline()) {
          node.select();
        }
      }}
    />
  );
}

export function MathBlockPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([MathNode, MathHighlightNodeBlock])) {
      throw new Error(
        "MathBlockPlugin: MathNode or MathHighlightNodeBlock not registered on editor"
      );
    }
  }, [editor]);

  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(TextNode, (node) => {
      if (!node.isSimpleText()) {
        return;
      }

      if ($findMatchingParent(node, $isMathHighlightNodeBlock)) {
        return;
      }

      const text = node.getTextContent();
      const match = getMatch(text, DISPLAY_DELIMITERS);

      if (match) {
        const { start, end, content } = match;
        let targetNode;
        const mathNode = $createMathNode(content, false);

        if (start === 0) {
          [targetNode] = node.splitText(end);
          targetNode.insertBefore(mathNode);
          targetNode.remove();
        } else {
          [, targetNode] = node.splitText(start, end);
          targetNode.replace(mathNode);
        }
        return mathNode;
      }
    });
    return removeTransform;
  }, [editor]);

  useEffect(() => {
    const unregisterListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        const nodesToExclude = new Set();

        if ($isNodeSelection(selection)) {
          const nodes = selection.getNodes();
          if (nodes.length === 1 && $isMathNode(nodes[0])) {
            const mathNode = nodes[0];
            if (!mathNode.isInline()) {
              const equation = mathNode.getEquation();
              // We don't strip delimiters for block math usually, or maybe we do?
              // The original code didn't strip for block math explicitly in the same way, 
              // or it relied on `equation` being the full content.
              // Let's look at the original code:
              // It checked `isInline` and stripped.
              // For block, it just created `MathHighlightNodeBlock(equation)`.
              // So we keep the delimiters for block?
              // Wait, `validateDelimiters` was used to check validity.
              // Let's assume we keep delimiters for block to be safe, or consistent with original.
              // Original: `const mathHighlightNode = isInline ? ... : $createMathHighlightNodeBlock(equation);`
              // And `equation` was modified ONLY if `isInline`.
              // So yes, block keeps delimiters.

              const mathHighlightNode = $createMathHighlightNodeBlock(equation);
              mathNode.replace(mathHighlightNode);
              mathHighlightNode.select();
              return true;
            }
          }
        } else if ($isRangeSelection(selection)) {
          selection.getNodes().forEach(node => {
            nodesToExclude.add(node.getKey());
            const blockNode = $findMatchingParent(node, $isMathHighlightNodeBlock);
            if (blockNode) {
              nodesToExclude.add(blockNode.getKey());
            }
          });
        }

        // Convert unselected block highlight nodes back to math nodes
        // We need to iterate.
        // Since MathHighlightNodeBlock is an ElementNode, we can't use getAllTextNodes to find it directly.
        // We have to rely on `editor.getEditorState()._nodeMap` or traverse.
        // The original code used `editor.getEditorState()._nodeMap`.

        // We can use that here too.
        const editorState = editor.getEditorState();
        const allNodes = editorState._nodeMap;
        for (const [, node] of allNodes) {
          if ($isMathHighlightNodeBlock(node) && node.isAttached() && !nodesToExclude.has(node.getKey())) {
            const equation = node.getTextContent();
            if (!equation) {
              node.remove();
              continue;
            }
            // Always convert back to block MathNode
            const mathNode = $createMathNode(equation, false);
            node.replace(mathNode);
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

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

        const lastChild = mathHighlightBlock.getLastChild();
        const isAtBlockEnd =
          selection.isCollapsed() &&
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
    <NodeEventPlugin
      nodeType={MathNode}
      eventType={"click"}
      eventListener={(event, editor, key) => {
        const node = $getNodeByKey(key);
        if (node && !node.isInline()) {
          node.select();
        }
      }}
    />
  );
}
