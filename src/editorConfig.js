import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode } from "@lexical/link";
import { MathNode } from "./nodes/MathNode";
import {
  MathHighlightNodeInline,
  MathHighlightNodeBlock,
} from "./nodes/MathHighlightNode";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { HorizontalDividerNode } from "./nodes/HorizontalDividerNode";
import { ImageNode } from "./nodes/ImageNode";
import { ListItemNode, ListNode } from "@lexical/list";

const theme = {
  heading: {
    h1: "medium-h1",
    h2: "medium-h2",
    h3: "medium-h3",
  },
  text: {
    bold: "medium-bold",
    italic: "medium-italic",
    code: "medium-code",
  },
  quote: "medium-quote",
  link: "medium-link",
  divider: "medium-divider",
  math: {
    rendered: "math-rendered",
    highlightInline: "math-highlight-inline",
    highlightBlock: "math-highlight-block",
  },
  img: "medium-img",
  list: {
    nested: {
      listitem: "medium-nested-listitem",
    },
    ol: "medium-ol",
    ul: "medium-ul",
    listitem: "medium-listitem",
  },
  // code block
  code: "code-block",
  codeHighlight: {
    atrule: "tokenAttr",
    attr: "tokenAttr",
    boolean: "tokenProperty",
    builtin: "tokenSelector",
    cdata: "tokenComment",
    char: "tokenSelector",
    class: "tokenFunction",
    "class-name": "tokenFunction",
    comment: "tokenComment",
    constant: "tokenProperty",
    deleted: "tokenProperty",
    doctype: "tokenComment",
    entity: "tokenOperator",
    function: "tokenFunction",
    important: "tokenVariable",
    inserted: "tokenSelector",
    keyword: "tokenAttr",
    namespace: "tokenVariable",
    number: "tokenProperty",
    operator: "tokenOperator",
    prolog: "tokenComment",
    property: "tokenProperty",
    punctuation: "tokenPunctuation",
    regex: "tokenVariable",
    selector: "tokenSelector",
    string: "tokenSelector",
    symbol: "tokenProperty",
    tag: "tokenProperty",
    url: "tokenOperator",
    variable: "tokenVariable",
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
    HorizontalDividerNode,
    ImageNode,
    ListNode,
    ListItemNode,
  ],
};
