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
  $isParagraphNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_BACKSPACE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $createTextNode,
  TextNode,
  $getAdjacentNode,
  COMMAND_PRIORITY_NORMAL,
  BLUR_COMMAND,
  $setSelection,
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
import { $findMatchingParent, $dfs } from "@lexical/utils";

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
            let equation = node.getTextContent();
            if (!equation) {
              node.remove();
              return;
            }

            let isBlock = false;
            if (equation.startsWith("$") && equation.endsWith("$") && equation.length >= 2) {
              equation = equation.slice(1, -1);
              isBlock = true;
            }

            const mathNode = isBlock
              ? $createMathNode(`$$${equation}$$`, false)
              : $createMathNode(`$${equation}$`, true);
            node.replace(mathNode);
          }
        });

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  // Convert MathHighlightNodeInline to MathNode Inline upon blur
  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        editor.update(() => {
          const root = $getRoot();
          const allTextNodes = root.getAllTextNodes();

          allTextNodes.forEach((node) => {
            if ($isMathHighlightNodeInline(node)) {
              let equation = node.getTextContent();
              if (!equation) {
                node.remove();
                return;
              }

              let isBlock = false;
              if (
                equation.startsWith("$") &&
                equation.endsWith("$") &&
                equation.length >= 2
              ) {
                equation = equation.slice(1, -1);
                isBlock = true;
              }

              const mathNode = isBlock
                ? $createMathNode(`$$${equation}$$`, false)
                : $createMathNode(`$${equation}$`, true);
              node.replace(mathNode);
              $setSelection(null);
            }
          });
        });
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
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

  // If the selection is inside a MathHighlightNodeInline and there is no next sibling,
  // add a space after it to make it easier to escape
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const node = selection.anchor.getNode();

        if ($isMathHighlightNodeInline(node)) {
          const nextSibling = node.getNextSibling();
          if (!nextSibling) {
            node.insertAfter($createTextNode(" "));
          }
        }

        return false;
      },
      COMMAND_PRIORITY_NORMAL
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

      // Check for Block Creation Trigger: "$$ " at start of line/paragraph
      if (text.startsWith("$$ ")) {
        const prevSibling = node.getPreviousSibling();
        const parentNode = $findMatchingParent(node, $isParagraphNode);
        const isStartOfParagraph = parentNode !== null && parentNode.getChildrenSize() === 1;
        const isAfterLineBreak = $isLineBreakNode(prevSibling);

        if (isStartOfParagraph || isAfterLineBreak) {
          // If there is more text after "$$ ", don't do anything
          if (text.length > 3) {
            return;
          }

          // Create the new math block
          const mathBlock = $createMathHighlightNodeBlock("");

          // Replace "$$ " with the math block
          node.replace(mathBlock);

          // Select the math block
          mathBlock.select();

          // Check if the next sibling is a LineBreakNode and remove it
          const nextSibling = mathBlock.getNextSibling();
          if ($isLineBreakNode(nextSibling)) {
            nextSibling.remove();
          }

          return;
        }
      }

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
              let equation = mathNode.getEquation();
              // Strip delimiters
              if (equation.startsWith("$$") && equation.endsWith("$$")) {
                equation = equation.slice(2, -2);
              } else if (equation.startsWith("\\[") && equation.endsWith("\\]")) {
                equation = equation.slice(2, -2);
              }

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
            const mathNode = $createMathNode(`$$${equation}$$`, false);
            node.replace(mathNode);
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
    return unregisterListener;
  }, [editor]);

  // Convert MathHighlightNodeBlock to MathNode Block upon blur
  useEffect(() => {
    return editor.registerCommand(
      BLUR_COMMAND,
      () => {
        editor.update(() => {
          const root = $getRoot();
          const nodes = $dfs(root);

          nodes.forEach(({ node }) => {
            if ($isMathHighlightNodeBlock(node)) {
              const equation = node.getTextContent();
              if (!equation) {
                node.remove();
                return;
              }
              // Always convert back to block MathNode
              const mathNode = $createMathNode(`$$${equation}$$`, false);
              node.replace(mathNode);
              $setSelection(null);
            }
          });
        });
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
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

  // If a collapsed selection lands on a MathNode Block from right upon backspace,
  // convert it to MathHighlightNodeBlock and select it at the end
  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const adjacentNode = $getAdjacentNode(selection.anchor, true);

        if ($isMathNode(adjacentNode) && !adjacentNode.isInline()) {
          const equation = adjacentNode.getEquation();
          let cleanEquation = equation;
          // Strip delimiters if present
          if (cleanEquation.startsWith("$$") && cleanEquation.endsWith("$$")) {
            cleanEquation = cleanEquation.slice(2, -2);
          } else if (cleanEquation.startsWith("\\[") && cleanEquation.endsWith("\\]")) {
            cleanEquation = cleanEquation.slice(2, -2);
          }

          const mathHighlightNode = $createMathHighlightNodeBlock(cleanEquation);
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
