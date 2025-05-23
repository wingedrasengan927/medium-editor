import {
  DecoratorNode,
  $applyNodeReplacement,
  $createNodeSelection,
  $setSelection,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";
import { MathJax } from "better-react-mathjax";

export class MathNode extends DecoratorNode {
  static getType() {
    return "math";
  }

  static clone(node) {
    return new MathNode(node.__equation, node.__inline, node.__key);
  }

  constructor(equation, inline, key) {
    super(key);
    this.__equation = equation;
    this.__inline = inline;
  }

  getEquation() {
    return this.__equation;
  }

  getTextContent() {
    return this.getEquation();
  }

  isInline() {
    return this.__inline;
  }

  select() {
    // only call during updates
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
    return nodeSelection;
  }

  createDOM(config) {
    const element = document.createElement("span");
    if (this.__inline) {
      addClassNamesToElement(element, config.theme.math.renderedInline);
    } else {
      addClassNamesToElement(element, config.theme.math.renderedBlock);
    }
    return element;
  }

  updateDOM() {
    return false;
  }

  static importDOM() {
    return {
      span: (node) => ({
        conversion: $convertMathElement,
        priority: 1,
      }),
    };
  }

  exportDOM(editor) {
    const { element } = super.exportDOM(editor); // calls the createDOM method
    element.textContent = this.getEquation();
    element.setAttribute("data-lexical-math", "true");
    element.setAttribute("data-math-inline", this.__inline.toString());
    return { element };
  }

  static importJSON(serializedNode) {
    const { equation, inline } = serializedNode;
    return $createMathNode(equation, inline).updateFromJSON(serializedNode);
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      equation: this.getEquation(),
      inline: this.isInline(),
    };
  }

  decorate() {
    return <MathJax inline={this.__inline}>{this.__equation}</MathJax>;
  }
}

function $convertMathElement(element) {
  let node = null;
  if (element.getAttribute("data-lexical-math") === "true") {
    const equation = element.textContent;
    const inlineAttr = element.getAttribute("data-math-inline");
    const inline = inlineAttr === "true";
    node = $createMathNode(equation, inline);
  }

  return { node };
}

export function $createMathNode(equation, inline) {
  return $applyNodeReplacement(new MathNode(equation, inline));
}

export function $isMathNode(node) {
  return node instanceof MathNode;
}
