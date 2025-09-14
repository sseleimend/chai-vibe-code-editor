"use client";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TemplateFileTree } from "@/modules/playground/components/playground-explorer";
import { useFileExplorer } from "@/modules/playground/hooks/useFileExplorer";
import { usePlayground } from "@/modules/playground/hooks/usePlayground";
import { TemplateFile } from "@/modules/playground/lib/path-to-json";
import { useParams } from "next/navigation";
import { useEffect } from "react";

function Page() {
  const { id } = useParams<{ id: string }>();

  const {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  } = usePlayground(id);

  const {
    selectedFileId,
    closeAllFiles,
    openFile,
    openFiles,
    setTemplateData,
    setSelectedFileId,
    setPlaygroundId,
    setOpenFiles,
  } = useFileExplorer();

  useEffect(() => {
    setPlaygroundId(id);
  }, [id, setPlaygroundId]);

  useEffect(() => {
    if (templateData && !openFiles.length) {
      setTemplateData(templateData);
    }
  }, [templateData, setTemplateData, openFiles.length]);

  const selectedFile = openFiles.find((f) => f.id === selectedFileId);
  const hasUnsavedChanges = openFiles.some((f) => f.hasUnsavedChanges);

  const handleFileSelect = (file: TemplateFile) => {
    openFile(file);
  };

  return (
    <TooltipProvider>
      <>
        <TemplateFileTree
          data={templateData!}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          title="File Explorer"
          onAddFile={() => {}}
          onAddFolder={() => {}}
          onDeleteFile={() => {}}
          onDeleteFolder={() => {}}
          onRenameFile={() => {}}
          onRenameFolder={() => {}}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </header>

          <div className="flex flex-1 items-center gap-2">
            <div className="flex flex-col flex-1">
              <h1 className="text-sm font-medium">
                {playgroundData?.title || "Untitled Playground"}
              </h1>
            </div>
          </div>
        </SidebarInset>
      </>
    </TooltipProvider>
  );
}

export default Page;
