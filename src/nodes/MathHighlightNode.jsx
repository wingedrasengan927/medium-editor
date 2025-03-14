import {
  TextNode,
  $applyNodeReplacement,
  ElementNode,
  $createParagraphNode,
  $createTextNode,
  $isParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $isLineBreakNode,
} from "lexical";
import { addClassNamesToElement, $findMatchingParent } from "@lexical/utils";

export class MathHighlightNodeInline extends TextNode {
  static getType() {
    return "math-highlight-inline";
  }

  static clone(node) {
    return new MathHighlightNodeInline(node.__equation, node.__key);
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

export function $createMathHighlightNodeInline(equation) {
  const mathHighlightNode = new MathHighlightNodeInline(equation);
  return $applyNodeReplacement(mathHighlightNode);
}

export function $isMathHighlightNodeInline(node) {
  return node instanceof MathHighlightNodeInline;
}

export class MathHighlightNodeBlock extends ElementNode {
  static getType() {
    return "math-highlight-block";
  }

  static clone(node) {
    return new MathHighlightNodeBlock(node.__equation, node.__key);
  }

  constructor(equation, key) {
    super(key);
    this.__equation = equation;
  }

  createDOM(config) {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.math.highlightBlock);
    return element;
  }

  updateDOM() {
    return false;
  }

  collapseAtStart() {
    this.remove();
    return true;
  }

  insertNewAfter() {
    const selection = $getSelection();
    if ($isRangeSelection(selection) && selection.isCollapsed()) {
      const lastChild = this.getLastChild();
      const anchorNode = selection.anchor.getNode();
      const isAtBlockEnd =
        (anchorNode.getKey() === this.getKey() &&
          selection.anchor.offset === 0 &&
          this.getChildrenSize() === 0) ||
        (lastChild &&
          $isLineBreakNode(lastChild) &&
          anchorNode.getKey() === this.getKey() &&
          selection.anchor.offset === this.getChildrenSize()) ||
        (lastChild &&
          $isTextNode(lastChild) &&
          anchorNode.getKey() === lastChild.getKey() &&
          selection.anchor.offset === lastChild.getTextContent().length);
      if (isAtBlockEnd) {
        const parentNode = $findMatchingParent(this, $isParagraphNode);
        const paragraphNode = $createParagraphNode();
        if (!parentNode) {
          this.insertAfter(paragraphNode);
        } else {
          parentNode.insertAfter(paragraphNode);
        }
        paragraphNode.select();
        return paragraphNode;
      }
    }
  }
}

export function $createMathHighlightNodeBlock(equation) {
  const equationTextNode = $createTextNode(equation);
  let mathHighlightNode = new MathHighlightNodeBlock(equation);
  return $applyNodeReplacement(mathHighlightNode.append(equationTextNode));
}

export function $isMathHighlightNodeBlock(node) {
  return node instanceof MathHighlightNodeBlock;
}
