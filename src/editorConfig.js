import { HeadingNode, QuoteNode } from "@lexical/rich-text";

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
};

function onError(error) {
  console.error(error);
}

export const initialConfig = {
  editorState: null,
  namespace: "MyEditor",
  theme,
  onError,
  nodes: [HeadingNode, QuoteNode],
};
