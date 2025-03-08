import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { initialConfig } from "./editorConfig.js";
import InlineToolbarPlugin from "./Plugins/InlineToolbarPlugin.jsx";
import { TextFormatPlugin } from "./Plugins/TextFormatPlugin.jsx";
import BlockToolbarPlugin from "./Plugins/BlockToolbarPlugin.jsx";

import "./editor-styles.css";

export default function Editor() {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <TextFormatPlugin />
      <InlineToolbarPlugin />
      <BlockToolbarPlugin />
      <AutoFocusPlugin />
      <HistoryPlugin />
    </LexicalComposer>
  );
}
