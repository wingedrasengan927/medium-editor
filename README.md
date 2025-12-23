# An Open Source Medium clone built with Lexical.
Please refer to the [guide](https://medium-editor-lmr5y.ondigitalocean.app/) for more details.

## Installation

### 1. Install Peer Dependencies

Before installing the main package, you need to ensure that all its peer dependencies are present in your project. This package assumes you are working within a React environment, so `react` and `react-dom` should ideally already be part of your project setup.

The primary peer dependencies you need to install are:

*   `@lexical/react`: ">=0.39.0"
*   `@tabler/icons-react`: ">=3.31.0"
*   `lexical`: ">=0.39.0"
*   `react-aria-components`: ">=1.8.0"

You can install them using npm. Adjust the versions if needed to match your project's requirements, ensuring they meet the minimum versions specified above.

**Using npm:**
```bash
npm install @lexical/react @tabler/icons-react lexical react-aria-components
```

### 2. Install Package

Once the peer dependencies are installed, you can proceed to install the main package.

To install the `lexical-medium-editor` package, run the following command:

```bash
npm install lexical-medium-editor
```

## Usage

Here is an example of how to use the editor in your project:

```jsx
import { useRef } from "react";
import Editor from "lexical-medium-editor";
import { initialConfig } from "lexical-medium-editor/config";
import "lexical-medium-editor/styles.css";

export default function App() {
  const editorRef = useRef(null);

  const handleOnChange = (editorState) => {
    console.log(editorState);
  };

  return (
    <Editor
      initialConfig={initialConfig}
      onChange={handleOnChange}
      editorRef={editorRef}
      blockToolbarGap={32}
      isHeadingOneFirst={false}
      spellCheck={false}
    />
  );
}
```

> [!TIP]
> You can also copy the CSS from `node_modules/lexical-medium-editor/dist-lib/lexical-medium-editor.css` into your own project and modify it to customize the editor's appearance.
