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
    const element = document.createElement(this.__inline ? "span" : "div");
    addClassNamesToElement(element, config.theme.math.rendered);
    return element;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <MathJax inline={this.__inline}>{this.__equation}</MathJax>;
  }
}

export function $createMathNode(equation, inline) {
  return $applyNodeReplacement(new MathNode(equation, inline));
}

export function $isMathNode(node) {
  return node instanceof MathNode;
}
