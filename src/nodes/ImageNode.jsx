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
    this.__attributes = {};
  }

  createDOM(config) {
    const element = document.createElement("figure");
    addClassNamesToElement(element, config.theme.img);
    return element;
  }

  updateDOM() {
    return false;
  }

  static importDOM() {
    return {
      figure: (node) => ({
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

    // Apply stored attributes
    for (const [name, value] of Object.entries(this.__attributes)) {
      imgElement.setAttribute(name, value);
    }

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
    const props = { src: this.getSrc(), ...this.__attributes };
    return <img {...props} />;
  }
}

function $convertImageElement(element) {
  let node = null;
  if (element.getAttribute("data-lexical-image-container") === "true") {
    const imgElement = element.querySelector("img");
    const src = imgElement.getAttribute("src");
    node = $createImageNode(src);

    // Store attributes
    for (const attr of imgElement.attributes) {
      if (attr.name !== "src") {
        node.__attributes[attr.name] = attr.value;
      }
    }
  }

  return { node };
}

export function $createImageNode(src) {
  return $applyNodeReplacement(new ImageNode(src));
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
