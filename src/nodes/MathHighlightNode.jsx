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

  static importJSON(serializedNode) {
    // This method will likely be never used
    return null;
  }

  exportJSON() {
    // Export as a MathNode
    return {
      type: "math",
      version: 1,
      equation: this.getTextContent(),
      inline: true,
    };
  }

  exportDOM(editor) {
    // Export as a MathNode
    const element = document.createElement("span");
    addClassNamesToElement(element, editor._config.theme.math.renderedInline);
    element.textContent = this.getTextContent();
    element.setAttribute("data-lexical-math", "true");
    element.setAttribute("data-math-inline", "true");
    return { element };
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
    const element = document.createElement("span");
    addClassNamesToElement(element, config.theme.math.highlightBlock);
    return element;
  }

  updateDOM() {
    return false;
  }

  static importJSON(serializedNode) {
    return null;
  }

  exportJSON() {
    return {
      type: "math",
      version: 1,
      equation: this.getTextContent(),
      inline: false,
    };
  }

  exportDOM(editor) {
    const element = document.createElement("span");
    addClassNamesToElement(element, editor._config.theme.math.renderedBlock);
    element.textContent = this.getTextContent();
    element.setAttribute("data-lexical-math", "true");
    element.setAttribute("data-math-inline", "false");
    return { element };
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
        // If the last child is a LineBreakNode, it means the user pressed Enter twice (once to create the break, once now).
        // In this case, we exit the block.
        if (lastChild && $isLineBreakNode(lastChild)) {
          lastChild.remove();
          const parentNode = $findMatchingParent(this, $isParagraphNode);
          const paragraphNode = $createParagraphNode();
          if (!parentNode) {
            this.insertAfter(paragraphNode);
          } else {
            parentNode.insertAfter(paragraphNode);
          }
          paragraphNode.select();
          return paragraphNode;
        } else {
          // Otherwise, we just insert a line break within the block.
          selection.insertLineBreak();
          return null;
        }
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
