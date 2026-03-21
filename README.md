# An Open Source Medium clone built with Lexical.
Please refer to the [guide](https://medium-editor-lmr5y.ondigitalocean.app/) for more details.

## Installation

The first step is to install peer dependencies in your project. This package assumes you are working within a React environment, so `react` and `react-dom` should ideally already be part of your project setup. The primary peer dependencies you need to install are:

* `@lexical/react`: ">=0.39.0"
* `@tabler/icons-react`: ">=3.31.0"
* `lexical`: ">=0.39.0"
* `react-aria-components`: ">=1.8.0"

You can install them using npm. Adjust the versions if needed to match your project's requirements, ensuring they meet the minimum versions specified above. The command to add to install the peer dependencies using npm is:

```bash
npm install @lexical/react @tabler/icons-react lexical react-aria-components
```

There are other dependencies as well which are listed in the `package.json` file. However, they will be automatically installed by npm. You don't need to manually install them.

Once the peer dependencies are installed, you can proceed to install the main package. To install using npm, the command is:

```bash
npm install lexical-medium-editor@latest
```

## Usage

Once the setup is done, you can create and use an `Editor` component that closely resembles this page as follows:

First create an `Editor` component and the associated css as follows:

- `src`
  - `components`
    - `Editor.jsx`
    - `editor_styles.css`
  - `App.jsx`

The `Editor.jsx` file should look like this:

```jsx
import { useRef } from "react";
import { Button } from "react-aria-components";
import { $getRoot } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import LexicalEditor from "lexical-medium-editor";
import { initialConfig } from "lexical-medium-editor/config";
import "lexical-medium-editor/styles.css";
import "./editor_styles.css";

function Navbar({ onCopyHTML, onCopyJSON, onCopyText }) {
  return (
    <nav className="navbar">
      <div className="navbar-links" />
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

export default function Editor() {
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
      const jsonString = JSON.stringify(editorStateRef.current.toJSON(), null, 2);
      copyToClipboard(jsonString);
    }
  };

  const handleCopyText = () => {
    if (editorStateRef.current) {
      editorStateRef.current.read(() => {
        const textContent = $getRoot().getTextContent();
        copyToClipboard(textContent);
      });
    }
  };

  return (
    <>
      <Navbar
        onCopyHTML={handleCopyHTML}
        onCopyJSON={handleCopyJSON}
        onCopyText={handleCopyText}
      />
      <div className="editor-wrapper">
        <LexicalEditor
          initialConfig={initialConfig}
          onChange={handleOnChange}
          editorRef={editorRef}
          blockToolbarGap={32}
          isHeadingOneFirst={false}
          spellCheck={false}
        />
      </div>
    </>
  );
}
```

The `editor_styles.css` file should look like this:

```css
.editor-wrapper {
  margin: 0 auto;
  width: 50%;
}

@media (max-width: 1200px) {
  .editor-wrapper {
    width: 65%;
  }
}

@media (max-width: 992px) {
  .editor-wrapper {
    width: 75%;
  }
}

@media (max-width: 768px) {
  .editor-wrapper {
    width: 85%;
  }
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: white;
  border-bottom: 4px solid #fff34e;
  margin-bottom: 32px;
  height: 64px;
  box-sizing: border-box;
}

.action-grp {
  gap: 8px;
  display: flex;
}

.navbar-btn {
  color: var(--text-color-dark);
  background: var(--button-background-dark);
  border: 1px solid var(--border-color-dark);
  border-radius: 4px;
  appearance: none;
  vertical-align: middle;
  font-size: 1rem;
  text-align: center;
  margin: 0;
  outline: none;
  padding: 6px 10px;
  text-decoration: none;
  font-family: "firacode", monospace;
  cursor: pointer;

  &[data-pressed] {
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.1);
    background: var(--button-background-pressed-dark);
    border-color: var(--border-color-pressed-dark);
  }

  &[data-focus-visible] {
    outline: 2px solid var(--focus-ring-color-dark);
    outline-offset: -1px;
  }
}

@media (max-width: 576px) {
  .navbar {
    padding: 8px;
    margin-bottom: 16px;
  }

  .action-grp {
    gap: 4px;
  }

  .navbar-btn {
    padding: 4px 8px;
    font-size: 0.875rem;
  }


  .editor-wrapper {
    width: 95%;
  }
}

@media (max-width: 400px) {
  .navbar {
    flex-direction: column;
    height: auto;
    padding: 8px;
  }

  .action-grp {
    margin-top: 8px;
    width: 100%;
    justify-content: space-between;
  }

  .editor-wrapper {
    width: 100%;
  }
}
```

Now you can import and use this component into your main `App.jsx` component and use it like so:

```jsx
import Editor from "./components/Editor";
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Editor />
    </div>
  );
}

export default App;
```

One final change. To use LaTeX, you need to load MathJax v4 into your `index.html` file. This can be done by adding the following tags:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>medium-blog-editor</title>
    <script>
      window.MathJax = {
        tex: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
          displayMath: [
            ["$$", "$$"],
            ["\\[", "\\]"],
          ],
        },
        chtml: {
          displayOverflow: "scroll",
          linebreaks: {
            inline: true,
          },
        },
        startup: {
          typeset: false,
        },
      };
    </script>
    <script
      type="text/javascript"
      id="MathJax-script"
      async
      src="https://cdn.jsdelivr.net/npm/mathjax@4.1.0/tex-mml-chtml.js"
    ></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

That's it. You're ready to go!

Note that this was tested on vite build. It was not thoroughly tested for each scenario. So there's a good chance that you'll encounter errors. If you do, please email them to me at ms.neerajkrishna@gmail.com or you can also raise an issue in the GitHub repository.
