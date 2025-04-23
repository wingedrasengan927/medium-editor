import Editor from "./Editor";
import { MathJaxContext } from "better-react-mathjax";
import { INLINE_DELIMITERS, DISPLAY_DELIMITERS } from "./Plugins/MathPlugin";
import { initialConfig } from "./editorConfig.js";
import { Button, Link } from "react-aria-components";
import { useRef } from "react";
import { $getRoot } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";

import "./App.css";

function Navbar({ onCopyHTML, onCopyJSON, onCopyText }) {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link
          className="navbar-btn"
          href="https://github.com/wingedrasengan927/medium-editor"
          target="_blank"
        >
          GitHub
        </Link>
      </div>
      <div className="action-grp">
        <Button className="navbar-btn" onPress={onCopyHTML}>
          Copy HTML
        </Button>
        <Button className="navbar-btn" onPress={onCopyJSON}>
          Copy JSON
        </Button>
        <Button className="navbar-btn" onPress={onCopyText}>
          Copy Text
        </Button>
      </div>
    </nav>
  );
}

function App() {
  const editorStateRef = useRef(null);
  const editorRef = useRef(null);

  const handleOnChange = (editorState) => {
    editorStateRef.current = editorState;
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  const handleCopyHTML = () => {
    const editor = editorRef.current;
    if (editor) {
      editor.read(() => {
        const htmlString = $generateHtmlFromNodes(editor, null);
        copyToClipboard(htmlString);
      });
    }
  };

  const handleCopyJSON = () => {
    if (editorStateRef.current) {
      const JSONObject = editorStateRef.current.toJSON();
      const JSONString = JSON.stringify(JSONObject, null, 2);
      copyToClipboard(JSONString);
    }
  };

  const handleCopyText = () => {
    if (editorStateRef.current) {
      const editorState = editorStateRef.current;
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent();
        copyToClipboard(textContent);
      });
    }
  };

  return (
    <div className="app-container">
      <Navbar
        onCopyHTML={handleCopyHTML}
        onCopyJSON={handleCopyJSON}
        onCopyText={handleCopyText}
      />
      <MathJaxContext
        config={{
          tex: {
            inlineMath: INLINE_DELIMITERS,
            displayMath: DISPLAY_DELIMITERS,
            noundefined: {
              color: "red",
              background: "",
              size: "",
            },
          },
        }}
      >
        <div className="editor-wrapper">
          <Editor
            initialConfig={initialConfig}
            onChange={handleOnChange}
            editorRef={editorRef}
          />
        </div>
      </MathJaxContext>
    </div>
  );
}

export default App;
