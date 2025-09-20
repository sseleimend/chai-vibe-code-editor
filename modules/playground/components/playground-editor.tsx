"use client";

import { useCallback, useEffect, useRef } from "react";
import { TemplateFile } from "../lib/path-to-json";
import { Editor, Monaco } from "@monaco-editor/react";
import {
  configureMonaco,
  defaultEditorOptions,
  getEditorLanguage,
} from "../lib/editor-config";
import { editor } from "monaco-editor";

interface PlaygroundEditorProps {
  selectedFile: TemplateFile | undefined;
  content: string;
  onContentChange: (newContent: string) => void;
}

function PlaygroundEditor({
  selectedFile,
  content,
  onContentChange,
}: PlaygroundEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.updateOptions({
      ...defaultEditorOptions,
    });

    configureMonaco(monaco);

    updateEditorLanguage();
  };

  const updateEditorLanguage = useCallback(() => {
    if (!selectedFile || !monacoRef.current || !editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const language = getEditorLanguage(selectedFile.fileExtension ?? "");

    try {
      monacoRef.current.editor.setModelLanguage(model, language);
    } catch {
      console.warn(
        `Language "${language}" is not supported. Falling back to plaintext.`
      );
    }
  }, [selectedFile]);

  useEffect(() => {
    updateEditorLanguage();
  }, [updateEditorLanguage]);

  return (
    <div className="h-full relative">
      <Editor
        height="100%"
        value={content}
        onChange={(value) => onContentChange(value || "")}
        onMount={handleEditorDidMount}
        language={
          selectedFile
            ? getEditorLanguage(selectedFile.fileExtension ?? "")
            : "plaintext"
        }
        options={defaultEditorOptions}
      />
    </div>
  );
}

export default PlaygroundEditor;
