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
import { MathPlugin } from "./Plugins/MathPlugin.jsx";
import { CodePlugin } from "./Plugins/CodePlugin.jsx";
import { HorizontalDividerPlugin } from "./Plugins/HorizontalDividerPlugin.jsx";
import { ImagePlugin } from "./Plugins/ImagePlugin.jsx";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListPluginExtended } from "./Plugins/ListPluginExtended.jsx";
import { TabInterceptorPlugin } from "./Plugins/TabInterceptorPlugin.jsx";

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
      <MathPlugin />
      <CodePlugin />
      <HorizontalDividerPlugin />
      <ImagePlugin />
      <ListPlugin />
      <ListPluginExtended />
      <TabInterceptorPlugin />
    </LexicalComposer>
  );
}
