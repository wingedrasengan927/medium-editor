import { DecoratorNode, $applyNodeReplacement } from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

function SVGDot() {
  const dotSize = 6;
  const radius = dotSize / 2;
  const viewBox = `0 0 ${dotSize} ${dotSize}`;

  return (
    <svg
      width={dotSize}
      height={dotSize}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx={radius} cy={radius} r={radius} />
    </svg>
  );
}

export class HorizontalDividerNode extends DecoratorNode {
  static getType() {
    return "horizontal-divider";
  }

  static clone(node) {
    return new HorizontalDividerNode(node.__key);
  }

  createDOM(config) {
    const element = document.createElement("div");
    addClassNamesToElement(element, config.theme.divider);
    return element;
  }

  getTextContent() {
    return "\n";
  }

  isInline() {
    return false;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return (
      <>
        <SVGDot />
        <SVGDot />
        <SVGDot />
      </>
    );
  }
}

export function $createHorizontalDividerNode() {
  return $applyNodeReplacement(new HorizontalDividerNode());
}

export function $isHorizontalDividerNode(node) {
  return node instanceof HorizontalDividerNode;
}
