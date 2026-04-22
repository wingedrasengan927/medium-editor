import Editor from "./Editor";

import { initialConfig } from "./editorConfig.js";
import {
  Button,
  Link,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import { useEffect, useRef, useState } from "react";
import { $getRoot } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import initialEditorState from "./assets/initial_editor_state.json";

import "./App.css";

const BACKEND_URL = "http://localhost:8000";
const DEFAULT_ARTICLE_ID = "default";

function Navbar({
  articles,
  currentArticle,
  onImport,
  onExport,
  onCopyHTML,
  onCopyJSON,
  onCopyText,
}) {
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
        {currentArticle && (
          <span className="current-article">
            Current: <strong>{currentArticle.title}</strong>
          </span>
        )}
      </div>
      <div className="action-grp">
        <MenuTrigger>
          <Button className="navbar-btn" isDisabled={articles.length === 0}>
            Import ▾
          </Button>
          <Popover className="navbar-popover">
            <Menu
              className="navbar-menu"
              onAction={(key) => onImport(String(key))}
            >
              {articles.map((a) => (
                <MenuItem key={a.id} id={a.id} className="navbar-menu-item">
                  {a.title}
                </MenuItem>
              ))}
            </Menu>
          </Popover>
        </MenuTrigger>
        <Button className="navbar-btn" onPress={onExport}>
          Export
        </Button>
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

  const [articles, setArticles] = useState([]);
  const [currentArticleId, setCurrentArticleId] = useState(DEFAULT_ARTICLE_ID);
  const currentArticleIdRef = useRef(currentArticleId);
  currentArticleIdRef.current = currentArticleId;

  useEffect(() => {
    fetch(`${BACKEND_URL}/articles`)
      .then((r) => r.json())
      .then((data) => setArticles(data.articles ?? []))
      .catch((err) => console.error("failed to load articles", err));
  }, []);

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

  const handleImport = async (articleId) => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const res = await fetch(`${BACKEND_URL}/articles/${articleId}`);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const state = await res.json();
      editor.setEditorState(editor.parseEditorState(state));
      setCurrentArticleId(articleId);
    } catch (err) {
      console.error("import failed", err);
    }
  };

  const handleExport = async () => {
    const editorState = editorStateRef.current;
    if (!editorState) return;
    const payload = editorState.toJSON();
    try {
      const res = await fetch(
        `${BACKEND_URL}/articles/${currentArticleIdRef.current}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(`export failed: ${res.status}`);
    } catch (err) {
      console.error("export failed", err);
    }
  };

  const onImageUpload = async (file) => {
    const articleId = currentArticleIdRef.current;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BACKEND_URL}/articles/${articleId}/images`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`upload failed: ${res.status}`);
    }
    const { url } = await res.json();
    return url;
  };

  initialConfig.editorState = JSON.stringify(initialEditorState);

  const currentArticle = articles.find((a) => a.id === currentArticleId);

  return (
    <div className="app-container">
      <Navbar
        articles={articles}
        currentArticle={currentArticle}
        onImport={handleImport}
        onExport={handleExport}
        onCopyHTML={handleCopyHTML}
        onCopyJSON={handleCopyJSON}
        onCopyText={handleCopyText}
      />
      <div className="editor-wrapper">
        <Editor
          initialConfig={initialConfig}
          onChange={handleOnChange}
          editorRef={editorRef}
          blockToolbarGap={12}
          isHeadingOneFirst={true}
          spellCheck={false}
          onImageUpload={onImageUpload}
        />
      </div>
    </div>
  );
}

export default App;
