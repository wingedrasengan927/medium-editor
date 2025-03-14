import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode } from "@lexical/link";
import { MathNode } from "./nodes/MathNode";
import {
  MathHighlightNodeInline,
  MathHighlightNodeBlock,
} from "./nodes/MathHighlightNode";
import { CodeNode, CodeHighlightNode } from "@lexical/code";

const theme = {
  heading: {
    h1: "medium-editor-h1",
    h2: "medium-editor-h2",
    h3: "medium-editor-h3",
  },
  text: {
    bold: "medium-editor-bold",
    italic: "medium-editor-italic",
    code: "medium-editor-code",
  },
  quote: "medium-editor-quote",
  link: "medium-editor-link",
  math: {
    rendered: "math-rendered",
    highlightInline: "math-highlight-inline",
    highlightBlock: "math-highlight-block",
  },
};

function onError(error) {
  console.error(error);
}

export const initialConfig = {
  editorState: null,
  namespace: "MyEditor",
  theme,
  onError,
  nodes: [
    HeadingNode,
    QuoteNode,
    LinkNode,
    MathNode,
    MathHighlightNodeInline,
    MathHighlightNodeBlock,
    CodeNode,
    CodeHighlightNode,
  ],
};
