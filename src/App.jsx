import Editor from "./Editor";
import { MathJaxContext } from "better-react-mathjax";
import { INLINE_DELIMITERS, DISPLAY_DELIMITERS } from "./Plugins/MathPlugin";

import "./App.css";

function App() {
  return (
    <div className="app-container">
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
          <Editor />
        </div>
      </MathJaxContext>
    </div>
  );
}

export default App;
