import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import "./editor-styles.css";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import InlineToolbarPlugin from "./Plugins/InlineToolbarPlugin.jsx";
import { TextFormatPlugin } from "./Plugins/TextFormatPlugin.jsx";
import BlockToolbarPlugin from "./Plugins/BlockToolbarPlugin.jsx";
import { MathInlinePlugin, MathBlockPlugin } from "./Plugins/MathPlugin.jsx";
import { CodePlugin } from "./Plugins/CodePlugin.jsx";
import { HorizontalDividerPlugin } from "./Plugins/HorizontalDividerPlugin.jsx";
import { ImagePlugin } from "./Plugins/ImagePlugin.jsx";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListPluginExtended } from "./Plugins/ListPluginExtended.jsx";
import { TabInterceptorPlugin } from "./Plugins/TabInterceptorPlugin.jsx";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorExposePlugin } from "./Plugins/EditorExposePlugin.jsx";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";

export default function Editor({
  initialConfig,
  onChange,
  editorRef,
  blockToolbarGap,
  spellCheck,
  isHeadingOneFirst,
}) {
  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable spellCheck={spellCheck} className="editor-input" />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <TextFormatPlugin isHeadingOneFirst={isHeadingOneFirst} />
      <InlineToolbarPlugin />
      <BlockToolbarPlugin toolbarGap={blockToolbarGap} />
      <AutoFocusPlugin />
      <HistoryPlugin />
      <MathInlinePlugin />
      <MathBlockPlugin />
      <CodePlugin />
      <HorizontalDividerPlugin />
      <ImagePlugin />
      <ListPlugin />
      <ListPluginExtended />
      <TabInterceptorPlugin />
      <OnChangePlugin onChange={onChange} />
      <EditorExposePlugin editorRef={editorRef} />
      <ClearEditorPlugin />
    </LexicalComposer>
  );
}
