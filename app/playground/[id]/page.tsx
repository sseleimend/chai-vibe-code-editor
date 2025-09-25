"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import LoadingStep from "@/modules/playground/components/loader";
import PlaygroundEditor from "@/modules/playground/components/playground-editor";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import ToggleAI from "@/modules/playground/components/toggle-ai";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { findFilePath } from "@/modules/playground/lib";
import {
  TemplateFile,
  TemplateFolder,
} from "@/modules/playground/lib/path-to-json";
import WebContainerPreview from "@/modules/webcontainers/components/webcontainer-preview";
import { useWebContainer } from "@/modules/webcontainers/hooks/useWebContainer";
import { TooltipContent } from "@radix-ui/react-tooltip";
import {
  AlertCircle,
  Bot,
  FileText,
  FolderOpen,
  Save,
  Settings,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

function Page() {
  const { id } = useParams<{ id: string }>();
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);

  const { playgroundData, templateData, isLoading, error, saveTemplateData } =
    usePlayground(id);

  const {
    selectedFileId,
    closeAllFiles,
    closeFile,
    openFile,
    openFiles,
    setTemplateData,
    setSelectedFileId,
    setPlaygroundId,
    setOpenFiles,
    handleAddFile,
    handleAddFolder,
    handleDeleteFile,
    handleDeleteFolder,
    handleRenameFile,
    handleRenameFolder,
    updateFileContent,
  } = useFileExplorer();

  const {
    instance,
    serverUrl,
    writeFileSync,
    isLoading: containerLoading,
    error: containerError,
  } = useWebContainer({
    templateData: templateData!,
  });

  const lastSyncedContent = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    setPlaygroundId(id);
  }, [id, setPlaygroundId]);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, setTemplateData, openFiles.length]);

  const wrapperHandleAddFile = useCallback(
    async (newFile: TemplateFile, parentPath: string) => {
      return await handleAddFile(
        newFile,
        parentPath,
        writeFileSync,
        instance,
        saveTemplateData
      );
    },
    [handleAddFile, instance, saveTemplateData, writeFileSync]
  );

  const wrapperHandleAddFolder = useCallback(
    async (folder: TemplateFolder, parentPath: string) => {
      return await handleAddFolder(
        folder,
        parentPath,
        instance,
        saveTemplateData
      );
    },
    [handleAddFolder, instance, saveTemplateData]
  );

  const wrapperHandleDeleteFile = useCallback(
    async (file: TemplateFile, parentPath: string) => {
      return await handleDeleteFile(file, parentPath, saveTemplateData);
    },
    [handleDeleteFile, saveTemplateData]
  );

  const wrapperHandleDeleteFolder = useCallback(
    async (folder: TemplateFolder, parentPath: string) => {
      return await handleDeleteFolder(folder, parentPath, saveTemplateData);
    },
    [handleDeleteFolder, saveTemplateData]
  );

  const wrapperHandleRenameFile = useCallback(
    async (
      file: TemplateFile,
      newFilename: string,
      newExtension: string,
      parentPath: string
    ) => {
      return await handleRenameFile(
        file,
        newFilename,
        newExtension,
        parentPath,
        saveTemplateData
      );
    },
    [handleRenameFile, saveTemplateData]
  );

  const wrapperHandleRenameFolder = useCallback(
    async (
      folder: TemplateFolder,
      newFolderName: string,
      parentPath: string
    ) => {
      return await handleRenameFolder(
        folder,
        newFolderName,
        parentPath,
        saveTemplateData
      );
    },
    [handleRenameFolder, saveTemplateData]
  );

  const selectedFile = openFiles.find((f) => f.id === selectedFileId);
  const hasUnsavedChanges = openFiles.some((f) => f.hasUnsavedChanges);

  const handleFileSelect = (file: TemplateFile) => {
    openFile(file);
  };

  const handleSave = useCallback(
    async (fileId?: string) => {
      const targetFileId = fileId || selectedFileId;
      if (!targetFileId) return;

      const fileToSave = openFiles.find((f) => f.id === targetFileId);
      if (!fileToSave) return;

      const latestTemplateData = useFileExplorer.getState().templateData;
      if (!latestTemplateData) return;

      try {
        const filePath = findFilePath(fileToSave, latestTemplateData);
        if (!filePath)
          throw new Error(
            "Could not find path for file: " +
              fileToSave.filename +
              "." +
              fileToSave.fileExtension
          );

        const updatedTemplateData = JSON.parse(
          JSON.stringify(latestTemplateData)
        );

        const updateFileContent = (
          items: (TemplateFile | TemplateFolder)[]
        ): (TemplateFile | TemplateFolder)[] =>
          items.map((item) => {
            if ("folderName" in item)
              return { ...item, items: updateFileContent(item.items) };
            else if (
              item.filename === fileToSave.filename &&
              item.fileExtension === fileToSave.fileExtension
            ) {
              return { ...item, content: fileToSave.content };
            }
            return item;
          });
        updatedTemplateData.items = updateFileContent(
          updatedTemplateData.items
        );

        if (writeFileSync) {
          writeFileSync(filePath, fileToSave.content);
          lastSyncedContent.current.set(fileToSave.id, fileToSave.content);
          if (instance && instance.fs) {
            await instance.fs.writeFile(filePath, fileToSave.content);
          }
        }

        await saveTemplateData(updatedTemplateData);
        setTemplateData(updatedTemplateData);

        const updatedOpenFiles = openFiles.map((f) =>
          f.id === targetFileId
            ? {
                ...f,
                hasUnsavedChanges: false,
                content: fileToSave.content,
                originalContent: fileToSave.content,
              }
            : f
        );
        setOpenFiles(updatedOpenFiles);

        toast.success(
          `Saved ${fileToSave.filename}.${fileToSave.fileExtension}`
        );
      } catch (error) {
        console.error("Error saving file:", error);
        toast.error(
          `Failed to save ${fileToSave.filename}.${fileToSave.fileExtension}`
        );
        throw error;
      }
    },
    [
      instance,
      openFiles,
      saveTemplateData,
      selectedFileId,
      setOpenFiles,
      setTemplateData,
      writeFileSync,
    ]
  );

  const handleSaveAll = useCallback(async () => {
    const unsavedFiles = openFiles.filter((f) => f.hasUnsavedChanges);

    if (unsavedFiles.length === 0) {
      toast.info("No changes to save");
      return;
    }

    try {
      await Promise.all(unsavedFiles.map((f) => handleSave(f.id)));
      toast.success("All files saved");
    } catch (error) {
      console.error("Error saving all files:", error);
      toast.error("Failed to save all files");
    }
  }, [handleSave, openFiles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAll();
        } else {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave, handleSaveAll]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center">
        <AlertCircle className="size-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button variant="destructive" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-md p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Loading playground...
          </h2>
          <div className="animate-pulse mb-8">
            <LoadingStep
              currentStep={1}
              step={1}
              label="Loading playground data"
            />
            <LoadingStep
              currentStep={2}
              step={2}
              label="Setting up environment"
            />
            <LoadingStep currentStep={3} step={3} label="Ready to code" />
          </div>
        </div>
      </div>
    );
  }

  if (!templateData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-4">
        <FolderOpen className="size-12 text-amber-500 mb-4" />
        <h2 className="yexy-xl font-semibold text-amber-600 mb-2">
          No template data found
        </h2>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Template
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <>
        <TemplateFileTree
          data={templateData!}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          title="File Explorer"
          onAddFile={wrapperHandleAddFile}
          onAddFolder={wrapperHandleAddFolder}
          onDeleteFile={wrapperHandleDeleteFile}
          onDeleteFolder={wrapperHandleDeleteFolder}
          onRenameFile={wrapperHandleRenameFile}
          onRenameFolder={wrapperHandleRenameFolder}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex flex-1 items-center gap-2">
              <div className="flex flex-col flex-1">
                <h1 className="text-sm font-medium">
                  {playgroundData?.title || "Untitled Playground"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {openFiles.length} File(s) Open
                  {hasUnsavedChanges && " • Unsaved Changes"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave()}
                      disabled={
                        !selectedFile || !selectedFile.hasUnsavedChanges
                      }
                    >
                      <Save className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save (Ctrl + S)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveAll()}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save className="size-4" /> All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save All (Ctrl + Shift + S)</TooltipContent>
                </Tooltip>
                <ToggleAI
                  isEnabled={true}
                  onToggle={() => {}}
                  suggestionLoading={false}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    >
                      {isPreviewVisible ? "Hide" : "Show"} Preview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={closeAllFiles}>
                      Close All Files
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="h-[calc(100vh-4rem)]">
            {openFiles.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="border-b bg-muted/30">
                  <Tabs
                    value={selectedFileId ?? ""}
                    onValueChange={setSelectedFileId}
                  >
                    <div className="flex items-center justify-between px-4 py-2">
                      <TabsList className="h-8 bg-transparent p-0">
                        {openFiles.map((file) => (
                          <TabsTrigger
                            key={file.id}
                            value={file.id}
                            className="relative h-8 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm group"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="size-3" />
                              <span>
                                {file.filename}.{file.fileExtension}
                              </span>
                              {file.hasUnsavedChanges && (
                                <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
                              )}
                              <span
                                className="ml-3 size-4 hover:bg-destructive hover:text-destructive-foreground rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeFile(file.id);
                                }}
                              >
                                <X className="size-4" />
                              </span>
                            </div>
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {openFiles.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={closeAllFiles}
                          className="h-6 px-2 text-xs"
                        >
                          Close All
                        </Button>
                      )}
                    </div>
                  </Tabs>
                </div>

                <div className="flex-1">
                  <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full"
                  >
                    <ResizablePanel defaultSize={isPreviewVisible ? 50 : 100}>
                      <PlaygroundEditor
                        selectedFile={selectedFile}
                        content={selectedFile?.content ?? ""}
                        onContentChange={(value) => {
                          if (!selectedFileId) return;
                          updateFileContent(selectedFileId, value);
                        }}
                      />
                    </ResizablePanel>

                    {isPreviewVisible && (
                      <>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={50}>
                          <WebContainerPreview
                            templateData={templateData!}
                            instance={instance}
                            writeFileSync={writeFileSync}
                            isLoading={containerLoading}
                            error={containerError}
                            serverUrl={serverUrl}
                            forceReStart={false}
                          />
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-4">
                <FileText className="size-16 text-gray-300" />
                <div className="text-center">
                  <p className="text-lg font-medium">No files opened</p>
                  <p className="text-sm text-gray-500">
                    Select a file from the sidebar to start editing
                  </p>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </>
    </TooltipProvider>
  );
}

export default Page;
