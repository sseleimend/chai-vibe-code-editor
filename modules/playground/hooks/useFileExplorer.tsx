import { create } from "zustand";
import { toast } from "sonner";
import { TemplateFolder, TemplateFile } from "../lib/path-to-json";
import { generateFileId } from "../lib";

interface OpenFile extends TemplateFile {
  id: string;
  hasUnsavedChanges: boolean;
  originalContent: string;
}

interface FileExplorerState {
  playgroundId: string;
  templateData: TemplateFolder | null;
  openFiles: OpenFile[];
  selectedFileId: string | null;
  editorContent: string;

  setPlaygroundId: (id: string) => void;
  setTemplateData: (data: TemplateFolder | null) => void;
  setOpenFiles: (files: OpenFile[]) => void;
  setSelectedFileId: (id: string | null) => void;
  setEditorContent: (content: string) => void;

  openFile: (file: TemplateFile) => void;
  closeFile: (fileId: string) => void;
  closeAllFiles: () => void;
}

export const useFileExplorer = create<FileExplorerState>((set, get) => ({
  playgroundId: "",
  templateData: null,
  openFiles: [],
  selectedFileId: null,
  editorContent: "",

  setPlaygroundId: (id) => set({ playgroundId: id }),
  setTemplateData: (data) => set({ templateData: data }),
  setOpenFiles: (files) => set({ openFiles: files }),
  setSelectedFileId: (id) => set({ selectedFileId: id }),
  setEditorContent: (content) => set({ editorContent: content }),

  openFile: (file) => {
    const fileId = generateFileId(file, get().templateData!);
    const { openFiles } = get();
    const existingFile = openFiles.find((f) => f.id === fileId);
    if (existingFile) {
      set({
        selectedFileId: existingFile.id,
        editorContent: existingFile.content,
      });
      return;
    }

    const newOpenFile: OpenFile = {
      ...file,
      id: fileId,
      hasUnsavedChanges: false,
      content: file.content ?? "",
      originalContent: file.content ?? "",
    };

    set((state) => ({
      openFiles: [...state.openFiles, newOpenFile],
      selectedFileId: newOpenFile.id,
      editorContent: newOpenFile.content,
    }));
  },
  closeFile: (fileId) => {
    const { openFiles, selectedFileId } = get();
    const newFiles = openFiles.filter((f) => f.id !== fileId);

    let newSelectedFileId = selectedFileId;
    let newEditorContent = get().editorContent;

    if (selectedFileId === fileId && newFiles.length) {
      newSelectedFileId = newFiles[newFiles.length - 1].id;
      newEditorContent = newFiles[newFiles.length - 1].content;
    } else if (newFiles.length === 0) {
      newSelectedFileId = null;
      newEditorContent = "";
    }

    set({
      openFiles: newFiles,
      selectedFileId: newSelectedFileId,
      editorContent: newEditorContent,
    });
  },
  closeAllFiles: () => {
    const { setOpenFiles, setSelectedFileId, setEditorContent } = get();
    setOpenFiles([]);
    setSelectedFileId(null);
    setEditorContent("");
  },
}));
