import {
  DecoratorNode,
  $applyNodeReplacement,
  $createNodeSelection,
  $setSelection,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

export class ImageNode extends DecoratorNode {
  static getType() {
    return "image";
  }

  static clone(node) {
    return new ImageNode(node.__src, node.__key);
  }

  constructor(src, key) {
    super(key);
    this.__src = src;
  }

  createDOM(config) {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.img);
    return element;
  }

  updateDOM() {
    return false;
  }

  select() {
    const nodeSelection = $createNodeSelection();
    nodeSelection.add(this.getKey());
    $setSelection(nodeSelection);
    return nodeSelection;
  }

  getSrc() {
    return this.__src;
  }

  getTextContent() {
    return "\n";
  }

  isInline() {
    return false;
  }

  decorate() {
    return <img src={this.getSrc()} />;
  }
}

export function $createImageNode(src) {
  return $applyNodeReplacement(new ImageNode(src));
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
