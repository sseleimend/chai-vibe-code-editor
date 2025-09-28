import { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useState, useCallback } from "react";

interface AISuggestionState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number };
  decoration: string[];
  isEnabled: boolean;
}

interface UseAISuggestionReturn extends AISuggestionState {
  toggleEnabled: () => void;
  fetchSuggestion: (
    type: string,
    editor: editor.IStandaloneCodeEditor | null
  ) => Promise<void>;
  acceptSuggestion: (
    editor: editor.IStandaloneCodeEditor | null,
    monaco: Monaco
  ) => void;
  rejectSuggestion: (editor: editor.IStandaloneCodeEditor | null) => void;
  clearSuggestion: (editor: editor.IStandaloneCodeEditor | null) => void;
}

export const useAISuggestion = (): UseAISuggestionReturn => {
  const [state, setState] = useState<AISuggestionState>({
    suggestion: null,
    isLoading: false,
    position: { line: 0, column: 0 },
    decoration: [],
    isEnabled: true,
  });

  const toggleEnabled = useCallback(() => {
    setState((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const fetchSuggestion = useCallback(
    async (type: string, editor: editor.IStandaloneCodeEditor | null) => {
      setState((currentState) => {
        if (!currentState.isEnabled) return currentState;
        if (!editor) return currentState;

        const model = editor.getModel();
        const cursorPosition = editor.getPosition();
        if (!model || !cursorPosition) return currentState;

        const newState: AISuggestionState = {
          ...currentState,
          isLoading: true,
        };

        (async () => {
          try {
            const payload = {
              fileContent: model.getValue(),
              cursorLine: cursorPosition.lineNumber - 1,
              cursorColumn: cursorPosition.column - 1,
              suggestionType: type,
            };

            const res = await fetch("/api/code-completion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Failed to fetch suggestion");

            const data = await res.json();
            if (data?.suggestion) {
              const suggestionText = data?.suggestion?.trim();
              setState((prev) => ({
                ...prev,
                suggestion: suggestionText,
                position: {
                  line: cursorPosition.lineNumber,
                  column: cursorPosition.column,
                },
                isLoading: false,
              }));
            } else {
              setState((prev) => ({ ...prev, isLoading: false }));
            }
          } catch (error) {
            console.error("Error fetching AI suggestion:", error);
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        })();

        return newState;
      });
    },
    []
  );

  const acceptSuggestion = useCallback(
    (editor: editor.IStandaloneCodeEditor | null, monaco: Monaco) => {
      setState((currentState) => {
        if (
          !currentState.suggestion ||
          !currentState.position ||
          !editor ||
          !monaco
        )
          return currentState;

        const { line, column } = currentState.position;
        const sanitizedSuggestion = currentState.suggestion.replace(
          /^\d+:\s*/gm,
          ""
        );

        editor.executeEdits("", [
          {
            range: new monaco!.Range(line, column, line, column),
            text: sanitizedSuggestion,
            forceMoveMarkers: true,
          },
        ]);

        if (editor && currentState.decoration.length > 0) {
          editor.createDecorationsCollection([]).clear();
        }

        return {
          ...currentState,
          suggestion: null,
          position: { line: 0, column: 0 },
          decoration: [],
        };
      });
    },
    []
  );

  const rejectSuggestion = useCallback(
    (editor: editor.IStandaloneCodeEditor | null) => {
      setState((currentState) => {
        if (editor && currentState.decoration.length > 0) {
          editor.createDecorationsCollection([]).clear();
        }

        return {
          ...currentState,
          suggestion: null,
          position: { line: 0, column: 0 },
          decoration: [],
        };
      });
    },
    []
  );

  const clearSuggestion = useCallback(
    (editor: editor.IStandaloneCodeEditor | null) => {
      setState((currentState) => {
        if (editor && currentState.decoration.length > 0) {
          editor.createDecorationsCollection([]).clear();
        }

        return {
          ...currentState,
          suggestion: null,
          position: { line: 0, column: 0 },
          decoration: [],
        };
      });
    },
    []
  );

  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};
