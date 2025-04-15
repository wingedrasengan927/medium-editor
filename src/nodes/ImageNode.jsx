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

  static importDOM() {
    return {
      div: (node) => ({
        conversion: $convertImageElement,
        priority: 1,
      }),
    };
  }

  exportDOM(editor) {
    const { element } = super.exportDOM(editor);
    element.setAttribute("data-lexical-image-container", "true");

    const imgElement = document.createElement("img");
    imgElement.setAttribute("src", this.getSrc());
    element.appendChild(imgElement);

    return { element };
  }

  static importJSON(serializedNode) {
    const { src } = serializedNode;
    return $createImageNode(src).updateFromJSON(serializedNode);
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      src: this.getSrc(),
    };
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

function $convertImageElement(element) {
  let node = null;
  if (element.getAttribute("data-lexical-image-container") === "true") {
    const imgElement = element.querySelector("img");
    const src = imgElement.getAttribute("src");
    node = $createImageNode(src);
  }

  return { node };
}

export function $createImageNode(src) {
  return $applyNodeReplacement(new ImageNode(src));
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
