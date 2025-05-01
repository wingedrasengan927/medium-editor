// /vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  if (mode === "lib") {
    return {
      plugins: [react()],
      build: {
        outDir: path.resolve(__dirname, "dist-lib"),
        lib: {
          entry: {
            index: path.resolve(__dirname, "src/Editor.jsx"),
            editorConfig: path.resolve(__dirname, "src/editorConfig.js"),
          },
          formats: ["es"],
          fileName: (format, entryName) => `${entryName}.${format}.js`,
        },
        // Specify external dependencies (these won't be bundled)
        rollupOptions: {
          external: [
            "react",
            "react-dom",
            "lexical",
            "@lexical/react",
            "react-aria-components",
            "@tabler/icons-react",
            "better-react-mathjax",
          ],
          output: {},
        },
        sourcemap: true,
        emptyOutDir: true,
        cssCodeSplit: false,
      },
    };
  } else if (mode === "app") {
    return {
      plugins: [react()],
      build: {
        outDir: path.resolve(__dirname, "dist-app"),
        sourcemap: true,
        emptyOutDir: true,
      },
    };
  }
});
