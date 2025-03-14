import { TextNode, $applyNodeReplacement } from "lexical";
import { addClassNamesToElement } from "@lexical/utils";
import { CodeNode } from "@lexical/code";

export class MathHighlightNodeInline extends TextNode {
  static getType() {
    return "math-highlight-inline";
  }

  static clone(node) {
    return new MathHighlightNodeInline(node.__text, node.__key);
  }

  createDOM(config) {
    const element = super.createDOM(config);
    addClassNamesToElement(element, config.theme.math.highlightInline);
    return element;
  }

  canInsertTextAfter() {
    return false;
  }

  canInsertTextBefore() {
    return false;
  }
}

export function $createMathHighlightNodeInline(text) {
  const mathHighlightNode = new MathHighlightNodeInline();
  mathHighlightNode.setTextContent(text);
  return $applyNodeReplacement(mathHighlightNode);
}

export function $isMathHighlightNodeInline(node) {
  return node instanceof MathHighlightNodeInline;
}

export class MathHighlightNodeBlock extends CodeNode {
  static getType() {
    return "math-highlight-block";
  }

  static clone(node) {
    return new MathHighlightNodeBlock(node.__text, node.__key);
  }

  createDOM(config) {
    const element = super.createDOM(config);
    addClassNamesToElement(element, config.theme.math.highlightBlock);
    return element;
  }
}
